package kr.codeit.onboarding.service;

import kr.codeit.onboarding.domain.enums.OnboardingModule;
import kr.codeit.onboarding.domain.enums.StepType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * Service for managing module-specific step configurations.
 *
 * This service defines how each onboarding module (A-F) operates by mapping
 * step numbers to their execution types (PM-led, self-check, skip, delay).
 *
 * The configuration is immutable and initialized at class loading time.
 *
 * @author Sprint Tutor Flow Team
 * @version 1.0
 * @since 1.0
 */
@Service
@Slf4j
public class ModuleConfigurationService {

    /**
     * Immutable module configuration map.
     * Maps each onboarding module to its step configuration.
     * Key: OnboardingModule, Value: Map of step number to step type
     */
    private static final Map<OnboardingModule, Map<Integer, StepType>> MODULE_CONFIGURATIONS = new HashMap<>();

    static {
        initializeModuleConfigurations();
    }

    /**
     * Initializes all module configurations at class loading time.
     *
     * Each module (A-F) has a predefined set of steps with specific execution types:
     * - PM_LED: PM leads the step
     * - SELF_CHECK: Instructor completes independently
     * - SKIP: Step is skipped for this module
     * - DELAY: Step is delayed to later in the onboarding process
     */
    private static void initializeModuleConfigurations() {
        // 모듈 A. 육성형 (신입 + 여유)
        Map<Integer, StepType> moduleA = new HashMap<>();
        moduleA.put(1, StepType.SELF_CHECK); // Step 1(규정)
        moduleA.put(2, StepType.SELF_CHECK); // Step 2(조직)
        moduleA.put(3, StepType.PM_LED);     // Step 3(콘텐츠) - PM 주도
        moduleA.put(4, StepType.SELF_CHECK); // Step 4(환경)
        moduleA.put(5, StepType.SELF_CHECK); // Step 5(도구)
        moduleA.put(6, StepType.PM_LED);     // Step 6(역량) - PM 주도
        MODULE_CONFIGURATIONS.put(OnboardingModule.A_NURTURING, moduleA);

        // 모듈 B. 생존형 (신입 + 긴급) 🚨
        Map<Integer, StepType> moduleB = new HashMap<>();
        moduleB.put(1, StepType.PM_LED);     // Step 1(규정 - 금지사항) - PM 주도
        moduleB.put(2, StepType.DELAY);      // Step 2(조직) - 지연
        moduleB.put(3, StepType.PM_LED);    // Step 3(1주차 콘텐츠) - PM 주도
        moduleB.put(4, StepType.SELF_CHECK); // Step 4(환경 - 필수 항목만)
        moduleB.put(5, StepType.SELF_CHECK); // Step 5(도구 - 필수 항목만)
        moduleB.put(6, StepType.SKIP);       // Step 6(역량) - 생략
        MODULE_CONFIGURATIONS.put(OnboardingModule.B_SURVIVAL, moduleB);

        // 모듈 C. 얼라인형 (경력 + 여유)
        Map<Integer, StepType> moduleC = new HashMap<>();
        moduleC.put(1, StepType.PM_LED);     // Step 1(규정 - 차이점) - PM 주도
        moduleC.put(2, StepType.PM_LED);     // Step 2(조직 - 문화) - PM 주도
        moduleC.put(3, StepType.SELF_CHECK); // Step 3(콘텐츠)
        moduleC.put(4, StepType.SELF_CHECK); // Step 4(환경)
        moduleC.put(5, StepType.SELF_CHECK); // Step 5(도구)
        moduleC.put(6, StepType.SKIP);       // Step 6(역량) - 생략
        MODULE_CONFIGURATIONS.put(OnboardingModule.C_ALIGNMENT, moduleC);

        // 모듈 D. 속성 적응형 (경력 + 긴급)
        Map<Integer, StepType> moduleD = new HashMap<>();
        moduleD.put(1, StepType.PM_LED);     // Step 1(행정 패턴 - 필수) - PM 주도
        moduleD.put(2, StepType.DELAY);      // Step 2(조직 융화 전반) - 지연
        moduleD.put(3, StepType.SELF_CHECK); // Step 3(콘텐츠)
        moduleD.put(4, StepType.SKIP);       // Step 4(환경) - 생략
        moduleD.put(5, StepType.SELF_CHECK); // Step 5(도구 - LMS/ZEP)
        moduleD.put(6, StepType.SKIP);       // Step 6(역량) - 생략
        MODULE_CONFIGURATIONS.put(OnboardingModule.D_QUICK_ADAPTATION, moduleD);

        // 모듈 E. 업데이트형 (재계약 + 여유)
        Map<Integer, StepType> moduleE = new HashMap<>();
        moduleE.put(1, StepType.SELF_CHECK); // Step 1(규정 - 변경점만)
        moduleE.put(2, StepType.PM_LED);     // Step 2(조직 - 리텐션) - PM 주도
        moduleE.put(3, StepType.PM_LED);     // Step 3(변경된 콘텐츠) - PM 주도
        moduleE.put(4, StepType.SELF_CHECK); // Step 4(환경 - 기기 변경 시)
        moduleE.put(5, StepType.SKIP);       // Step 5(도구) - 생략
        moduleE.put(6, StepType.SKIP);       // Step 6(역량) - 생략
        MODULE_CONFIGURATIONS.put(OnboardingModule.E_UPDATE, moduleE);

        // 모듈 F. 최소 확인형 (재계약 + 긴급)
        Map<Integer, StepType> moduleF = new HashMap<>();
        moduleF.put(1, StepType.PM_LED);     // Step 1(계약/필수 행정) - PM 주도
        moduleF.put(2, StepType.SKIP);       // Step 2(조직) - 생략
        moduleF.put(3, StepType.SELF_CHECK); // Step 3(콘텐츠 - 서명만)
        moduleF.put(4, StepType.SKIP);       // Step 4(환경) - 생략
        moduleF.put(5, StepType.SELF_CHECK);  // Step 5(도구 - 서명만)
        moduleF.put(6, StepType.SKIP);        // Step 6(역량) - 생략
        MODULE_CONFIGURATIONS.put(OnboardingModule.F_MINIMAL_CHECK, moduleF);
    }

