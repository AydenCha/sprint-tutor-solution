package kr.codeit.onboarding.domain.enums;

/**
 * Step Operation Type
 * Defines how each step is operated
 */
public enum StepType {
    /**
     * PM_LED: PM directly manages and provides detailed feedback on deliverables
     */
    PM_LED("PM 주도", "PM이 직접 관리하고 피드백"),
    
    /**
     * SELF_CHECK: Instructor performs tasks independently after receiving guide, only submits deliverables
     */
    SELF_CHECK("자가 점검", "강사가 스스로 수행, 산출물만 제출"),
    
    /**
     * SKIP: Can be skipped in urgent situations
     */
    SKIP("생략", "생략 가능한 항목"),
    
    /**
     * DELAY: Can be postponed until after classes
     */
    DELAY("지연", "수업 이후로 연기");
    
    private final String koreanName;
    private final String description;
    
    StepType(String koreanName, String description) {
        this.koreanName = koreanName;
        this.description = description;
    }
    
    public String getKoreanName() {
        return koreanName;
    }
    
    public String getDescription() {
        return description;
    }
    
    public static StepType fromKorean(String koreanName) {
        for (StepType type : values()) {
            if (type.koreanName.equals(koreanName)) {
                return type;
            }
        }
        return null;
    }
}


