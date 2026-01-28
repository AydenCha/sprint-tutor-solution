package kr.codeit.onboarding.service;

import kr.codeit.onboarding.domain.entity.AuditLog;
import kr.codeit.onboarding.domain.entity.ContentModule;
import kr.codeit.onboarding.domain.entity.StepDefinition;
import kr.codeit.onboarding.domain.entity.User;
import kr.codeit.onboarding.dto.StepDefinitionRequest;
import kr.codeit.onboarding.dto.StepDefinitionResponse;
import kr.codeit.onboarding.exception.ResourceNotFoundException;
import kr.codeit.onboarding.repository.StepDefinitionRepository;
import kr.codeit.onboarding.repository.UserRepository;
import kr.codeit.onboarding.security.SecurityContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Step 정의 관리 서비스
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class StepDefinitionService {

    private final StepDefinitionRepository stepDefinitionRepository;
    private final UserRepository userRepository;
    private final kr.codeit.onboarding.repository.ContentModuleRepository contentModuleRepository;
    private final SecurityContext securityContext;
    private final AuditLogService auditLogService;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * 모든 Step 정의 조회 (모든 PM이 공동으로 사용)
     */
    public List<StepDefinitionResponse> getAllDefinitions() {
        securityContext.requirePm();
        // 모든 Step 정의를 displayOrder로 정렬하여 조회
        return stepDefinitionRepository.findAllOrderByDisplayOrder().stream()
                .map(this::toStepDefinitionResponse)
                .collect(Collectors.toList());
    }

    /**
     * Step 정의 조회
     */
    public StepDefinitionResponse getDefinition(Long id) {
        securityContext.requirePm();
        StepDefinition definition = stepDefinitionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Step definition not found"));
        return toStepDefinitionResponse(definition);
    }

    /**
     * Step 정의 생성
     */
    @Transactional
    public StepDefinitionResponse createDefinition(StepDefinitionRequest request) {
        securityContext.requirePm();
        Long pmId = securityContext.getCurrentUserId();
        User pm = userRepository.findById(pmId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Determine the next display order
        Integer maxDisplayOrder = stepDefinitionRepository.findMaxDisplayOrder().orElse(0);

        // Validate module IDs if provided
        List<Long> moduleIds = new ArrayList<>();
        if (request.getModuleIds() != null && !request.getModuleIds().isEmpty()) {
            List<ContentModule> modules = contentModuleRepository.findAllById(request.getModuleIds());
            if (modules.size() != request.getModuleIds().size()) {
                // 찾을 수 없는 모듈 ID들을 찾아서 상세 메시지 제공
                List<Long> foundIds = modules.stream().map(ContentModule::getId).toList();
                List<Long> missingIds = request.getModuleIds().stream()
                    .filter(id -> !foundIds.contains(id))
                    .toList();
                throw new ResourceNotFoundException(
                    "일부 모듈을 찾을 수 없습니다. 모듈 ID: " + missingIds + ". 모듈이 삭제되었거나 존재하지 않는지 확인해주세요."
                );
            }
            moduleIds = request.getModuleIds();
            log.info("Creating step definition with {} modules", moduleIds.size());
        }

        StepDefinition definition = StepDefinition.builder()
                .title(request.getTitle())
                .emoji(request.getEmoji())
                .description(request.getDescription())
                .defaultDDay(request.getDefaultDDay())
                .stepType(request.getStepType())
                .defaultModuleIds(moduleIds)
                .createdBy(pm)
                .displayOrder(maxDisplayOrder + 1)
                .build();

        definition = stepDefinitionRepository.save(definition);

        // 감사 로그 기록
        StepDefinitionResponse response = toStepDefinitionResponse(definition);
        auditLogService.logAction(
                AuditLog.ActionType.CREATE,
                "StepDefinition",
                definition.getId(),
                String.format("Step 정의 생성: %s", definition.getTitle()),
                null,
                response
        );

        return response;
    }

    /**
     * Step 정의 수정
     */
    @Transactional
    public StepDefinitionResponse updateDefinition(Long id, StepDefinitionRequest request) {
        securityContext.requirePm();
        StepDefinition definition = stepDefinitionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Step definition not found"));

        // 변경 전 값 저장 (로그용)
        StepDefinitionResponse oldValue = toStepDefinitionResponse(definition);

        definition.setTitle(request.getTitle());
        definition.setEmoji(request.getEmoji());
        definition.setDescription(request.getDescription());
        definition.setDefaultDDay(request.getDefaultDDay());
        definition.setStepType(request.getStepType());

        definition = stepDefinitionRepository.save(definition);
        
        // 감사 로그 기록
        StepDefinitionResponse newValue = toStepDefinitionResponse(definition);
        auditLogService.logAction(
                AuditLog.ActionType.UPDATE,
                "StepDefinition",
                definition.getId(),
                String.format("Step 정의 수정: %s", definition.getTitle()),
                oldValue,
                newValue
        );
        
        return newValue;
    }

    /**
     * Step 정의 삭제
     */
    @Transactional
    public void deleteDefinition(Long id) {
        securityContext.requirePm();
        StepDefinition definition = stepDefinitionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Step definition not found"));
        
        // 변경 전 값 저장 (로그용)
        StepDefinitionResponse oldValue = toStepDefinitionResponse(definition);

        // Note: StepTemplate was removed, so we no longer check for step definition usage in templates

        // Check if definition is used in any ContentModules
        List<kr.codeit.onboarding.domain.entity.ContentModule> modulesUsingDefinition =
            contentModuleRepository.findByStepDefinitionId(id);
        if (!modulesUsingDefinition.isEmpty()) {
            throw new IllegalStateException("Cannot delete step definition that is used in content modules");
        }

        stepDefinitionRepository.delete(definition);
        
        // 감사 로그 기록
        auditLogService.logAction(
                AuditLog.ActionType.DELETE,
                "StepDefinition",
                id,
                String.format("Step 정의 삭제: %s", definition.getTitle()),
                oldValue,
                null
        );
    }

    /**
     * Step 정의 순서 업데이트
     */
    @Transactional
    public List<StepDefinitionResponse> updateStepDefinitionOrder(List<Long> stepDefinitionIdsInOrder) {
        securityContext.requirePm();

        for (int i = 0; i < stepDefinitionIdsInOrder.size(); i++) {
            Long definitionId = stepDefinitionIdsInOrder.get(i);
            StepDefinition definition = stepDefinitionRepository.findById(definitionId)
                    .orElseThrow(() -> new ResourceNotFoundException("Step definition not found: " + definitionId));
            definition.setDisplayOrder(i + 1);
            stepDefinitionRepository.save(definition);
        }

        // 감사 로그 기록
        auditLogService.logAction(
                AuditLog.ActionType.UPDATE,
                "StepDefinition",
                null,
                "Step 정의 순서 변경",
                null,
                null
        );

        return getAllDefinitions();
    }

    /**
     * Step 정의에 모듈 할당
     * PM이 Step에 ContentModule들을 할당합니다.
     *
     * @param stepDefinitionId Step 정의 ID
     * @param moduleIds 할당할 모듈 ID 리스트 (순서대로)
     * @return 업데이트된 Step 정의
     */
    @Transactional
    public StepDefinitionResponse assignModules(Long stepDefinitionId, List<Long> moduleIds) {
        securityContext.requirePm();

        log.info("Assigning modules to step definition {}: {}", stepDefinitionId, moduleIds);

        // Step 정의 조회
        StepDefinition definition = stepDefinitionRepository.findById(stepDefinitionId)
                .orElseThrow(() -> new ResourceNotFoundException("Step definition not found: " + stepDefinitionId));

        // 변경 전 값 저장 (로그용)
        StepDefinitionResponse oldValue = toStepDefinitionResponse(definition);

        // 모듈 ID 유효성 검증
        if (moduleIds != null && !moduleIds.isEmpty()) {
            List<ContentModule> modules = contentModuleRepository.findAllById(moduleIds);
            if (modules.size() != moduleIds.size()) {
                // 찾을 수 없는 모듈 ID들을 찾아서 상세 메시지 제공
                List<Long> foundIds = modules.stream().map(ContentModule::getId).toList();
                List<Long> missingIds = moduleIds.stream()
                    .filter(id -> !foundIds.contains(id))
                    .toList();
                throw new ResourceNotFoundException(
                    "일부 모듈을 찾을 수 없습니다. 모듈 ID: " + missingIds + ". 모듈이 삭제되었거나 존재하지 않는지 확인해주세요."
                );
            }
            log.info("Validated {} modules for step {}", modules.size(), stepDefinitionId);
        }

        // 모듈 할당 (순서 유지)
        definition.setDefaultModuleIds(moduleIds != null ? new ArrayList<>(moduleIds) : new ArrayList<>());
        definition = stepDefinitionRepository.save(definition);

        // 감사 로그 기록
        StepDefinitionResponse newValue = toStepDefinitionResponse(definition);
        auditLogService.logAction(
                AuditLog.ActionType.UPDATE,
                "StepDefinition",
                stepDefinitionId,
                String.format("Step '%s'에 %d개 모듈 할당", definition.getTitle(),
                        (moduleIds != null ? moduleIds.size() : 0)),
                oldValue,
                newValue
        );

        log.info("Successfully assigned {} modules to step definition {}",
                (moduleIds != null ? moduleIds.size() : 0), stepDefinitionId);

        return newValue;
    }

    private StepDefinitionResponse toStepDefinitionResponse(StepDefinition definition) {
        // Use bidirectional relationship instead of deprecated defaultModuleIds
        List<Long> moduleIds = definition.getContentModules() != null
                ? definition.getContentModules().stream()
                        .map(ContentModule::getId)
                        .collect(Collectors.toList())
                : new ArrayList<>();

        return StepDefinitionResponse.builder()
                .id(definition.getId())
                .title(definition.getTitle())
                .emoji(definition.getEmoji())
                .description(definition.getDescription())
                .defaultDDay(definition.getDefaultDDay())
                .stepType(definition.getStepType())
                .displayOrder(definition.getDisplayOrder())
                .defaultModuleIds(moduleIds)  // Use relationship data instead of JSON field
                .createdBy(definition.getCreatedBy().getName())
                .createdAt(definition.getCreatedAt() != null ? definition.getCreatedAt().format(DATE_FORMATTER) : null)
                .updatedAt(definition.getUpdatedAt() != null ? definition.getUpdatedAt().format(DATE_FORMATTER) : null)
                .build();
    }
}

