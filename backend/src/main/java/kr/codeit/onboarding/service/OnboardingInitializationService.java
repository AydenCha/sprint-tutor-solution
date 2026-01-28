package kr.codeit.onboarding.service;

import kr.codeit.onboarding.domain.entity.*;
import kr.codeit.onboarding.domain.enums.ContentType;
import kr.codeit.onboarding.domain.enums.OnboardingModule;
import kr.codeit.onboarding.domain.enums.StepType;
import kr.codeit.onboarding.domain.enums.TaskStatus;
import kr.codeit.onboarding.dto.StepModuleConfiguration;
import kr.codeit.onboarding.exception.ResourceNotFoundException;
import kr.codeit.onboarding.repository.OnboardingStepRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service to initialize default onboarding steps and tasks for new instructors
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OnboardingInitializationService {

    private final OnboardingStepRepository onboardingStepRepository;
    private final ModuleConfigurationService moduleConfigurationService;
    private final kr.codeit.onboarding.repository.ContentModuleRepository contentModuleRepository;
    private final kr.codeit.onboarding.repository.StepDefinitionRepository stepDefinitionRepository;

    /**
     * Initialize only selected steps (custom step selection from frontend)
     */
    @Transactional
    public void initializeCustomSteps(Instructor instructor, java.util.List<Integer> selectedSteps) {
        log.info("Initializing custom selected steps for instructor: {}, steps: {}", 
                 instructor.getId(), selectedSteps);

        for (Integer stepNumber : selectedSteps) {
            switch (stepNumber) {
                case 1 -> createStep1(instructor);
                case 2 -> createStep2(instructor);
                case 3 -> createStep3(instructor);
                case 4 -> createStep4(instructor);
                case 5 -> createStep5(instructor);
                case 6 -> createStep6(instructor);
                case 7 -> createStep7(instructor);
                default -> log.warn("Unknown step number: {}, skipping", stepNumber);
            }
        }

        log.info("Successfully initialized {} custom steps for instructor: {}", 
                 selectedSteps.size(), instructor.getId());
    }

    /**
     * Initialize onboarding steps with module configuration
     * Applies module-specific step types (PM 주도, 자가 점검, 생략, 지연)
     * Uses StepTemplate if available, otherwise falls back to hardcoded steps
     */
    @Transactional
    public void initializeOnboardingStepsWithModule(Instructor instructor, OnboardingModule module) {
        log.info("Initializing onboarding steps with module {} for instructor: {}", 
                 module, instructor.getId());

        // Get steps to include (skip 생략 steps)
        java.util.List<Integer> includedSteps = moduleConfigurationService.getIncludedSteps(module);
        
        for (Integer stepNumber : includedSteps) {
            StepType stepType = moduleConfigurationService.getStepType(module, stepNumber);
            
            // Skip 생략 steps
            if (stepType == StepType.SKIP) {
                log.debug("Skipping step {} for module {}", stepNumber, module);
                continue;
            }
            
            OnboardingStep step = null;
            
            // Fallback to hardcoded steps (for backward compatibility)
            log.info("Using hardcoded steps for step {}", stepNumber);
            switch (stepNumber) {
                case 1 -> step = createStep1(instructor);
                case 2 -> step = createStep2(instructor);
                case 3 -> step = createStep3(instructor);
                case 4 -> step = createStep4(instructor);
                case 5 -> step = createStep5(instructor);
                case 6 -> step = createStep6(instructor);
                case 7 -> step = createStep7(instructor);
                default -> log.warn("Unknown step number: {}, skipping", stepNumber);
            }
            
            // Set step type from module configuration
            if (step != null) {
                step.setStepType(stepType);
                // Add step to instructor's collection
                instructor.addStep(step);
                onboardingStepRepository.save(step);
            }
        }

        log.info("Successfully initialized {} steps with module {} for instructor: {}", 
                 includedSteps.size(), module, instructor.getId());
    }
    
    /**
     * Initialize from StepTemplate
     * Creates OnboardingSteps from StepTemplate's steps in order
     * 
     * @deprecated StepTemplate was removed. Use initializeFromStepDefinitions or initializeFromStepConfigurations instead.
     */
    @Deprecated
    @Transactional
    public void initializeFromStepTemplate(Instructor instructor, Long stepTemplateId, OnboardingModule module) {
        log.warn("initializeFromStepTemplate is deprecated. StepTemplate was removed. Falling back to hardcoded steps.");
        // Fallback to hardcoded steps since StepTemplate is no longer available
        initializeOnboardingStepsWithModule(instructor, module);
    }

    /**
     * Initialize from StepDefinition IDs (in order)
     */
    @Transactional
    public void initializeFromStepDefinitions(Instructor instructor, List<Long> stepDefinitionIds, OnboardingModule module) {
        log.info("Initializing from StepDefinitions {} for instructor: {}", stepDefinitionIds, instructor.getId());
        
        int stepNumber = 1;
        for (Long stepDefinitionId : stepDefinitionIds) {
            StepDefinition stepDefinition = stepDefinitionRepository.findById(stepDefinitionId)
                    .orElseThrow(() -> new ResourceNotFoundException("StepDefinition not found: " + stepDefinitionId));
            
            StepType stepType = moduleConfigurationService.getStepType(module, stepNumber);
            
            // Skip 생략 steps
            if (stepType == StepType.SKIP) {
                log.debug("Skipping step {} (marked as SKIP in module {})", stepNumber, module);
                stepNumber++;
                continue;
            }
            
            OnboardingStep step = OnboardingStep.builder()
                    .instructor(instructor)
                    .stepDefinition(stepDefinition)
                    .stepNumber(stepNumber)
                    .title(stepDefinition.getTitle())
                    .emoji(stepDefinition.getEmoji())
                    .dDay(stepDefinition.getDefaultDDay() != null ? stepDefinition.getDefaultDDay() : calculateDDay(stepNumber))
                    .description(stepDefinition.getDescription())
                    .status(TaskStatus.PENDING)
                    .stepType(stepType)
                    .totalTasks(0)
                    .completedTasks(0)
                    .build();
            
            // Add step to instructor's collection
            instructor.addStep(step);
            
            onboardingStepRepository.save(step);
            stepNumber++;
        }
        
        log.info("Successfully initialized {} steps from StepDefinitions for instructor: {}",
                 stepDefinitionIds.size(), instructor.getId());
    }

    /**
     * Initialize from StepModuleConfigurations with module toggles.
     * Creates OnboardingSteps from step configurations with is_enabled flag on tasks.
     *
     * @param instructor the instructor
     * @param stepConfigurations list of step configurations with enabled modules
     * @param module the onboarding module for step type classification
     */
    @Transactional
    public void initializeFromStepConfigurations(
            Instructor instructor,
            List<StepModuleConfiguration> stepConfigurations,
            OnboardingModule module) {
        log.info("Initializing from StepModuleConfigurations for instructor: {}, {} configurations",
                instructor.getId(), stepConfigurations.size());

        int stepNumber = 1;
        for (StepModuleConfiguration config : stepConfigurations) {
            log.info("Processing step configuration: stepId={}, enabledModuleIds={} (size: {})",
                    config.getStepId(),
                    config.getEnabledModuleIds(),
                    config.getEnabledModuleIds() != null ? config.getEnabledModuleIds().size() : 0);
            
            StepDefinition stepDefinition = stepDefinitionRepository.findById(config.getStepId())
                    .orElseThrow(() -> new ResourceNotFoundException("StepDefinition not found: " + config.getStepId()));

            StepType stepType = moduleConfigurationService.getStepType(module, stepNumber);

            // Create OnboardingStep
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

            // Get enabled modules from configuration (not from stepDefinition.defaultModuleIds)
            // Since step-module association was removed, we use config.getEnabledModuleIds() directly
            if (config.getEnabledModuleIds() != null && !config.getEnabledModuleIds().isEmpty()) {
                log.info("Fetching {} modules for step {}", config.getEnabledModuleIds().size(), stepNumber);
                List<ContentModule> enabledModules = contentModuleRepository.findAllById(
                        config.getEnabledModuleIds()
                );
                log.info("Found {} modules in database for step {}", enabledModules.size(), stepNumber);

                if (enabledModules.isEmpty()) {
                    log.error("No modules found in database for step {} with IDs: {}", stepNumber, config.getEnabledModuleIds());
                }

                // NOTE: Validation removed to support loose coupling.
                // Modules can now be assigned to any step regardless of their default stepDefinition.
                // This allows flexible module reuse across different steps during instructor registration.
                log.info("Loaded {} modules for step {} ({}), loose coupling enabled",
                        enabledModules.size(), stepNumber, stepDefinition.getTitle());

                Map<Long, ContentModule> moduleMap = enabledModules.stream()
                        .collect(Collectors.toMap(ContentModule::getId, m -> m));

                // Create tasks for each enabled module, respecting the order in enabledModuleIds
                int displayOrder = 0;
                int tasksCreated = 0;
                for (Long moduleId : config.getEnabledModuleIds()) {
                    ContentModule contentModule = moduleMap.get(moduleId);
                    if (contentModule == null) {
                        log.warn("ContentModule {} not found in database, skipping", moduleId);
                        continue;
                    }

                    // All modules in enabledModuleIds are enabled by default
                    boolean isEnabled = true;

                    Task task = createTaskFromContentModule(step, contentModule, displayOrder, isEnabled);
                    step.addTask(task);
                    displayOrder++;
                    tasksCreated++;

                    log.info("Created task '{}' (id: {}, enabled: {}) for step {}",
                            task.getTitle(), task.getId(), isEnabled, stepNumber);
                }
                log.info("Total tasks created for step {}: {}", stepNumber, tasksCreated);
            } else {
                log.warn("No enabled modules configured for step {} (stepId: {}), skipping task creation. enabledModuleIds is null or empty.",
                        stepNumber, config.getStepId());
            }

            step.setTotalTasks(step.getTasks().size());
            instructor.addStep(step);
            onboardingStepRepository.save(step);

            log.info("Saved step {} '{}' with {} tasks ({} enabled) for instructor {}",
                    stepNumber, step.getTitle(), step.getTasks().size(),
                    step.getTasks().stream().filter(Task::isEnabled).count(),
                    instructor.getId());

            stepNumber++;
        }

        log.info("Successfully initialized {} steps from StepModuleConfigurations for instructor: {}",
                stepConfigurations.size(), instructor.getId());
    }

    /**
     * Create Task from ContentModule with enabled flag.
     * Copies all data from ContentModule to Task.
     *
     * @param step the onboarding step
     * @param module the content module
     * @param displayOrder the display order
     * @param isEnabled whether the task is enabled for the instructor
     * @return the created task
     */
    private Task createTaskFromContentModule(OnboardingStep step, ContentModule module, Integer displayOrder, boolean isEnabled) {
        log.debug("Creating task from module: {} (order: {}, enabled: {})", module.getName(), displayOrder, isEnabled);

        Task task = Task.builder()
                .step(step)
                .title(module.getName())
                .description(module.getDescription())
                .contentType(module.getContentType())
                .status(TaskStatus.PENDING)
                .documentUrl(module.getDocumentUrl())
                .videoUrl(module.getVideoUrl())
                .videoDuration(module.getVideoDuration())
                .requiredFiles(module.getRequiredFiles())
                .isEnabled(isEnabled)  // Set is_enabled flag
                .build();
        
        // Copy quiz questions from ModuleQuizQuestion to QuizQuestion
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
        
        // Copy checklist items from ModuleChecklistItem to ChecklistItem
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
     * Step 1: -14, Step 2: -12, Step 3: -9, Step 4: -7, Step 5: -5, Step 6: -3, Step 7: -1
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
     * Initialize custom selected steps with module configuration
     */
    @Transactional
    public void initializeCustomStepsWithModule(Instructor instructor, java.util.List<Integer> selectedSteps, OnboardingModule module) {
        log.info("Initializing custom selected steps with module {} for instructor: {}, steps: {}", 
                 module, instructor.getId(), selectedSteps);

        for (Integer stepNumber : selectedSteps) {
            StepType stepType = moduleConfigurationService.getStepType(module, stepNumber);
            
            // Skip 생략 steps even if selected
            if (stepType == StepType.SKIP) {
                log.debug("Skipping step {} (marked as SKIP in module {})", stepNumber, module);
                continue;
            }
            
            OnboardingStep step = null;
            switch (stepNumber) {
                case 1 -> step = createStep1(instructor);
                case 2 -> step = createStep2(instructor);
                case 3 -> step = createStep3(instructor);
                case 4 -> step = createStep4(instructor);
                case 5 -> step = createStep5(instructor);
                case 6 -> step = createStep6(instructor);
                case 7 -> step = createStep7(instructor);
                default -> log.warn("Unknown step number: {}, skipping", stepNumber);
            }
            
            // Set step type from module configuration
            if (step != null) {
                step.setStepType(stepType);
                onboardingStepRepository.save(step);
            }
        }

        log.info("Successfully initialized {} custom steps with module {} for instructor: {}", 
                 selectedSteps.size(), module, instructor.getId());
    }

    private void initializeHardcodedSteps(Instructor instructor) {
        createStep1(instructor);
        createStep2(instructor);
        createStep3(instructor);
        createStep4(instructor);
        createStep5(instructor);
        createStep6(instructor);
        createStep7(instructor);
    }

    private OnboardingStep createStep1(Instructor instructor) {
        OnboardingStep step = OnboardingStep.builder()
                .instructor(instructor)
                .stepNumber(1)
                .title("규정 (Regulations)")
                .emoji("📋")
                .dDay(-14)
                .description("코드잇 규정 및 행정 절차 숙지")
                .status(TaskStatus.PENDING)
                .totalTasks(0)
                .completedTasks(0)
                .build();

        Task task1 = Task.builder()
                .step(step)
                .title("규정 문서 읽기")
                .description("코드잇 강사 규정 및 행정 절차 학습")
                .contentType(ContentType.A) // Document + Quiz
                .documentUrl("https://docs.codeit.kr/regulations")
                .status(TaskStatus.PENDING)
                .build();

        QuizQuestion q1 = QuizQuestion.builder()
                .task(task1)
                .question("출결 처리 시 주의사항은?")
                .questionType(kr.codeit.onboarding.domain.enums.QuestionType.OBJECTIVE)
                .options(Arrays.asList("지각 허용", "사전 신고 필수", "무단 결석 가능", "모두 해당"))
                .correctAnswerIndex(1)
                .build();

        task1.addQuizQuestion(q1);
        step.addTask(task1);

        return onboardingStepRepository.save(step);
    }

    private OnboardingStep createStep2(Instructor instructor) {
        OnboardingStep step = OnboardingStep.builder()
                .instructor(instructor)
                .stepNumber(2)
                .title("조직 (Organization)")
                .emoji("👥")
                .dDay(-12)
                .description("코드잇 조직 문화 및 비전 이해")
                .status(TaskStatus.PENDING)
                .totalTasks(0)
                .completedTasks(0)
                .build();

        Task task1 = Task.builder()
                .step(step)
                .title("Watch Setup Tutorial")
                .description("Learn how to set up your IDE")
                .contentType(ContentType.B) // Video + Quiz
                .videoUrl("https://youtu.be/setup-tutorial")
                .videoDuration(600)
                .status(TaskStatus.PENDING)
                .build();

        QuizQuestion q1 = QuizQuestion.builder()
                .task(task1)
                .question("Which IDE is recommended?")
                .questionType(kr.codeit.onboarding.domain.enums.QuestionType.OBJECTIVE)
                .options(Arrays.asList("VS Code", "IntelliJ", "Eclipse", "Atom"))
                .correctAnswerIndex(0)
                .build();

        task1.addQuizQuestion(q1);
        step.addTask(task1);

        Task task2 = Task.builder()
                .step(step)
                .title("Environment Setup Checklist")
                .description("Complete all setup items")
                .contentType(ContentType.D) // Checklist
                .status(TaskStatus.PENDING)
                .build();

        ChecklistItem c1 = ChecklistItem.builder()
                .task(task2)
                .label("Install Node.js")
                .build();

        ChecklistItem c2 = ChecklistItem.builder()
                .task(task2)
                .label("Install Git")
                .build();

        task2.addChecklistItem(c1);
        task2.addChecklistItem(c2);
        step.addTask(task2);

        return onboardingStepRepository.save(step);
    }

    private OnboardingStep createStep3(Instructor instructor) {
        OnboardingStep step = OnboardingStep.builder()
                .instructor(instructor)
                .stepNumber(3)
                .title("콘텐츠 (Content/Curriculum)")
                .emoji("📚")
                .dDay(-9)
                .description("커리큘럼 및 교재 숙지")
                .status(TaskStatus.PENDING)
                .totalTasks(0)
                .completedTasks(0)
                .build();

        Task task1 = Task.builder()
                .step(step)
                .title("Upload Project Files")
                .description("Upload your initial project structure")
                .contentType(ContentType.C) // File Upload
                .requiredFiles(Arrays.asList(
                        kr.codeit.onboarding.dto.FileRequirement.builder()
                                .placeholder("프로젝트 설정 파일을 업로드해주세요")
                                .fileNameHint("package")
                                .allowedExtensions(Arrays.asList(".json"))
                                .required(true)
                                .build(),
                        kr.codeit.onboarding.dto.FileRequirement.builder()
                                .placeholder("README 파일을 업로드해주세요")
                                .fileNameHint("README")
                                .allowedExtensions(Arrays.asList(".md", ".txt"))
                                .required(true)
                                .build()
                ))
                .status(TaskStatus.PENDING)
                .build();

        step.addTask(task1);

        return onboardingStepRepository.save(step);
    }

    private OnboardingStep createStep4(Instructor instructor) {
        OnboardingStep step = OnboardingStep.builder()
                .instructor(instructor)
                .stepNumber(4)
                .title("환경 (Environment)")
                .emoji("💻")
                .dDay(-7)
                .description("강의 환경 및 기기 설정")
                .status(TaskStatus.PENDING)
                .totalTasks(0)
                .completedTasks(0)
                .build();

        Task task1 = Task.builder()
                .step(step)
                .title("Watch Team Introduction Video")
                .description("Get to know your team members")
                .contentType(ContentType.B) // Video + Quiz
                .videoUrl("https://youtu.be/team-intro")
                .videoDuration(300)
                .status(TaskStatus.PENDING)
                .build();

        step.addTask(task1);

        return onboardingStepRepository.save(step);
    }

    private OnboardingStep createStep5(Instructor instructor) {
        OnboardingStep step = OnboardingStep.builder()
                .instructor(instructor)
                .stepNumber(5)
                .title("도구 (Tools)")
                .emoji("🛠️")
                .dDay(-5)
                .description("LMS, ZEP 등 강의 도구 사용법")
                .status(TaskStatus.PENDING)
                .totalTasks(0)
                .completedTasks(0)
                .build();

        Task task1 = Task.builder()
                .step(step)
                .title("Read Assignment Brief")
                .description("Understand the requirements")
                .contentType(ContentType.A) // Document + Quiz
                .documentUrl("https://docs.codeit.kr/assignment-1")
                .status(TaskStatus.PENDING)
                .build();

        QuizQuestion q1 = QuizQuestion.builder()
                .task(task1)
                .question("What is the main objective?")
                .questionType(kr.codeit.onboarding.domain.enums.QuestionType.OBJECTIVE)
                .options(Arrays.asList("Build API", "Create UI", "Write tests", "Deploy app"))
                .correctAnswerIndex(0)
                .build();

        task1.addQuizQuestion(q1);
        step.addTask(task1);

        Task task2 = Task.builder()
                .step(step)
                .title("Submit Assignment")
                .description("Upload your completed code")
                .contentType(ContentType.C) // File Upload
                .requiredFiles(Arrays.asList(
                        kr.codeit.onboarding.dto.FileRequirement.builder()
                                .placeholder("솔루션 파일을 업로드해주세요")
                                .fileNameHint("solution")
                                .allowedExtensions(Arrays.asList(".js", ".ts"))
                                .required(true)
                                .build(),
                        kr.codeit.onboarding.dto.FileRequirement.builder()
                                .placeholder("테스트 파일을 업로드해주세요")
                                .fileNameHint("tests")
                                .allowedExtensions(Arrays.asList(".js", ".ts"))
                                .required(true)
                                .build()
                ))
                .status(TaskStatus.PENDING)
                .build();

        step.addTask(task2);

        return onboardingStepRepository.save(step);
    }

    private OnboardingStep createStep6(Instructor instructor) {
        OnboardingStep step = OnboardingStep.builder()
                .instructor(instructor)
                .stepNumber(6)
                .title("역량 (Capability)")
                .emoji("🎯")
                .dDay(-3)
                .description("모의 강의 및 피드백")
                .status(TaskStatus.PENDING)
                .totalTasks(0)
                .completedTasks(0)
                .build();

        Task task1 = Task.builder()
                .step(step)
                .title("Code Review Guidelines")
                .description("Understand our review standards")
                .contentType(ContentType.A) // Document + Quiz
                .documentUrl("https://docs.codeit.kr/code-review")
                .status(TaskStatus.PENDING)
                .build();

        QuizQuestion q1 = QuizQuestion.builder()
                .task(task1)
                .question("What should you check first in a code review?")
                .questionType(kr.codeit.onboarding.domain.enums.QuestionType.OBJECTIVE)
                .options(Arrays.asList("Code style", "Functionality", "Tests", "Documentation"))
                .correctAnswerIndex(1)
                .build();

        task1.addQuizQuestion(q1);
        step.addTask(task1);

        return onboardingStepRepository.save(step);
    }

    private OnboardingStep createStep7(Instructor instructor) {
        OnboardingStep step = OnboardingStep.builder()
                .instructor(instructor)
                .stepNumber(7)
                .title("최종 확인 (Final Review)")
                .emoji("🎉")
                .dDay(0)
                .description("온보딩 완료 확인")
                .status(TaskStatus.PENDING)
                .totalTasks(0)
                .completedTasks(0)
                .build();

        Task task1 = Task.builder()
                .step(step)
                .title("Onboarding Completion Checklist")
                .description("Verify all steps are complete")
                .contentType(ContentType.D) // Checklist
                .status(TaskStatus.PENDING)
                .build();

        ChecklistItem c1 = ChecklistItem.builder()
                .task(task1)
                .label("Completed all previous steps")
                .build();

        ChecklistItem c2 = ChecklistItem.builder()
                .task(task1)
                .label("Submitted all assignments")
                .build();

        ChecklistItem c3 = ChecklistItem.builder()
                .task(task1)
                .label("Met with team lead")
                .build();

        task1.addChecklistItem(c1);
        task1.addChecklistItem(c2);
        task1.addChecklistItem(c3);
        step.addTask(task1);

        return onboardingStepRepository.save(step);
    }

    /**
     * Create Task from ContentModule (backward compatibility).
     * Defaults isEnabled to true.
     *
     * @param step the onboarding step
     * @param module the content module
     * @param displayOrder the display order
     * @return the created task
     */
    private Task createTaskFromContentModule(OnboardingStep step, ContentModule module, Integer displayOrder) {
        return createTaskFromContentModule(step, module, displayOrder, true);
    }
}
