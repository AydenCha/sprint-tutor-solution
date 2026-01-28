package kr.codeit.onboarding.domain.enums;

/**
 * Instructor Type
 * Variable A: Select onboarding module based on instructor type
 */
public enum InstructorType {
    /**
     * NEWBIE: No teaching experience
     * Risks: Inexperienced in class management, needs mental support, lacks ability to handle unexpected situations
     */
    NEWBIE("신입", "강의 경력 없음"),
    
    /**
     * EXPERIENCED: Has experience at other institutions
     * Risks: Habits from other institutions (My way), conflicts with Codeit culture, misunderstanding of KDT regulations
     */
    EXPERIENCED("경력", "타 기관 경험 있음"),
    
    /**
     * RE_CONTRACT: Has experience at Codeit
     * Risks: Mannerism, overlooking changed regulations/curriculum
     */
    RE_CONTRACT("재계약", "코드잇 경험 있음");
    
    private final String koreanName;
    private final String description;
    
    InstructorType(String koreanName, String description) {
        this.koreanName = koreanName;
        this.description = description;
    }
    
    public String getKoreanName() {
        return koreanName;
    }
    
    public String getDescription() {
        return description;
    }
    
    public static InstructorType fromKorean(String koreanName) {
        for (InstructorType type : values()) {
            if (type.koreanName.equals(koreanName)) {
                return type;
            }
        }
        return null;
    }
}