    /**
     * Retrieves the step type for a specific module and step number.
     *
     * @param module the onboarding module (A-F)
     * @param stepNumber the step number (1-7)
     * @return the step type for the given module and step number,
     *         defaults to SELF_CHECK if not found
     * @throws IllegalArgumentException if module is null
     */
    public StepType getStepType(OnboardingModule module, Integer stepNumber) {
        if (module == null) {
            throw new IllegalArgumentException("모듈 정보가 없습니다. 모듈을 먼저 선택해주세요.");
        }

        if (stepNumber == null || stepNumber < 1) {
            log.warn("Invalid step number: {} for module: {}, defaulting to SELF_CHECK", stepNumber, module);
            return StepType.SELF_CHECK;
        }

        Map<Integer, StepType> moduleConfig = getConfigurationForModule(module);

        StepType stepType = moduleConfig.get(stepNumber);
        if (stepType == null) {
            log.warn("Step type not found for module: {}, step: {}, defaulting to SELF_CHECK",
                    module, stepNumber);
            return StepType.SELF_CHECK;
        }

        return stepType;
    }

    /**
     * Retrieves all step numbers that should be included for a module.
     * Excludes steps marked as SKIP.
     *
     * @param module the onboarding module (A-F)
     * @return sorted list of step numbers that should be included,
     *         empty list if module not found or has no steps
     * @throws IllegalArgumentException if module is null
     */
    public java.util.List<Integer> getIncludedSteps(OnboardingModule module) {
        if (module == null) {
            throw new IllegalArgumentException("모듈 정보가 없습니다. 모듈을 먼저 선택해주세요.");
        }

        Map<Integer, StepType> moduleConfig = getConfigurationForModule(module);

        return moduleConfig.entrySet().stream()
                .filter(entry -> !isSkippedStep(entry.getValue()))
                .map(Map.Entry::getKey)
                .sorted()
                .collect(java.util.stream.Collectors.toList());
    }

    /**
     * Retrieves the complete step configuration for a module.
     *
     * @param module the onboarding module (A-F)
     * @return map of step numbers to step types,
     *         empty map if module configuration not found
     * @throws IllegalArgumentException if module is null
     */
    public Map<Integer, StepType> getModuleConfiguration(OnboardingModule module) {
        if (module == null) {
            throw new IllegalArgumentException("모듈 정보가 없습니다. 모듈을 먼저 선택해주세요.");
        }

        return new HashMap<>(getConfigurationForModule(module));
    }

    /**
     * Helper method to retrieve module configuration with proper error handling.
     *
     * @param module the onboarding module
     * @return module configuration map, empty map if not found
     */
    private Map<Integer, StepType> getConfigurationForModule(OnboardingModule module) {
        Map<Integer, StepType> moduleConfig = MODULE_CONFIGURATIONS.get(module);
        if (moduleConfig == null) {
            log.warn("Module configuration not found for: {}, returning empty configuration", module);
            return new HashMap<>();
        }
        return moduleConfig;
    }

    /**
     * Checks if a step should be skipped.
     *
     * @param stepType the step type to check
     * @return true if the step should be skipped, false otherwise
     */
    private boolean isSkippedStep(StepType stepType) {
        return stepType == StepType.SKIP;
    }
}


