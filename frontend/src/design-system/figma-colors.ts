/**
 * Figma Design System - 정확한 색상 팔레트
 * 
 * ⚠️  이 파일은 Figma 디자인 시스템에서 직접 추출한 100% 정확한 색상입니다.
 * 
 * Source: https://www.figma.com/design/CxKrltJY9eOcUjBeIXEkko/.../node-id=1-857
 * Extracted: 2026-01-28 (Figma Color Palette 직접 확인)
 */

export const FigmaColorsCorrect = {
  /**
   * Light Gray Palette (13 steps)
   * 주 용도: 배경, 텍스트, 테두리, UI 요소
   */
  gray: {
    '00': '#FFFFFF',  // White - 배경, 카드, 버튼 텍스트
    '05': '#FBFBFB',  // 매우 연한 회색 - 섹션 배경, 카드 배경
    '10': '#F6F6F8',  // 연한 회색 - 비활성 배경, 입력 필드
    '15': '#EDEDF0',  // 밝은 회색 - 구분선, 비활성 요소
    '20': '#E5E5EA',  // 중간 밝은 회색 - 테두리
    '30': '#DDDEE4',  // 회색 - 보조 테두리
    '40': '#D5D6DD',  // 밝은 중간 회색 - 카드 테두리, 타임라인
    '50': '#C2C3CD',  // 중간 회색 - 비활성 텍스트
    '60': '#ADAEB8',  // 어두운 회색 - 보조 텍스트
    '70': '#888893',  // 진한 회색 - 본문 텍스트
    '80': '#66666E',  // 매우 어두운 회색 - 헤딩
    '90': '#4A494F',  // 거의 검정 - 툴팁 배경
    '100': '#333236', // 블랙 - 주요 텍스트, 타이틀
  },

  /**
   * Purple Palette (13 steps)
   * 주 용도: 브랜드 컬러, Primary 액션, 강조
   */
  purple: {
    '00': '#FBF5FF',  // 거의 하얀색 - 배너 배경 (그라데이션 top)
    '05': '#F8ECFF',  // 매우 연한 보라 - 배너 배경 (그라데이션 bottom)
    '10': '#E9CCFF',  // 연한 보라 - 선택된 배경, Hover 배경
    '15': '#D4A4F9',  // 밝은 보라 - Active 배경
    '20': '#CD96F8',  // 중간 밝은 보라 - 배너 테두리, 보조 강조
    '30': '#C47CFD',  // 밝은 중간 보라 - 보조 버튼
    '40': '#B363FD',  // 중간 보라 - 보조 강조, Tertiary 버튼
    '50': '#A64EFF',  // Primary Purple - 주요 버튼 배경, 링크
    '60': '#9933FF',  // 진한 보라 - 버튼 Hover 상태
    '70': '#8F00FF',  // 어두운 보라 - Active 상태
    '80': '#760DDE',  // 매우 어두운 보라 - Pressed 상태
    '90': '#6500C2',  // 진한 보라 - 강조 텍스트 (75%, D-16 등)
    '100': '#54009E', // 가장 어두운 보라 - 타이틀, 강사 이름
  },

  /**
   * Green Palette (2 steps)
   * 주 용도: 성공 상태, 완료, 긍정적 피드백
   */
  green: {
    '00': '#E8F9EE',  // 연한 초록 - 성공 배경
    '60': '#16C44B',  // 초록 - 성공 아이콘, 완료 상태 (실제로는 #15C440 사용 가능)
    '70': '#0F773E',  // 진한 초록 - 성공 텍스트 (실제로는 #07AC30 사용 가능)
  },

  /**
   * Red Palette (2 steps)
   * 주 용도: 에러 상태, 경고, 부정적 피드백
   */
  red: {
    '60': '#FF4C5E',  // 빨강 - 에러 아이콘, 경고
    '70': '#E6172B',  // 진한 빨강 - 에러 텍스트
  },

  /**
   * Blue Palette (2 steps)
   * 주 용도: 정보 상태, 링크, 보조 액션
   */
  blue: {
    '00': '#E5F4FF',  // 연한 파랑 - 정보 배경
    '50': '#0099FF',  // 파랑 - 정보 아이콘, 링크 (실제로는 #1790FF 사용)
  },
} as const;

