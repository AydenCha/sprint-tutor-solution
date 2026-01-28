package kr.codeit.onboarding.domain.enums;

/**
 * 온보딩 모듈 (Onboarding Module)
 * 강사 유형 + 투입 시점에 따라 6가지 모듈 중 하나 선택
 */
public enum OnboardingModule {
    /**
     * 모듈 A. 육성형 (신입 + 여유)
     * "모든 항목을 꼼꼼히 검증하여 '코드잇 강사'로 육성합니다."
     */
    A_NURTURING("육성형", "신입 + 여유", InstructorType.NEWBIE, TimingVariable.COMFORTABLE),
    
    /**
     * 모듈 B. 생존형 (신입 + 긴급) 🚨
     * "행정 사고 방지와 첫 주 수업 진행에 올인합니다."
     */
    B_SURVIVAL("생존형", "신입 + 긴급", InstructorType.NEWBIE, TimingVariable.URGENT),
    
    /**
     * 모듈 C. 얼라인형 (경력 + 여유)
     * "타 기관 습관을 버리고 코드잇의 톤앤매너를 입힙니다."
     */
    C_ALIGNMENT("얼라인형", "경력 + 여유", InstructorType.EXPERIENCED, TimingVariable.COMFORTABLE),
    
    /**
     * 모듈 D. 속성 적응형 (경력 + 긴급)
     * "강의력은 신뢰하되, 규정 리스크만 확실히 차단합니다."
     */
    D_QUICK_ADAPTATION("속성 적응형", "경력 + 긴급", InstructorType.EXPERIENCED, TimingVariable.URGENT),
    
    /**
     * 모듈 E. 업데이트형 (재계약 + 여유)
     * "변경된 사항만 체크하고, 비전을 다시 공유합니다."
     */
    E_UPDATE("업데이트형", "재계약 + 여유", InstructorType.RE_CONTRACT, TimingVariable.COMFORTABLE),
    
    /**
     * 모듈 F. 최소 확인형 (재계약 + 긴급)
     * "계약 및 필수 행정 절차만 빠르게 완료합니다."
     */
    F_MINIMAL_CHECK("최소 확인형", "재계약 + 긴급", InstructorType.RE_CONTRACT, TimingVariable.URGENT);
    
    private final String koreanName;
    private final String description;
    private final InstructorType instructorType;
    private final TimingVariable timingVariable;
    
    OnboardingModule(String koreanName, String description, 
                     InstructorType instructorType, TimingVariable timingVariable) {
        this.koreanName = koreanName;
        this.description = description;
        this.instructorType = instructorType;
        this.timingVariable = timingVariable;
    }
    
    public String getKoreanName() {
        return koreanName;
    }
    
    public String getDescription() {
        return description;
    }
    
    public InstructorType getInstructorType() {
        return instructorType;
    }
    
    public TimingVariable getTimingVariable() {
        return timingVariable;
    }
    
    /**
     * 강사 유형과 투입 시점으로 모듈 결정
     */
    public static OnboardingModule determine(InstructorType instructorType, TimingVariable timingVariable) {
        for (OnboardingModule module : values()) {
            if (module.instructorType == instructorType && module.timingVariable == timingVariable) {
                return module;
            }
        }
        // Default to nurturing module if no match
        return A_NURTURING;
    }
    
    public static OnboardingModule fromKorean(String koreanName) {
        for (OnboardingModule module : values()) {
            if (module.koreanName.equals(koreanName)) {
                return module;
            }
        }
        return null;
    }
}


