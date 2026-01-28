package kr.codeit.onboarding.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 파일 업로드 요구사항 (Type C 모듈용)
 * PM이 강사에게 요구하는 파일의 조건을 정의
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileRequirement {
    
    /**
     * 파일 설명 (예: "이력서를 업로드해주세요")
     */
    private String placeholder;
    
    /**
     * 파일명 힌트 (예: "resume", "portfolio")
     * 실제 파일명은 "{fileNameHint}_{timestamp}.{ext}" 형식으로 저장
     */
    private String fileNameHint;
    
    /**
     * 허용되는 확장자 목록 (예: [".pdf", ".docx"])
     */
    private List<String> allowedExtensions;
    
    /**
     * 필수 파일 여부
     */
    private Boolean required;
}