/**
 * HEX to HSL 변환 함수
 */
export function hexToHSL(hex: string): string {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/**
 * CSS Variables를 위한 HSL 값 생성
 */
export const FigmaColorsCSSVariables = {
  // Gray
  '--figma-gray-100': hexToHSL(FigmaColorsCorrect.gray['100']),
  '--figma-gray-90': hexToHSL(FigmaColorsCorrect.gray['90']),
  '--figma-gray-80': hexToHSL(FigmaColorsCorrect.gray['80']),
  '--figma-gray-70': hexToHSL(FigmaColorsCorrect.gray['70']),
  '--figma-gray-60': hexToHSL(FigmaColorsCorrect.gray['60']),
  '--figma-gray-50': hexToHSL(FigmaColorsCorrect.gray['50']),
  '--figma-gray-40': hexToHSL(FigmaColorsCorrect.gray['40']),
  '--figma-gray-30': hexToHSL(FigmaColorsCorrect.gray['30']),
  '--figma-gray-20': hexToHSL(FigmaColorsCorrect.gray['20']),
  '--figma-gray-15': hexToHSL(FigmaColorsCorrect.gray['15']),
  '--figma-gray-10': hexToHSL(FigmaColorsCorrect.gray['10']),
  '--figma-gray-05': hexToHSL(FigmaColorsCorrect.gray['05']),
  '--figma-gray-00': hexToHSL(FigmaColorsCorrect.gray['00']),

  // Purple
  '--figma-purple-100': hexToHSL(FigmaColorsCorrect.purple['100']),
  '--figma-purple-90': hexToHSL(FigmaColorsCorrect.purple['90']),
  '--figma-purple-80': hexToHSL(FigmaColorsCorrect.purple['80']),
  '--figma-purple-70': hexToHSL(FigmaColorsCorrect.purple['70']),
  '--figma-purple-60': hexToHSL(FigmaColorsCorrect.purple['60']),
  '--figma-purple-50': hexToHSL(FigmaColorsCorrect.purple['50']),
  '--figma-purple-40': hexToHSL(FigmaColorsCorrect.purple['40']),
  '--figma-purple-30': hexToHSL(FigmaColorsCorrect.purple['30']),
  '--figma-purple-20': hexToHSL(FigmaColorsCorrect.purple['20']),
  '--figma-purple-15': hexToHSL(FigmaColorsCorrect.purple['15']),
  '--figma-purple-10': hexToHSL(FigmaColorsCorrect.purple['10']),
  '--figma-purple-05': hexToHSL(FigmaColorsCorrect.purple['05']),
  '--figma-purple-00': hexToHSL(FigmaColorsCorrect.purple['00']),

  // Green
  '--figma-green-70': hexToHSL(FigmaColorsCorrect.green['70']),
  '--figma-green-60': hexToHSL(FigmaColorsCorrect.green['60']),
  '--figma-green-00': hexToHSL(FigmaColorsCorrect.green['00']),

  // Red
  '--figma-red-70': hexToHSL(FigmaColorsCorrect.red['70']),
  '--figma-red-60': hexToHSL(FigmaColorsCorrect.red['60']),

  // Blue
  '--figma-blue-50': hexToHSL(FigmaColorsCorrect.blue['50']),
  '--figma-blue-00': hexToHSL(FigmaColorsCorrect.blue['00']),
} as const;

/**
 * 잘못된 값들 (참고용)
 * 
 * 이전에 틀렸던 색상:
 * - Purple-10: #F6EBFF ❌ (정확: #E9CCFF)
 * - Purple-15: #EEDEFF ❌ (정확: #D4A4F9)
 * - Purple-20: #E5D0FF ❌ (정확: #CD96F8)
 * - Purple-40: #C090FF ❌ (정확: #B363FD)
 * - Purple-70: #6B1DB7 ❌ (정확: #8F00FF)
 * - Gray-80: #333236 ❌ (정확: #66666E)
 */
