package kr.codeit.onboarding.service;

import kr.codeit.onboarding.domain.entity.AuditLog;
import kr.codeit.onboarding.domain.entity.ContentModule;
import kr.codeit.onboarding.domain.entity.ModuleChecklistItem;
import kr.codeit.onboarding.domain.entity.ModuleQuizQuestion;
import kr.codeit.onboarding.domain.entity.User;
import kr.codeit.onboarding.dto.*;
import kr.codeit.onboarding.exception.ResourceNotFoundException;
import kr.codeit.onboarding.repository.ContentModuleRepository;
import kr.codeit.onboarding.repository.StepDefinitionRepository;
import kr.codeit.onboarding.security.SecurityContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Sort;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 모듈 관리 서비스 (레고 블록처럼 재사용 가능한 모듈)
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ModuleService {

    private final ContentModuleRepository moduleRepository;
    private final StepDefinitionRepository stepDefinitionRepository;
    private final kr.codeit.onboarding.repository.UserRepository userRepository;
    private final SecurityContext securityContext;
    private final AuditLogService auditLogService;
    private final VideoUploadService videoUploadService;

    @Transactional
    public ModuleResponse createModule(ModuleRequest request) {
        securityContext.requirePm();
        Long pmId = securityContext.getCurrentUserId();
        User currentPm = userRepository.findById(pmId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Step Definition 설정 (필수 - 강결합)
        if (request.getStepDefinitionId() == null) {
            throw new IllegalArgumentException("Step definition ID is required. Modules must belong to a step definition.");
        }
        kr.codeit.onboarding.domain.entity.StepDefinition stepDefinition = stepDefinitionRepository.findById(request.getStepDefinitionId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Step definition not found with id: " + request.getStepDefinitionId()));

        ContentModule module = ContentModule.builder()
                .name(request.getName())
                .description(request.getDescription())
                .contentType(request.getContentType())
                .createdBy(currentPm)
                .stepDefinition(stepDefinition)
                .documentUrl(request.getDocumentUrl())
                .documentContent(request.getDocumentContent())
                .videoUrl(request.getVideoUrl())
                .videoDuration(request.getVideoDuration())
                .requiredFiles(request.getRequiredFiles())
                .tags(request.getTags())
                .build();

        // Save module first to get the ID
        module = moduleRepository.save(module);
        
        // Add quiz questions after module is saved
        if (request.getQuizQuestions() != null && !request.getQuizQuestions().isEmpty()) {
            for (QuizQuestionRequest qReq : request.getQuizQuestions()) {
                ModuleQuizQuestion question = ModuleQuizQuestion.builder()
                        .contentModule(module)
                        .question(qReq.getQuestion())
                        .questionType(qReq.getQuestionType())
                        .options(qReq.getOptions())
                        .correctAnswerIndex(qReq.getCorrectAnswerIndex())
                        .correctAnswerText(qReq.getCorrectAnswerText())
                        .answerGuide(qReq.getAnswerGuide())
                        .build();
                module.addQuizQuestion(question);
            }
        }

        // Add checklist items after module is saved
        if (request.getChecklistItems() != null && !request.getChecklistItems().isEmpty()) {
            for (ChecklistItemRequest itemReq : request.getChecklistItems()) {
                ModuleChecklistItem item = ModuleChecklistItem.builder()
                        .contentModule(module)
                        .label(itemReq.getLabel())
                        .build();
                module.addChecklistItem(item);
            }
        }

        // Save again to persist quiz questions and checklist items
        module = moduleRepository.save(module);
        
        // 감사 로그 기록
        ModuleResponse response = toModuleResponse(module);
        auditLogService.logAction(
                AuditLog.ActionType.CREATE,
                "ContentModule",
                module.getId(),
                String.format("콘텐츠 모듈 생성: %s", module.getName()),
                null,
                response
        );
        
        return response;
    }

    /**
     * 모든 모듈 조회
     * 템플릿 시스템 제거 후 모듈은 Step Definition에 직접 연결되지 않고,
     * Step Definition의 defaultModuleIds JSON 컬럼에 모듈 ID 리스트로 저장됨
     */
    public List<ModuleResponse> getAllModules() {
        securityContext.requirePm();
        // 모든 모듈을 조회 (stepDefinitionId 필터 제거)
        List<ContentModule> allModules = moduleRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        log.info("Found {} total modules in database", allModules.size());
        
        List<Long> moduleIds = allModules.stream()
                .map(ContentModule::getId)
                .collect(Collectors.toList());

        if (moduleIds.isEmpty()) {
            log.warn("No modules found in database");
            return new ArrayList<>();
        }

        // Quiz questions와 checklist items를 포함하여 조회
        List<ContentModule> modulesWithDetails = moduleRepository.findByIdsWithDetails(moduleIds);
        log.info("Loaded {} modules with details", modulesWithDetails.size());

        return modulesWithDetails.stream()
                .map(this::toModuleResponse)
                .collect(Collectors.toList());
    }

    /**
     * Step Definition별 모듈 조회
     * 각 Step Definition은 자신에게 할당된 모듈만 소유할 수 있음
     */
    public List<ModuleResponse> getModulesByStepDefinition(Long stepDefinitionId) {
        securityContext.requirePm();
        // stepDefinitionId가 null이면 빈 리스트 반환 (모듈은 반드시 Step Definition에 속해야 함)
        if (stepDefinitionId == null) {
            return new ArrayList<>();
        }

        // 먼저 모듈 ID 리스트를 추출
        List<ContentModule> modules = moduleRepository.findByStepDefinitionId(stepDefinitionId);
        List<Long> moduleIds = modules.stream()
                .map(ContentModule::getId)
                .collect(Collectors.toList());

        if (moduleIds.isEmpty()) {
            return new ArrayList<>();
        }

        // Quiz questions와 checklist items를 포함하여 조회
        List<ContentModule> modulesWithDetails = moduleRepository.findByIdsWithDetails(moduleIds);

        return modulesWithDetails.stream()
                .map(this::toModuleResponse)
                .collect(Collectors.toList());
    }

    public ModuleResponse getModule(Long id) {
        securityContext.requirePm();
        ContentModule module = moduleRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Module not found"));
        return toModuleResponse(module);
    }

    @Transactional
    public ModuleResponse updateModule(Long id, ModuleRequest request) {
        securityContext.requirePm();
        ContentModule module = moduleRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Module not found"));

        // Update basic fields
        module.setName(request.getName());
        module.setDescription(request.getDescription());
        module.setDocumentUrl(request.getDocumentUrl());
        module.setDocumentContent(request.getDocumentContent());
        module.setVideoUrl(request.getVideoUrl());
        module.setVideoDuration(request.getVideoDuration());
        module.setRequiredFiles(request.getRequiredFiles());
        module.setTags(request.getTags());

        // Update Step Definition (필수 - 강결합)
        if (request.getStepDefinitionId() == null) {
            throw new IllegalArgumentException("Step definition ID is required. Modules must belong to a step definition.");
        }
        kr.codeit.onboarding.domain.entity.StepDefinition stepDefinition = stepDefinitionRepository.findById(request.getStepDefinitionId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Step definition not found with id: " + request.getStepDefinitionId()));
        module.setStepDefinition(stepDefinition);

        // Update quiz questions (replace all)
        module.getQuizQuestions().clear();
        if (request.getQuizQuestions() != null) {
            for (QuizQuestionRequest qReq : request.getQuizQuestions()) {
                ModuleQuizQuestion question = ModuleQuizQuestion.builder()
                        .contentModule(module)
                        .question(qReq.getQuestion())
                        .questionType(qReq.getQuestionType())
                        .options(qReq.getOptions())
                        .correctAnswerIndex(qReq.getCorrectAnswerIndex())
                        .correctAnswerText(qReq.getCorrectAnswerText())
                        .answerGuide(qReq.getAnswerGuide())
                        .build();
                module.addQuizQuestion(question);
            }
        }

        // Update checklist items (replace all)
        module.getChecklistItems().clear();
        if (request.getChecklistItems() != null) {
            for (ChecklistItemRequest itemReq : request.getChecklistItems()) {
                ModuleChecklistItem item = ModuleChecklistItem.builder()
                        .contentModule(module)
                        .label(itemReq.getLabel())
                        .build();
                module.addChecklistItem(item);
            }
        }

        module = moduleRepository.save(module);
        
        // 감사 로그 기록
        ModuleResponse response = toModuleResponse(module);
        auditLogService.logAction(
                AuditLog.ActionType.UPDATE,
                "ContentModule",
                module.getId(),
                String.format("콘텐츠 모듈 수정: %s", module.getName()),
                null, // oldValue는 복잡하므로 생략
                response
        );
        
        return response;
    }

    @Transactional
    public void deleteModule(Long id) {
        securityContext.requirePm();
        ContentModule module = moduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Module not found"));
        
        // 변경 전 값 저장 (로그용)
        ModuleResponse oldValue = toModuleResponse(module);

        // Note: StepTemplate was removed, so we no longer check for module usage in templates
        // Modules can be deleted freely, but be aware that this may affect existing step definitions

        moduleRepository.delete(module);
        
        // 감사 로그 기록
        auditLogService.logAction(
                AuditLog.ActionType.DELETE,
                "ContentModule",
                id,
                String.format("콘텐츠 모듈 삭제: %s", module.getName()),
                oldValue,
                null
        );
    }

    /**
     * Move a module to a different step definition.
     * Used when PM wants to reorganize modules across steps.
     *
     * @param moduleId the module to move
     * @param targetStepDefinitionId the target step definition
     * @return updated module response
     */
    @Transactional
    public ModuleResponse moveModuleToStep(Long moduleId, Long targetStepDefinitionId) {
        securityContext.requirePm();

        ContentModule module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module not found with id: " + moduleId));

        kr.codeit.onboarding.domain.entity.StepDefinition targetStep = stepDefinitionRepository.findById(targetStepDefinitionId)
                .orElseThrow(() -> new ResourceNotFoundException("Step definition not found with id: " + targetStepDefinitionId));

        kr.codeit.onboarding.domain.entity.StepDefinition oldStep = module.getStepDefinition();
        Long oldStepId = oldStep.getId();
        String oldStepTitle = oldStep.getTitle();

        // Update relationship
        module.setStepDefinition(targetStep);
        module = moduleRepository.save(module);

        // 감사 로그 기록
        ModuleResponse response = toModuleResponse(module);
        auditLogService.logAction(
                AuditLog.ActionType.UPDATE,
                "ContentModule",
                moduleId,
                String.format("모듈 '%s' (ID: %d)를 Step '%s' (ID: %d)에서 '%s' (ID: %d)로 이동",
                        module.getName(), moduleId,
                        oldStepTitle, oldStepId,
                        targetStep.getTitle(), targetStepDefinitionId),
                null,
                response
        );

        log.info("Moved module {} from step {} to step {}", moduleId, oldStepId, targetStepDefinitionId);

        return response;
    }

    @Transactional
    public ModuleResponse uploadVideoToModule(Long id, org.springframework.web.multipart.MultipartFile file) throws java.io.IOException {
        securityContext.requirePm();

        ContentModule module = moduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Module not found"));

        // Validate module is Type B (Video + Quiz)
        if (module.getContentType() != kr.codeit.onboarding.domain.enums.ContentType.B) {
            throw new IllegalArgumentException(
                "동영상 업로드는 Type B (Video + Quiz) 모듈에서만 가능합니다. 현재 모듈 타입: " + module.getContentType()
            );
        }

        // Delete old video file if exists
        if (module.getVideoStoredFileName() != null) {
            videoUploadService.deleteVideo(module.getVideoStoredFileName());
        }

        // Upload new video file (returns filename for local, or S3 URL for S3)
        String storedFileNameOrUrl = videoUploadService.uploadVideo(file);

        // Update module with new video information
        if (videoUploadService.isS3Url(storedFileNameOrUrl)) {
            // S3 URL - store as videoUrl directly
            module.setVideoUrl(storedFileNameOrUrl);
            module.setVideoStoredFileName(null); // Clear stored filename for S3
        } else {
            // Local storage - use relative path
            module.setVideoStoredFileName(storedFileNameOrUrl);
            module.setVideoUrl("/api/files/videos/" + storedFileNameOrUrl);
        }

        module = moduleRepository.save(module);

        // 감사 로그 기록
        ModuleResponse response = toModuleResponse(module);
        auditLogService.logAction(
                AuditLog.ActionType.UPDATE,
                "ContentModule",
                module.getId(),
                String.format("콘텐츠 모듈 동영상 업로드: %s", module.getName()),
                null,
                response
        );

        return response;
    }

    private ModuleResponse toModuleResponse(ContentModule module) {
        return ModuleResponse.builder()
                .id(module.getId())
                .name(module.getName())
                .description(module.getDescription())
                .contentType(module.getContentType())
                .documentUrl(module.getDocumentUrl())
                .documentContent(module.getDocumentContent())
                .videoUrl(module.getVideoUrl())
                .videoStoredFileName(module.getVideoStoredFileName())
                .videoDuration(module.getVideoDuration())
                .requiredFiles(module.getRequiredFiles())
                .quizQuestions(module.getQuizQuestions().stream()
                        .map(q -> QuizQuestionResponse.builder()
                                .id(q.getId())
                                .question(q.getQuestion())
                                .questionType(q.getQuestionType())
                                .options(q.getOptions())
                                .correctAnswerIndex(q.getCorrectAnswerIndex())
                                .correctAnswerText(q.getCorrectAnswerText())
                                .answerGuide(q.getAnswerGuide())
                                .build())
                        .collect(Collectors.toList()))
                .checklistItems(module.getChecklistItems().stream()
                        .map(item -> ChecklistItemResponse.builder()
                                .id(item.getId())
                                .label(item.getLabel())
                                .build())
                        .collect(Collectors.toList()))
                .tags(module.getTags())
                .stepDefinitionId(module.getStepDefinition() != null ? module.getStepDefinition().getId() : null)
                .stepDefinitionTitle(module.getStepDefinition() != null ? module.getStepDefinition().getTitle() : null)
                .createdBy(module.getCreatedBy().getName())
                .createdAt(module.getCreatedAt().toString())
                .build();
    }
}

