package kr.codeit.onboarding.service;

import kr.codeit.onboarding.domain.entity.*;
import kr.codeit.onboarding.domain.enums.InstructorType;
import kr.codeit.onboarding.domain.enums.OnboardingModule;
import kr.codeit.onboarding.domain.enums.StepType;
import kr.codeit.onboarding.domain.enums.TaskStatus;
import kr.codeit.onboarding.domain.enums.TimingVariable;
import kr.codeit.onboarding.domain.enums.UserRole;
import kr.codeit.onboarding.dto.*;
import kr.codeit.onboarding.exception.DuplicateResourceException;
import kr.codeit.onboarding.exception.ResourceNotFoundException;
import kr.codeit.onboarding.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Service for managing instructor profiles and onboarding workflows.
 *
 * <p>This service handles:
 * <ul>
 *   <li>Instructor registration with automatic onboarding initialization</li>
 *   <li>Access code generation based on track, cohort, and name</li>
 *   <li>Instructor information retrieval with authorization checks</li>
 *   <li>Dashboard data aggregation with progress calculation</li>
 *   <li>Onboarding step management and progress tracking</li>
 * </ul>
 *
 * <p>Key features:
 * <ul>
 *   <li>Instructors can only access their own data</li>
 *   <li>PM can access all instructor data</li>
 *   <li>Optimized queries to prevent N+1 problems</li>
 *   <li>D-day calculation for sorting</li>
 * </ul>
 *
 * @author Sprint Tutor Team
 * @since 1.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InstructorService {

    private final InstructorRepository instructorRepository;
    private final UserRepository userRepository;
    private final TrackRepository trackRepository;
    private final OnboardingStepRepository stepRepository;
    private final StepDefinitionRepository stepDefinitionRepository;
    private final TaskRepository taskRepository;
    private final QuizAnswerRepository quizAnswerRepository;
    private final InstructorChecklistItemRepository checklistItemRepository;
    private final FileUploadRepository fileUploadRepository;
    private final kr.codeit.onboarding.security.SecurityContext securityContext;
    private final OnboardingInitializationService onboardingInitializationService;
    private final ModuleConfigurationService moduleConfigurationService;
    private final AuditLogService auditLogService;
    private final ContentModuleRepository contentModuleRepository;

    // Constants
    private static final int DEFAULT_D_DAY = 999;
    private static final int MAX_ACCESS_CODE_ATTEMPTS = 10000;

    @Transactional
    public InstructorResponse registerInstructor(InstructorRegistrationRequest request) {
        // Check if email already exists (탈퇴한 사용자 제외)
        if (userRepository.existsByEmailAndNotDeleted(request.getEmail())) {
            throw new DuplicateResourceException("이미 등록된 이메일입니다: " + request.getEmail());
        }

        // Create User
        // Instructors login with access code, so email verification is not required
        // Automatically activated upon registration
        User user = User.builder()
                .email(request.getEmail())
                .name(request.getName())
                .role(UserRole.INSTRUCTOR)
                .emailVerified(true)  // Email verification not required for instructors
                .enabled(true)        // Automatically enabled upon registration
                .build();
        user = userRepository.save(user);

        // Find Track entity - try by name (exact match first, then case-insensitive), then by Korean name, then by code
        String trackInput = request.getTrack().trim();
        log.info("Looking for track with input: '{}'", trackInput);
        
        Track track = trackRepository.findByName(trackInput)  // Exact match first
                .orElseGet(() -> {
                    log.debug("Exact match not found, trying case-insensitive match");
                    return trackRepository.findAll().stream()
                            .filter(t -> t.getName().equalsIgnoreCase(trackInput))
                            .findFirst()
                            .orElseGet(() -> {
                                log.debug("Case-insensitive match not found, trying Korean name");
                                return trackRepository.findByKoreanName(trackInput)
                                        .orElseGet(() -> {
                                            log.debug("Korean name match not found, trying code");
                                            return trackRepository.findByCode(trackInput.toUpperCase())
                                                    .orElseThrow(() -> {
                                                        List<Track> allTracks = trackRepository.findAll();
                                                        String availableTracks = allTracks.stream()
                                                                .map(t -> t.getKoreanName() + " (" + t.getName() + " / " + t.getCode() + ")")
                                                                .collect(Collectors.joining(", "));
                                                        log.error("Track not found: '{}'. Available tracks: {}", trackInput, availableTracks);
                                                        return new ResourceNotFoundException(
                                                                "Track not found: " + request.getTrack() + 
                                                                ". Available tracks: " + availableTracks);
                                                    });
                                        });
                            });
                });
        
        if (track == null) {
            log.error("Track is null after search! Input was: '{}'", trackInput);
            throw new ResourceNotFoundException("트랙을 찾을 수 없습니다. 입력값: '" + trackInput + "'. 트랙이 삭제되었거나 존재하지 않는지 확인해주세요.");
        }
        
        // Ensure Track is managed (re-fetch if needed to avoid detached entity issues)
        Long trackId = track.getId();
        if (!trackRepository.existsById(trackId)) {
            log.warn("Track {} is not managed, re-fetching...", trackId);
            track = trackRepository.findById(trackId)
                    .orElseThrow(() -> new ResourceNotFoundException("Track not found after re-fetch: " + trackId));
        }
        
        log.info("Found track: ID={}, Name={}, Korean={}, Code={}", 
                track.getId(), track.getName(), track.getKoreanName(), track.getCode());

        // Generate access code
        String accessCode = generateAccessCode(request, track);

        // Determine instructor type (default to NEWBIE if not provided)
        InstructorType instructorType = request.getInstructorType() != null
                ? InstructorType.fromKorean(request.getInstructorType())
                : InstructorType.NEWBIE;
        if (instructorType == null) {
            instructorType = InstructorType.NEWBIE; // Default fallback
        }

        // Calculate timing variable based on start date
        TimingVariable timingVariable = TimingVariable.calculate(request.getStartDate());

        // Determine onboarding module based on type + timing
        OnboardingModule onboardingModule = OnboardingModule.determine(instructorType, timingVariable);

        // Create Instructor
        log.info("Creating instructor with track ID: {}", track.getId());
        Instructor instructor = Instructor.builder()
                .user(user)
                .phone(request.getPhone())
                .track(track)  // Use Track entity
                .cohort(request.getCohort())
                .accessCode(accessCode)
                .startDate(request.getStartDate())
                .instructorType(instructorType)
                .onboardingModule(onboardingModule)
                .selectedStepTemplateId(null)  // StepTemplate was removed
                .currentStep(1)
                .overallProgress(0)
                .build();

        log.info("Instructor before save - track: {}", instructor.getTrack() != null ? instructor.getTrack().getId() : "NULL");
        instructor = instructorRepository.save(instructor);
        log.info("Instructor after save - ID: {}, track_id: {}", instructor.getId(), instructor.getTrack() != null ? instructor.getTrack().getId() : "NULL");

        // Initialize onboarding steps based on module configuration
        // Priority: 1) stepConfigurations (with module toggles), 2) selectedStepDefinitionIds, 3) default
        if (request.getStepConfigurations() != null && !request.getStepConfigurations().isEmpty()) {
            // NEW: Use StepModuleConfiguration for granular module control per step
            log.info("Initializing instructor {} with {} step configurations (with module toggles)",
                    instructor.getId(), request.getStepConfigurations().size());
            onboardingInitializationService.initializeFromStepConfigurations(instructor, request.getStepConfigurations(), onboardingModule);
        } else if (request.getSelectedStepDefinitionIds() != null && !request.getSelectedStepDefinitionIds().isEmpty()) {
            // DEPRECATED: Use custom selected step definitions with module configuration
            log.info("Initializing instructor {} with {} step definition IDs (deprecated)",
                    instructor.getId(), request.getSelectedStepDefinitionIds().size());
            onboardingInitializationService.initializeFromStepDefinitions(instructor, request.getSelectedStepDefinitionIds(), onboardingModule);
        } else {
            // Use module-based steps (determined by instructor type + timing)
            log.info("Initializing instructor {} with default module-based steps (module: {})",
                    instructor.getId(), onboardingModule.name());
            onboardingInitializationService.initializeOnboardingStepsWithModule(instructor, onboardingModule);
        }

        return toInstructorResponse(instructor);
    }

    /**
     * Get instructor by ID - Only PM can access any instructor, instructors can only access their own data
     */
    public InstructorResponse getInstructor(Long instructorId) {
        // Authorization check
        if (securityContext.isInstructor()) {
            Long currentInstructorId = getCurrentInstructorId();
            if (!currentInstructorId.equals(instructorId)) {
                throw new kr.codeit.onboarding.exception.UnauthorizedException("You can only access your own data");
            }
        }
        // PM can access any instructor

        Instructor instructor = instructorRepository.findById(instructorId)
                .orElseThrow(() -> new ResourceNotFoundException("Instructor not found"));

        return toInstructorResponse(instructor);
    }

    /**
     * Get all instructors with pagination - Only PM can access this
     * D-day 기준으로 정렬 (기본값)
     */
    public Page<InstructorResponse> getAllInstructors(Pageable pageable) {
        securityContext.requirePm();
        
        // D-day 기준 정렬인 경우 Service 레이어에서 정렬 처리
        Sort sort = pageable.getSort();
        if (sort.isSorted() && sort.stream().anyMatch(order -> order.getProperty().equals("dday"))) {
            // 모든 Instructor와 첫 번째 Step을 함께 조회
            List<Instructor> allInstructors = instructorRepository.findAllWithUserAndFirstStep();
            
            // 각 Instructor의 첫 번째 Step 조회 (배치로 처리)
            List<Long> instructorIds = allInstructors.stream()
                    .map(Instructor::getId)
                    .collect(Collectors.toList());
            
            if (!instructorIds.isEmpty()) {
                List<OnboardingStep> firstSteps = stepRepository.findByInstructorIdInAndStepNumber(instructorIds, 1);
                Map<Long, Integer> dDayMap = firstSteps.stream()
                        .collect(Collectors.toMap(
                                step -> step.getInstructor().getId(),
                                OnboardingStep::getDDay,
                                (existing, replacement) -> existing
                        ));
                
                // D-day 기준으로 정렬
                allInstructors.sort((a, b) -> {
                    Integer dDayA = dDayMap.getOrDefault(a.getId(), 999);
                    Integer dDayB = dDayMap.getOrDefault(b.getId(), 999);
                    
                    int dDayCompare = dDayA.compareTo(dDayB);
                    if (dDayCompare != 0) {
                        return dDayCompare;
                    }
                    // D-day가 같으면 createdAt DESC
                    return b.getCreatedAt().compareTo(a.getCreatedAt());
                });
            }
            
            // 메모리에서 페이징 처리
            int start = (int) pageable.getOffset();
            int end = Math.min(start + pageable.getPageSize(), allInstructors.size());
            List<Instructor> pagedInstructors = allInstructors.subList(start, end);
            
            List<InstructorResponse> responses = pagedInstructors.stream()
                    .map(this::toInstructorResponse)
                    .collect(Collectors.toList());
            
            return new org.springframework.data.domain.PageImpl<>(
                    responses,
                    pageable,
                    allInstructors.size()
            );
        }
        
        // 기본 정렬 (createdAt 등)
        // Track과 User를 fetch하기 위해 먼저 모든 데이터를 조회한 후 메모리에서 페이징 처리
        List<Instructor> allInstructors = instructorRepository.findAllWithUserAndTrack();
        
        // 정렬 적용
        Sort pageableSort = pageable.getSort();
        if (pageableSort.isSorted()) {
            for (Sort.Order order : pageableSort) {
                String property = order.getProperty();
                Sort.Direction direction = order.getDirection();
                
                allInstructors.sort((a, b) -> {
                    int comparison = 0;
                    switch (property) {
                        case "createdAt":
                            comparison = a.getCreatedAt().compareTo(b.getCreatedAt());
                            break;
                        case "name":
                            comparison = a.getUser().getName().compareTo(b.getUser().getName());
                            break;
                        case "startDate":
                            comparison = a.getStartDate().compareTo(b.getStartDate());
                            break;
                        default:
                            comparison = 0;
                    }
                    return direction == Sort.Direction.ASC ? comparison : -comparison;
                });
            }
        }
        
        // 메모리에서 페이징 처리
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), allInstructors.size());
        List<Instructor> pagedInstructors = allInstructors.subList(start, end);
        
        List<InstructorResponse> responses = pagedInstructors.stream()
                .map(this::toInstructorResponse)
                .collect(Collectors.toList());
        
        return new org.springframework.data.domain.PageImpl<>(
                responses,
                pageable,
                allInstructors.size()
        );
    }

    /**
     * Get instructor with steps - Only PM can access any instructor, instructors can only access their own data
     * OPTIMIZED: Batch fetches to prevent N+1 query problem
     */
    public InstructorResponse getInstructorWithSteps(Long instructorId) {
        // Authorization check
        if (securityContext.isInstructor()) {
            Long currentInstructorId = getCurrentInstructorId();
            if (!currentInstructorId.equals(instructorId)) {
                throw new kr.codeit.onboarding.exception.UnauthorizedException("You can only access your own data");
            }
        }
        // PM can access any instructor

        Instructor instructor = instructorRepository.findById(instructorId)
                .orElseThrow(() -> new ResourceNotFoundException("Instructor not found"));

        List<OnboardingStep> steps = stepRepository.findByInstructorIdWithTasks(instructorId);

        // OPTIMIZATION: Batch fetch all related data at once to prevent N+1 queries
        // Fetch all quiz answers for this instructor (1 query instead of N)
        // Note: Only objective answers are stored in this map (Integer)
        Map<Long, Integer> quizAnswerMap = quizAnswerRepository.findByInstructorId(instructorId)
                .stream()
                .filter(qa -> qa.getSelectedAnswerIndex() != null) // Only objective answers
                .collect(Collectors.toMap(
                        qa -> qa.getQuestion().getId(),
                        QuizAnswer::getSelectedAnswerIndex,
                        (existing, replacement) -> replacement // Handle duplicates
                ));

        // Fetch all checklist item statuses for this instructor (1 query instead of N)
        Map<Long, Boolean> checklistStatusMap = checklistItemRepository.findByInstructorId(instructorId)
                .stream()
                .collect(Collectors.toMap(
                        ic -> ic.getChecklistItem().getId(),
                        InstructorChecklistItem::getIsChecked,
                        (existing, replacement) -> replacement
                ));

        // Fetch all file uploads for this instructor (1 query instead of N)
        Map<Long, List<FileUpload>> fileUploadMap = fileUploadRepository.findByInstructorId(instructorId)
                .stream()
                .collect(Collectors.groupingBy(fu -> fu.getTask().getId()));

        InstructorResponse response = toInstructorResponse(instructor);
        response.setSteps(steps.stream()
                .map(step -> toStepResponse(step, instructorId, quizAnswerMap, checklistStatusMap, fileUploadMap))
                .collect(Collectors.toList()));

        return response;
    }

    /**
     * Get the instructor ID for the currently authenticated user
     */
    public Long getCurrentInstructorId() {
        securityContext.requireInstructor();
        Long userId = securityContext.getCurrentUserId();
        Instructor instructor = instructorRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Instructor profile not found"));
        return instructor.getId();
    }

    /**
     * Get dashboard for current authenticated instructor with all steps and tasks
     */
    public InstructorDashboardResponse getInstructorDashboard() {
        securityContext.requireInstructor();
        Long userId = securityContext.getCurrentUserId();
        
        Instructor instructor = instructorRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Instructor profile not found"));

        // Get all steps with tasks
        List<OnboardingStep> steps = stepRepository.findByInstructorIdOrderByStepNumber(instructor.getId());

        // Prepare data maps for quiz answers, checklist status, and file uploads
        Map<Long, Integer> quizAnswerMap = new java.util.HashMap<>();
        Map<Long, Boolean> checklistStatusMap = new java.util.HashMap<>();
        Map<Long, List<FileUpload>> fileUploadMap = new java.util.HashMap<>();

        // Load quiz answers (only objective answers for now)
        List<QuizAnswer> quizAnswers = quizAnswerRepository.findByInstructorId(instructor.getId());
        quizAnswers.stream()
                .filter(qa -> qa.getSelectedAnswerIndex() != null) // Only objective answers
                .forEach(qa -> quizAnswerMap.put(qa.getQuestion().getId(), qa.getSelectedAnswerIndex()));

        // Load checklist status
        List<InstructorChecklistItem> checklistItems = checklistItemRepository.findByInstructorId(instructor.getId());
        checklistItems.forEach(ci -> checklistStatusMap.put(ci.getChecklistItem().getId(), ci.getIsChecked()));

        // Load file uploads
        List<FileUpload> fileUploads = fileUploadRepository.findByInstructorId(instructor.getId());
        fileUploads.stream().collect(Collectors.groupingBy(fu -> fu.getTask().getId()))
                .forEach(fileUploadMap::put);

        // Convert to StepResponse
        List<StepResponse> stepResponses = steps.stream()
                .map(step -> toStepResponse(step, instructor.getId(), quizAnswerMap, checklistStatusMap, fileUploadMap))
                .collect(Collectors.toList());

        // Calculate actual progress based on completed tasks
        int totalTasks = 0;
        int completedTasks = 0;
        int currentStepNumber = 1;
        boolean foundCurrentStep = false;

        for (OnboardingStep step : steps) {
            int stepTotalTasks = step.getTasks() != null ? step.getTasks().size() : 0;
            int stepCompletedTasks = step.getTasks() != null 
                    ? (int) step.getTasks().stream()
                            .filter(task -> task.getStatus() == TaskStatus.COMPLETED)
                            .count()
                    : 0;

            totalTasks += stepTotalTasks;
            completedTasks += stepCompletedTasks;

            // Find the current step (first step that is not completed)
            if (!foundCurrentStep && step.getStatus() != TaskStatus.COMPLETED) {
                currentStepNumber = step.getStepNumber();
                foundCurrentStep = true;
            }
        }

        // If all steps are completed, set current step to the last step
        if (!foundCurrentStep && !steps.isEmpty()) {
            currentStepNumber = steps.stream()
                    .mapToInt(OnboardingStep::getStepNumber)
                    .max()
                    .orElse(1);
        }

        // Calculate overall progress percentage
        int overallProgress = totalTasks > 0 
                ? (int) Math.round((double) completedTasks / totalTasks * 100)
                : 0;

        // Update instructor progress in database
        instructor.setOverallProgress(overallProgress);
        instructor.setCurrentStep(currentStepNumber);
        instructorRepository.save(instructor);

        // Calculate D-Day
        java.time.LocalDate startDate = instructor.getStartDate();
        java.time.LocalDate today = java.time.LocalDate.now();
        int dDay = (int) java.time.temporal.ChronoUnit.DAYS.between(today, startDate);

        // Calculate timing variable
        TimingVariable timingVariable = TimingVariable.calculate(instructor.getStartDate());
        
        // Build dashboard response
        return InstructorDashboardResponse.builder()
                .id(instructor.getId())
                .name(instructor.getUser().getName())
                .email(instructor.getUser().getEmail())
                .phone(instructor.getPhone())
                .track(instructor.getTrack().getKoreanName()) // Get Korean name from Track entity
                .cohort(instructor.getCohort())
                .accessCode(instructor.getAccessCode())
                .startDate(instructor.getStartDate().toString())
                .currentStep(currentStepNumber)
                .overallProgress(overallProgress)
                .instructorType(instructor.getInstructorType() != null ? instructor.getInstructorType().getKoreanName() : null)
                .onboardingModule(instructor.getOnboardingModule() != null ? instructor.getOnboardingModule().getKoreanName() : null)
                .timingVariable(timingVariable.getKoreanName())
                .steps(stepResponses)
                .dDay(dDay)
                .build();
    }

    /**
     * Update instructor information (PM only)
     */
    @Transactional
    public InstructorResponse updateInstructor(Long instructorId, InstructorUpdateRequest request) {
        securityContext.requirePm();

        Instructor instructor = instructorRepository.findById(instructorId)
                .orElseThrow(() -> new ResourceNotFoundException("Instructor not found"));

        User user = instructor.getUser();

        // Update user information
        if (!user.getEmail().equals(request.getEmail())) {
            // Check if new email already exists (탈퇴한 사용자 제외)
            if (userRepository.existsByEmailAndNotDeleted(request.getEmail())) {
                throw new DuplicateResourceException("Email already registered");
            }
            user.setEmail(request.getEmail());
        }
        
        // 이름 변경 (access code는 변경하지 않음 - 이름 편집 시 코드 변경 방지)
        user.setName(request.getName());
        userRepository.save(user);

        // Update instructor information
        instructor.setPhone(request.getPhone());
        
        // Find Track entity - try by name (exact match first, then case-insensitive), then by Korean name, then by code
        String trackInput = request.getTrack().trim();
        Track newTrack = trackRepository.findByName(trackInput)  // Exact match first
                .orElseGet(() -> trackRepository.findAll().stream()
                        .filter(t -> t.getName().equalsIgnoreCase(trackInput))
                        .findFirst()
                        .orElseGet(() -> trackRepository.findByKoreanName(trackInput)
                                .orElseGet(() -> trackRepository.findByCode(trackInput.toUpperCase())
                                        .orElseThrow(() -> new ResourceNotFoundException(
                                                "Track not found: " + request.getTrack() + 
                                                ". Available tracks: " + 
                                                trackRepository.findAll().stream()
                                                        .map(t -> t.getKoreanName() + " (" + t.getName() + ")")
                                                        .collect(Collectors.joining(", ")))))));
        boolean trackChanged = !instructor.getTrack().getId().equals(newTrack.getId());
        instructor.setTrack(newTrack);  // Set Track entity
        
        String newCohort = request.getCohort();
        boolean cohortChanged = !instructor.getCohort().equals(newCohort);
        instructor.setCohort(newCohort);
        instructor.setStartDate(request.getStartDate());
        
        // 트랙이나 기수 변경 시에만 access code 재생성
        // 이름 변경 시에는 재생성하지 않음 (이름 편집 시 코드 변경 방지)
        if (trackChanged || cohortChanged) {
            // 기존 이름 사용 (변경된 이름이 아닌)
            // Create a temporary request object for generateAccessCode
            InstructorRegistrationRequest tempRequest = new InstructorRegistrationRequest();
            tempRequest.setCohort(request.getCohort());
            tempRequest.setName(instructor.getUser().getName());  // 기존 이름 사용
            String newAccessCode = generateAccessCode(tempRequest, newTrack);
            instructor.setAccessCode(newAccessCode);
            log.info("Access code regenerated for instructor {} due to track/cohort change: {}", 
                    instructor.getId(), newAccessCode);
        }

        // Update instructor type if provided
        if (request.getInstructorType() != null && !request.getInstructorType().trim().isEmpty()) {
            InstructorType instructorType = InstructorType.fromKorean(request.getInstructorType());
            if (instructorType != null) {
                instructor.setInstructorType(instructorType);
                // Recalculate module if type or timing changed
                TimingVariable timingVariable = TimingVariable.calculate(request.getStartDate());
                OnboardingModule module = OnboardingModule.determine(instructorType, timingVariable);
                instructor.setOnboardingModule(module);
            }
        }

        instructor = instructorRepository.save(instructor);

        // 감사 로그 기록
        auditLogService.logAction(
                AuditLog.ActionType.UPDATE,
                "Instructor",
                instructor.getId(),
                String.format("강사 정보 수정: %s", instructor.getUser().getName()),
                null, // oldValue는 복잡하므로 생략
                toInstructorResponse(instructor) // newValue
        );

        return toInstructorResponse(instructor);
    }

    /**
     * Delete instructor (PM only)
     */
    @Transactional
    public void deleteInstructor(Long instructorId) {
        securityContext.requirePm();

        Instructor instructor = instructorRepository.findById(instructorId)
                .orElseThrow(() -> new ResourceNotFoundException("Instructor not found"));

        String instructorName = instructor.getUser().getName();

        // Delete instructor (cascade will delete steps, tasks, etc.)
        instructorRepository.delete(instructor);

        // Also delete the associated user
        userRepository.delete(instructor.getUser());

        // 감사 로그 기록
        auditLogService.logAction(
                AuditLog.ActionType.DELETE,
                "Instructor",
                instructorId,
                String.format("강사 삭제: %s", instructorName),
                null, // oldValue
                null // newValue
        );
    }

    /**
     * Update instructor's onboarding steps (PM only)
     * IMPROVED: Preserves existing progress - only adds/removes/updates steps incrementally
     */
    @Transactional
    public InstructorResponse updateInstructorSteps(Long instructorId, InstructorStepsUpdateRequest request) {
        securityContext.requirePm();

        log.info("updateInstructorSteps called for instructor {} with stepConfigurations={}",
                instructorId, request.getStepConfigurations() != null ? request.getStepConfigurations().size() : 0);

        Instructor instructor = instructorRepository.findById(instructorId)
                .orElseThrow(() -> new ResourceNotFoundException("Instructor not found"));

        log.info("Found instructor: {} (current steps: {})", instructor.getUser().getName(), instructor.getSteps().size());

        // Recalculate module based on instructor type and timing
        TimingVariable timingVariable = TimingVariable.calculate(instructor.getStartDate());
        OnboardingModule onboardingModule = instructor.getInstructorType() != null
                ? OnboardingModule.determine(instructor.getInstructorType(), timingVariable)
                : OnboardingModule.A_NURTURING;

        log.info("Onboarding module: {}", onboardingModule);

        // SMART UPDATE: Preserve existing steps and their progress
        if (request.getStepConfigurations() != null && !request.getStepConfigurations().isEmpty()) {
            updateStepsWithProgressPreservation(instructor, request.getStepConfigurations(), onboardingModule);
        } else if (request.getSelectedStepDefinitionIds() != null && !request.getSelectedStepDefinitionIds().isEmpty()) {
            // Fallback to old behavior for deprecated API
            log.warn("Using deprecated selectedStepDefinitionIds - progress will be lost");
            instructor.getSteps().clear();
            instructorRepository.saveAndFlush(instructor);
            instructor = instructorRepository.findById(instructorId)
                    .orElseThrow(() -> new ResourceNotFoundException("Instructor not found"));
            onboardingInitializationService.initializeFromStepDefinitions(instructor, request.getSelectedStepDefinitionIds(), onboardingModule);
        } else {
            // Fallback to module-based steps
            log.warn("Using module-based steps - progress will be lost");
            instructor.getSteps().clear();
            instructorRepository.saveAndFlush(instructor);
            instructor = instructorRepository.findById(instructorId)
                    .orElseThrow(() -> new ResourceNotFoundException("Instructor not found"));
            onboardingInitializationService.initializeOnboardingStepsWithModule(instructor, onboardingModule);
        }

        // Re-fetch instructor to get updated steps
        instructor = instructorRepository.findById(instructorId)
                .orElseThrow(() -> new ResourceNotFoundException("Instructor not found"));

        log.info("After update, instructor has {} steps", instructor.getSteps().size());

        // Recalculate progress instead of resetting
        recalculateInstructorProgress(instructor);
        instructor = instructorRepository.save(instructor);

        // 감사 로그 기록
        auditLogService.logAction(
                AuditLog.ActionType.UPDATE,
                "Instructor",
                instructor.getId(),
                String.format("강사 온보딩 단계 수정 (진척도 보존): %s", instructor.getUser().getName()),
                null,
                null
        );

        // Return response with steps using getInstructorWithSteps
        return getInstructorWithSteps(instructor.getId());
    }

    /**
     * Update steps with progress preservation (smart diff update)
     * Matches steps by stepDefinitionId and preserves existing progress
     */
    private void updateStepsWithProgressPreservation(
            Instructor instructor,
            List<StepModuleConfiguration> newConfigurations,
            OnboardingModule onboardingModule) {

        log.info("Starting smart update - preserving progress for existing steps");

        // Build map of existing steps by stepDefinitionId
        Map<Long, OnboardingStep> existingStepsByDefId = instructor.getSteps().stream()
                .filter(step -> step.getStepDefinition() != null)
                .collect(Collectors.toMap(
                        step -> step.getStepDefinition().getId(),
                        step -> step
                ));

        log.info("Found {} existing steps with stepDefinitions", existingStepsByDefId.size());

        // Track which existing steps are still needed
        java.util.Set<Long> processedStepDefIds = new java.util.HashSet<>();

        int stepNumber = 1;
        for (StepModuleConfiguration config : newConfigurations) {
            Long stepDefId = config.getStepId();
            processedStepDefIds.add(stepDefId);

            StepDefinition stepDefinition = stepDefinitionRepository.findById(stepDefId)
                    .orElseThrow(() -> new ResourceNotFoundException("StepDefinition not found: " + stepDefId));

            StepType stepType = moduleConfigurationService.getStepType(onboardingModule, stepNumber);

            OnboardingStep existingStep = existingStepsByDefId.get(stepDefId);

            if (existingStep != null) {
                // UPDATE existing step (preserve progress)
                log.info("Updating existing step {} (stepDefId: {}) - preserving progress", stepNumber, stepDefId);
                updateExistingStep(existingStep, stepDefinition, stepNumber, stepType, config);
            } else {
                // CREATE new step
                log.info("Creating new step {} (stepDefId: {})", stepNumber, stepDefId);
                OnboardingStep newStep = createNewStep(instructor, stepDefinition, stepNumber, stepType, config);
                instructor.addStep(newStep);
                stepRepository.save(newStep);
            }

            stepNumber++;
        }

        // DELETE steps that are no longer in the configuration
        List<OnboardingStep> stepsToRemove = instructor.getSteps().stream()
                .filter(step -> step.getStepDefinition() != null)
                .filter(step -> !processedStepDefIds.contains(step.getStepDefinition().getId()))
                .collect(Collectors.toList());

        if (!stepsToRemove.isEmpty()) {
            log.info("Removing {} steps that are no longer in configuration", stepsToRemove.size());
            for (OnboardingStep stepToRemove : stepsToRemove) {
                log.info("Removing step: {} (stepDefId: {})",
                        stepToRemove.getTitle(), stepToRemove.getStepDefinition().getId());
                instructor.getSteps().remove(stepToRemove);
                stepRepository.delete(stepToRemove);
            }
        }

        instructorRepository.saveAndFlush(instructor);
    }

    /**
     * Update existing step metadata and add new tasks (preserve existing tasks)
     */
    private void updateExistingStep(
            OnboardingStep existingStep,
            StepDefinition stepDefinition,
            int newStepNumber,
            StepType stepType,
            StepModuleConfiguration config) {

        // Update step metadata
        existingStep.setStepNumber(newStepNumber);
        existingStep.setTitle(stepDefinition.getTitle());
        existingStep.setEmoji(stepDefinition.getEmoji());
        existingStep.setDescription(stepDefinition.getDescription());
        existingStep.setStepType(stepType);

        // Update dDay if changed
        if (stepDefinition.getDefaultDDay() != null) {
            existingStep.setDDay(stepDefinition.getDefaultDDay());
        }

        // UPDATE TASKS: Preserve existing + add new ones
        if (config.getEnabledModuleIds() != null && !config.getEnabledModuleIds().isEmpty()) {
            updateStepTasks(existingStep, config.getEnabledModuleIds());
        }

        // Update task counts
        existingStep.setTotalTasks(existingStep.getTasks().size());
        long completedCount = existingStep.getTasks().stream()
                .filter(task -> task.getStatus() == TaskStatus.COMPLETED)
                .count();
        existingStep.setCompletedTasks((int) completedCount);

        stepRepository.save(existingStep);
    }

    /**
     * Update tasks in a step: preserve existing tasks, add new ones
     */
    private void updateStepTasks(OnboardingStep step, List<Long> newModuleIds) {
        log.info("Updating tasks for step {} - new module IDs: {}", step.getStepNumber(), newModuleIds);

        // Build map of existing tasks by contentModule ID (if task was created from a module)
        // Note: We need to track which module each task came from
        // For now, we'll use title matching as a heuristic (module name = task title)
        List<ContentModule> newModules = contentModuleRepository.findAllById(newModuleIds);
        Map<Long, ContentModule> newModuleMap = newModules.stream()
                .collect(Collectors.toMap(ContentModule::getId, m -> m));

        // Get existing task titles to avoid duplicates
        java.util.Set<String> existingTaskTitles = step.getTasks().stream()
                .map(Task::getTitle)
                .collect(Collectors.toSet());

        log.info("Step {} has {} existing tasks", step.getStepNumber(), existingTaskTitles.size());

        // Add new tasks for modules that don't exist yet
        int displayOrder = step.getTasks().size(); // Start after existing tasks
        int tasksAdded = 0;

        for (Long moduleId : newModuleIds) {
            ContentModule module = newModuleMap.get(moduleId);
            if (module == null) {
                log.warn("Module {} not found, skipping", moduleId);
                continue;
            }

            // Check if task with this module name already exists (preserve existing)
            if (existingTaskTitles.contains(module.getName())) {
                log.info("Task '{}' already exists in step {} - skipping (preserving progress)",
                        module.getName(), step.getStepNumber());
                continue;
            }

            // Create new task
            Task newTask = createTaskFromModule(step, module, displayOrder, true);
            step.addTask(newTask);
            displayOrder++;
            tasksAdded++;

            log.info("Added new task '{}' to step {}", newTask.getTitle(), step.getStepNumber());
        }

        log.info("Added {} new tasks to step {} (preserved {} existing tasks)",
                tasksAdded, step.getStepNumber(), existingTaskTitles.size());
    }

    /**
     * Create a new step with tasks
     */
    private OnboardingStep createNewStep(
            Instructor instructor,
            StepDefinition stepDefinition,
            int stepNumber,
            StepType stepType,
            StepModuleConfiguration config) {

        OnboardingStep step = OnboardingStep.builder()
                .instructor(instructor)
                .stepDefinition(stepDefinition)
                .stepNumber(stepNumber)
                .title(stepDefinition.getTitle())
                .emoji(stepDefinition.getEmoji())
                .dDay(stepDefinition.getDefaultDDay() != null ?
                        stepDefinition.getDefaultDDay() : calculateDDay(stepNumber))
                .description(stepDefinition.getDescription())
                .status(TaskStatus.PENDING)
                .stepType(stepType)
                .totalTasks(0)
                .completedTasks(0)
                .build();

        // Add tasks from enabled modules
        if (config.getEnabledModuleIds() != null && !config.getEnabledModuleIds().isEmpty()) {
            List<ContentModule> modules = contentModuleRepository.findAllById(config.getEnabledModuleIds());
            int displayOrder = 0;

            for (Long moduleId : config.getEnabledModuleIds()) {
                ContentModule module = modules.stream()
                        .filter(m -> m.getId().equals(moduleId))
                        .findFirst()
                        .orElse(null);

                if (module != null) {
                    Task task = createTaskFromModule(step, module, displayOrder, true);
                    step.addTask(task);
                    displayOrder++;
                }
            }

            step.setTotalTasks(step.getTasks().size());
        }

        return step;
    }

    /**
     * Create Task from ContentModule (copy of OnboardingInitializationService logic)
     */
    private Task createTaskFromModule(OnboardingStep step, ContentModule module, Integer displayOrder, boolean isEnabled) {
        Task task = Task.builder()
                .step(step)
                .title(module.getName())
                .description(module.getDescription())
                .contentType(module.getContentType())
                .status(TaskStatus.PENDING)
                .documentUrl(module.getDocumentUrl())
                .documentContent(module.getDocumentContent())
                .videoUrl(module.getVideoUrl())
                .videoDuration(module.getVideoDuration())
                .requiredFiles(module.getRequiredFiles())
                .isEnabled(isEnabled)
                .build();

        // Copy quiz questions
        if (module.getQuizQuestions() != null) {
            for (ModuleQuizQuestion moduleQuestion : module.getQuizQuestions()) {
                QuizQuestion question = QuizQuestion.builder()
                        .task(task)
                        .question(moduleQuestion.getQuestion())
                        .questionType(moduleQuestion.getQuestionType())
                        .options(moduleQuestion.getOptions())
                        .correctAnswerIndex(moduleQuestion.getCorrectAnswerIndex())
                        .correctAnswerText(moduleQuestion.getCorrectAnswerText())
                        .answerGuide(moduleQuestion.getAnswerGuide())
                        .build();
                task.addQuizQuestion(question);
            }
        }

        // Copy checklist items
        if (module.getChecklistItems() != null) {
            for (ModuleChecklistItem moduleItem : module.getChecklistItems()) {
                ChecklistItem item = ChecklistItem.builder()
                        .task(task)
                        .label(moduleItem.getLabel())
                        .build();
                task.addChecklistItem(item);
            }
        }

        return task;
    }

    /**
     * Calculate D-Day based on step number
     */
    private Integer calculateDDay(Integer stepNumber) {
        return switch (stepNumber) {
            case 1 -> -14;
            case 2 -> -12;
            case 3 -> -9;
            case 4 -> -7;
            case 5 -> -5;
            case 6 -> -3;
            case 7 -> -1;
            default -> -14;
        };
    }

    /**
     * Recalculate instructor progress based on current step completion status
     */
    private void recalculateInstructorProgress(Instructor instructor) {
        List<OnboardingStep> steps = instructor.getSteps();

        if (steps.isEmpty()) {
            instructor.setOverallProgress(0);
            instructor.setCurrentStep(1);
            return;
        }

        int totalTasks = 0;
        int completedTasks = 0;
        int currentStepNumber = 1;
        boolean foundCurrentStep = false;

        for (OnboardingStep step : steps) {
            int stepTotalTasks = step.getTasks() != null ? step.getTasks().size() : 0;
            int stepCompletedTasks = step.getTasks() != null
                    ? (int) step.getTasks().stream()
                            .filter(task -> task.getStatus() == TaskStatus.COMPLETED)
                            .count()
                    : 0;

            totalTasks += stepTotalTasks;
            completedTasks += stepCompletedTasks;

            // Find current step (first step that is not completed)
            if (!foundCurrentStep && step.getStatus() != TaskStatus.COMPLETED) {
                currentStepNumber = step.getStepNumber();
                foundCurrentStep = true;
            }
        }

        // If all steps completed, set to last step
        if (!foundCurrentStep && !steps.isEmpty()) {
            currentStepNumber = steps.stream()
                    .mapToInt(OnboardingStep::getStepNumber)
                    .max()
                    .orElse(1);
        }

        int overallProgress = totalTasks > 0
                ? (int) Math.round((double) completedTasks / totalTasks * 100)
                : 0;

        instructor.setOverallProgress(overallProgress);
        instructor.setCurrentStep(currentStepNumber);

        log.info("Recalculated progress for instructor {}: {}% ({}/{} tasks), current step: {}",
                instructor.getId(), overallProgress, completedTasks, totalTasks, currentStepNumber);
    }

    /**
     * Access Code 생성 (풀네임 사용)
     * Format: {TrackCode}{CohortNum}-{FullName}{Number}
     * 
     * Note: 이름 변경 시에는 access code를 재생성하지 않음
     * (이름 편집 시 코드 변경을 방지하기 위함)
     * 트랙이나 기수 변경 시에만 재생성됨
     */
    private String generateAccessCode(InstructorRegistrationRequest request, Track track) {
        String trackCode = track.getCode(); // Use Track entity's code

        String cohortNum = request.getCohort().replaceAll("[^0-9]", "");
        
        // 풀네임 사용 (공백 제거, 영문/한글만 허용)
        String fullName = request.getName().trim()
                .replaceAll("\\s+", "")  // 공백 제거
                .replaceAll("[^가-힣a-zA-Z]", "");  // 한글, 영문만 허용
        
        if (fullName.isEmpty()) {
            throw new IllegalArgumentException("유효하지 않은 이름입니다: '" + request.getName() + "'. 한글 또는 영문만 입력 가능합니다.");
        }

        // 숫자 부여 (1부터 시작, 중복 시 증가)
        int number = 1;
        String accessCode;
        int attempts = 0;

        do {
            accessCode = String.format("%s%s-%s%d", trackCode, cohortNum, fullName, number);
            number++;
            attempts++;
        } while (instructorRepository.existsByAccessCode(accessCode) && attempts < 10000);

        if (instructorRepository.existsByAccessCode(accessCode)) {
            throw new RuntimeException("Failed to generate unique access code after " + attempts + " attempts");
        }

        return accessCode;
    }

    private InstructorResponse toInstructorResponse(Instructor instructor) {
        // Calculate timing variable
        TimingVariable timingVariable = TimingVariable.calculate(instructor.getStartDate());
        
        return InstructorResponse.builder()
                .id(instructor.getId())
                .name(instructor.getUser().getName())
                .email(instructor.getUser().getEmail())
                .phone(instructor.getPhone())
                .track(instructor.getTrack().getKoreanName()) // Get Korean name from Track entity
                .cohort(instructor.getCohort())
                .accessCode(instructor.getAccessCode())
                .startDate(instructor.getStartDate())
                .currentStep(instructor.getCurrentStep())
                .overallProgress(instructor.getOverallProgress())
                .instructorType(instructor.getInstructorType() != null ? instructor.getInstructorType().getKoreanName() : null)
                .onboardingModule(instructor.getOnboardingModule() != null ? instructor.getOnboardingModule().getKoreanName() : null)
                .timingVariable(timingVariable.getKoreanName())
                .build();
    }

    private StepResponse toStepResponse(OnboardingStep step, Long instructorId,
                                        Map<Long, Integer> quizAnswerMap,
                                        Map<Long, Boolean> checklistStatusMap,
                                        Map<Long, List<FileUpload>> fileUploadMap) {
        // Filter out disabled tasks - only return enabled tasks to instructors
        List<TaskResponse> tasks = step.getTasks().stream()
                .filter(Task::isEnabled)  // Only include enabled tasks
                .map(task -> toTaskResponse(task, instructorId, quizAnswerMap, checklistStatusMap, fileUploadMap))
                .collect(Collectors.toList());

        return StepResponse.builder()
                .id(step.getId())
                .stepDefinitionId(step.getStepDefinition() != null ? step.getStepDefinition().getId() : null)
                .stepNumber(step.getStepNumber())
                .title(step.getTitle())
                .emoji(step.getEmoji())
                .dDay(step.getDDay())
                .description(step.getDescription())
                .status(step.getStatus())
                .stepType(step.getStepType() != null ? step.getStepType().getKoreanName() : null)
                .totalTasks(step.getTotalTasks())
                .completedTasks(step.getCompletedTasks())
                .tasks(tasks)
                .build();
    }

    private TaskResponse toTaskResponse(Task task, Long instructorId,
                                        Map<Long, Integer> quizAnswerMap,
                                        Map<Long, Boolean> checklistStatusMap,
                                        Map<Long, List<FileUpload>> fileUploadMap) {
        TaskResponse.TaskResponseBuilder builder = TaskResponse.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .contentType(task.getContentType())
                .status(task.getStatus())
                .isEnabled(task.getIsEnabled());

        switch (task.getContentType()) {
            case A -> {
                builder.documentUrl(task.getDocumentUrl());
                builder.documentContent(task.getDocumentContent());
                builder.quizQuestions(task.getQuizQuestions().stream()
                        .map(q -> toQuizQuestionResponse(q, quizAnswerMap))
                        .collect(Collectors.toList()));
            }
            case B -> {
                builder.videoUrl(task.getVideoUrl());
                builder.videoDuration(task.getVideoDuration());
                builder.quizQuestions(task.getQuizQuestions().stream()
                        .map(q -> toQuizQuestionResponse(q, quizAnswerMap))
                        .collect(Collectors.toList()));
            }
            case C -> {
                builder.requiredFiles(task.getRequiredFiles());
                // OPTIMIZATION: Get uploads from map instead of querying database
                List<FileUpload> uploads = fileUploadMap.getOrDefault(task.getId(), List.of());
                builder.uploadedFiles(uploads.stream()
                        .map(this::toFileUploadResponse)
                        .collect(Collectors.toList()));
            }
            case D -> {
                builder.checklistItems(task.getChecklistItems().stream()
                        .map(item -> toChecklistItemResponse(item, checklistStatusMap))
                        .collect(Collectors.toList()));
            }
        }

        return builder.build();
    }

    private QuizQuestionResponse toQuizQuestionResponse(QuizQuestion question,
                                                        Map<Long, Integer> quizAnswerMap) {
        // OPTIMIZATION: Get answer from map instead of querying database
        Integer userAnswer = quizAnswerMap.get(question.getId());

        return QuizQuestionResponse.builder()
                .id(question.getId())
                .question(question.getQuestion())
                .questionType(question.getQuestionType())
                .options(question.getOptions())
                .correctAnswerIndex(question.getCorrectAnswerIndex())
                .correctAnswerText(question.getCorrectAnswerText())
                .answerGuide(question.getAnswerGuide())
                .userAnswer(userAnswer)
                .build();
    }

    private FileUploadResponse toFileUploadResponse(FileUpload upload) {
        return FileUploadResponse.builder()
                .id(upload.getId())
                .fileName(upload.getFileName())
                .url("/api/files/" + upload.getId())
                .fileSize(upload.getFileSize())
                .uploadedAt(upload.getUploadedAt())
                .build();
    }

    private ChecklistItemResponse toChecklistItemResponse(ChecklistItem item,
                                                          Map<Long, Boolean> checklistStatusMap) {
        // OPTIMIZATION: Get checked status from map instead of querying database
        Boolean checked = checklistStatusMap.getOrDefault(item.getId(), false);

        return ChecklistItemResponse.builder()
                .id(item.getId())
                .label(item.getLabel())
                .checked(checked)
                .build();
    }
}
