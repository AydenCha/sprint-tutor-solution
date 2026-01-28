package kr.codeit.onboarding.domain.enums;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/**
 * Timing Variable
 * Variable B: Determines COMFORTABLE/URGENT based on onboarding completion date
 */
public enum TimingVariable {
    /**
     * COMFORTABLE: 2 weeks or more before onboarding completion date
     * Operation mode: Standard - Perform all steps and verification procedures
     */
    COMFORTABLE("여유", "온보딩 완료일 2주 전 이상", 14),
    
    /**
     * URGENT: Less than 2 weeks before onboarding completion date
     * Operation mode: Survival - Focus on accident prevention and first week class survival
     */
    URGENT("긴급", "온보딩 완료일 2주 미만", 0);
    
    private final String koreanName;
    private final String description;
    private final int minDaysThreshold;
    
    TimingVariable(String koreanName, String description, int minDaysThreshold) {
        this.koreanName = koreanName;
        this.description = description;
        this.minDaysThreshold = minDaysThreshold;
    }
    
    public String getKoreanName() {
        return koreanName;
    }
    
    public String getDescription() {
        return description;
    }
    
    /**
     * Determine COMFORTABLE/URGENT based on class start date
     * @param startDate Class start date
     * @return COMFORTABLE if 2 weeks or more, URGENT otherwise
     */
    public static TimingVariable calculate(LocalDate startDate) {
        LocalDate today = LocalDate.now();
        long daysUntilStart = ChronoUnit.DAYS.between(today, startDate);
        
        // If 2 weeks (14 days) or more, COMFORTABLE; otherwise URGENT
        return daysUntilStart >= 14 ? COMFORTABLE : URGENT;
    }
    
    public static TimingVariable fromKorean(String koreanName) {
        for (TimingVariable timing : values()) {
            if (timing.koreanName.equals(koreanName)) {
                return timing;
            }
        }
        return null;
    }
}


