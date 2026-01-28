package kr.codeit.onboarding.service;

import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvException;
import kr.codeit.onboarding.domain.entity.AuditLog;
import kr.codeit.onboarding.domain.entity.ContentModule;
import kr.codeit.onboarding.domain.entity.User;
import kr.codeit.onboarding.domain.enums.ContentType;
import kr.codeit.onboarding.dto.ModuleResponse;
import kr.codeit.onboarding.repository.ContentModuleRepository;
import kr.codeit.onboarding.security.SecurityContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 모듈 일괄 등록 서비스 (CSV, Excel)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ModuleImportService {

    private final ContentModuleRepository moduleRepository;
    private final kr.codeit.onboarding.repository.UserRepository userRepository;
    private final SecurityContext securityContext;
    private final AuditLogService auditLogService;

    /**
     * CSV 또는 Excel 파일로 모듈 일괄 등록
     */
    @Transactional
    public List<ModuleResponse> importModulesFromFile(MultipartFile file) throws IOException {
        securityContext.requirePm();
        Long pmId = securityContext.getCurrentUserId();
        User currentPm = userRepository.findById(pmId)
                .orElseThrow(() -> new kr.codeit.onboarding.exception.ResourceNotFoundException("User not found"));

        String filename = file.getOriginalFilename();
        if (filename == null) {
            throw new IllegalArgumentException("파일명이 없습니다.");
        }

        String extension = filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
        List<ModuleImportRow> rows;

        if ("csv".equals(extension)) {
            rows = parseCsvFile(file);
        } else if ("xlsx".equals(extension) || "xls".equals(extension)) {
            rows = parseExcelFile(file);
        } else {
            throw new IllegalArgumentException("지원하지 않는 파일 형식입니다. CSV 또는 Excel 파일만 업로드 가능합니다.");
        }

        List<ModuleResponse> createdModules = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        for (int i = 0; i < rows.size(); i++) {
            ModuleImportRow row = rows.get(i);
            int rowNumber = i + 2; // 헤더 포함

            try {
                ContentModule module = createModuleFromRow(row, currentPm);
                module = moduleRepository.save(module);
                
                ModuleResponse response = toModuleResponse(module);
                createdModules.add(response);

                // 감사 로그 기록
                auditLogService.logAction(
                        AuditLog.ActionType.CREATE,
                        "ContentModule",
                        module.getId(),
                        String.format("CSV/Excel로 모듈 일괄 생성: %s", module.getName()),
                        null,
                        response
                );
            } catch (Exception e) {
                String errorMsg = String.format("행 %d: %s - %s", rowNumber, row.getName(), e.getMessage());
                errors.add(errorMsg);
                log.error("모듈 생성 실패: {}", errorMsg, e);
            }
        }

        if (!errors.isEmpty()) {
            log.warn("일부 모듈 생성 실패: {}", String.join(", ", errors));
        }

        return createdModules;
    }

    /**
     * CSV 파일 파싱
     */
    private List<ModuleImportRow> parseCsvFile(MultipartFile file) throws IOException {
        List<ModuleImportRow> rows = new ArrayList<>();

        try (CSVReader reader = new CSVReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            
            List<String[]> allRows = reader.readAll();
            
            if (allRows.isEmpty()) {
                throw new IllegalArgumentException("CSV 파일이 비어있습니다.");
            }

            // 헤더 스킵 (첫 번째 행)
            for (int i = 1; i < allRows.size(); i++) {
                String[] row = allRows.get(i);
                if (row.length == 0 || (row.length == 1 && row[0].trim().isEmpty())) {
                    continue; // 빈 행 스킵
                }
                rows.add(parseCsvRow(row));
            }
        } catch (CsvException e) {
            throw new IOException("CSV 파일 파싱 실패: " + e.getMessage(), e);
        }

        return rows;
    }

    /**
     * Excel 파일 파싱
     */
    private List<ModuleImportRow> parseExcelFile(MultipartFile file) throws IOException {
        List<ModuleImportRow> rows = new ArrayList<>();

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0); // 첫 번째 시트 사용

            if (sheet.getPhysicalNumberOfRows() < 2) {
                throw new IllegalArgumentException("Excel 파일이 비어있거나 헤더만 있습니다.");
            }

            // 헤더 스킵 (첫 번째 행)
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) {
                    continue; // 빈 행 스킵
                }
                rows.add(parseExcelRow(row));
            }
        }

        return rows;
    }

    /**
     * CSV 행 파싱
     */
    private ModuleImportRow parseCsvRow(String[] row) {
        if (row.length < 3) {
            throw new IllegalArgumentException("필수 컬럼이 부족합니다. (최소: 이름, 타입, 설명)");
        }

        ModuleImportRow importRow = new ModuleImportRow();
        importRow.setName(row[0].trim());
        importRow.setContentType(parseContentType(row[1].trim()));
        importRow.setDescription(row.length > 2 ? row[2].trim() : "");
        importRow.setDocumentUrl(row.length > 3 ? row[3].trim() : null);
        importRow.setVideoUrl(row.length > 4 ? row[4].trim() : null);
        importRow.setVideoDuration(row.length > 5 && !row[5].trim().isEmpty() ? 
                Integer.parseInt(row[5].trim()) : null);
        importRow.setRequiredFiles(row.length > 6 && !row[6].trim().isEmpty() ? 
                parseStringList(row[6].trim()) : null);
        importRow.setTags(row.length > 7 && !row[7].trim().isEmpty() ? 
                parseStringList(row[7].trim()) : null);

        return importRow;
    }

    /**
     * Excel 행 파싱
     */
    private ModuleImportRow parseExcelRow(Row row) {
        ModuleImportRow importRow = new ModuleImportRow();
        
        importRow.setName(getCellValueAsString(row.getCell(0)));
        importRow.setContentType(parseContentType(getCellValueAsString(row.getCell(1))));
        importRow.setDescription(getCellValueAsString(row.getCell(2)));
        importRow.setDocumentUrl(getCellValueAsString(row.getCell(3)));
        importRow.setVideoUrl(getCellValueAsString(row.getCell(4)));
        
        Cell videoDurationCell = row.getCell(5);
        if (videoDurationCell != null && videoDurationCell.getCellType() == CellType.NUMERIC) {
            importRow.setVideoDuration((int) videoDurationCell.getNumericCellValue());
        }
        
        importRow.setRequiredFiles(parseStringList(getCellValueAsString(row.getCell(6))));
        importRow.setTags(parseStringList(getCellValueAsString(row.getCell(7))));

        return importRow;
    }

    /**
     * Excel 셀 값을 문자열로 변환
     */
    private String getCellValueAsString(Cell cell) {
        if (cell == null) {
            return "";
        }

        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue().trim();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getDateCellValue().toString();
                } else {
                    // 정수로 표시
                    double numericValue = cell.getNumericCellValue();
                    if (numericValue == (long) numericValue) {
                        return String.valueOf((long) numericValue);
                    } else {
                        return String.valueOf(numericValue);
                    }
                }
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                return cell.getCellFormula();
            default:
                return "";
        }
    }

    /**
     * ContentType 파싱
     */
    private ContentType parseContentType(String typeStr) {
        if (typeStr == null || typeStr.trim().isEmpty()) {
            throw new IllegalArgumentException("콘텐츠 타입이 필요합니다.");
        }

        String upper = typeStr.trim().toUpperCase();
        switch (upper) {
            case "A":
            case "DOCUMENT":
            case "문서":
                return ContentType.A;
            case "B":
            case "VIDEO":
            case "영상":
                return ContentType.B;
            case "C":
            case "FILE_UPLOAD":
            case "파일업로드":
                return ContentType.C;
            case "D":
            case "CHECKLIST":
            case "체크리스트":
                return ContentType.D;
            default:
                throw new IllegalArgumentException("지원하지 않는 콘텐츠 타입: " + typeStr);
        }
    }

    /**
     * 문자열 리스트 파싱 (쉼표로 구분)
     */
    private List<String> parseStringList(String str) {
        if (str == null || str.trim().isEmpty()) {
            return null;
        }
        return List.of(str.split(","))
                .stream()
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    /**
     * 행 데이터로부터 모듈 생성
     */
    private ContentModule createModuleFromRow(ModuleImportRow row, User createdBy) {
        if (row.getName() == null || row.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("모듈 이름이 필요합니다.");
        }

        // Convert requiredFiles from List<String> to List<FileRequirement>
        List<kr.codeit.onboarding.dto.FileRequirement> fileRequirements = null;
        if (row.getRequiredFiles() != null && !row.getRequiredFiles().isEmpty()) {
            fileRequirements = row.getRequiredFiles().stream()
                    .map(filename -> kr.codeit.onboarding.dto.FileRequirement.builder()
                            .placeholder("파일을 업로드해주세요: " + filename)
                            .fileNameHint(filename)
                            .allowedExtensions(List.of(".pdf", ".docx", ".zip"))  // Default extensions
                            .required(true)
                            .build())
                    .collect(Collectors.toList());
        }

        ContentModule module = ContentModule.builder()
                .name(row.getName())
                .description(row.getDescription())
                .contentType(row.getContentType())
                .createdBy(createdBy)
                .documentUrl(row.getDocumentUrl())
                .videoUrl(row.getVideoUrl())
                .videoDuration(row.getVideoDuration())
                .requiredFiles(fileRequirements)
                .tags(row.getTags())
                .build();

        return module;
    }

    /**
     * ModuleResponse로 변환
     */
    private ModuleResponse toModuleResponse(ContentModule module) {
        return ModuleResponse.builder()
                .id(module.getId())
                .name(module.getName())
                .description(module.getDescription())
                .contentType(module.getContentType())
                .documentUrl(module.getDocumentUrl())
                .videoUrl(module.getVideoUrl())
                .videoDuration(module.getVideoDuration())
                .requiredFiles(module.getRequiredFiles())
                .quizQuestions(module.getQuizQuestions().stream()
                        .map(q -> kr.codeit.onboarding.dto.QuizQuestionResponse.builder()
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
                        .map(item -> kr.codeit.onboarding.dto.ChecklistItemResponse.builder()
                                .id(item.getId())
                                .label(item.getLabel())
                                .build())
                        .collect(Collectors.toList()))
                .tags(module.getTags())
                .createdBy(module.getCreatedBy().getName())
                .createdAt(module.getCreatedAt() != null ? module.getCreatedAt().toString() : null)
                .build();
    }

    /**
     * 모듈 임포트 행 데이터 클래스
     */
    @lombok.Data
    private static class ModuleImportRow {
        private String name;
        private ContentType contentType;
        private String description;
        private String documentUrl;
        private String videoUrl;
        private Integer videoDuration;
        private List<String> requiredFiles;
        private List<String> tags;
    }
}

