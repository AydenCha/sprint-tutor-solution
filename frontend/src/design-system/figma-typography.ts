/**
 * Figma Design System - Typography Scale
 * 
 * 이 파일은 Figma 디자인 시스템에서 추출한 정확한 타이포그래피 스케일을 포함합니다.
 * Figma MCP server 종료 후에도 사용 가능하도록 프로젝트에 영구 저장됩니다.
 * 
 * Source: https://www.figma.com/design/CxKrltJY9eOcUjBeIXEkko/강사-온보딩-솔루션?node-id=2-4829
 * Extracted: 2026-01-28
 */

export const FigmaTypography = {
  /**
   * Typography Scale (Glyph 기반)
   * 
   * 각 스케일은 다음 정보를 포함:
   * - size: 폰트 크기 (px)
   * - lineHeight: 행 높이 (px)
   * - letterSpacing: 자간 (px, 모든 텍스트 -0.3px)
   * - weights: 사용 가능한 폰트 무게
   */
  scale: {
    /** Hero Title - 최대 크기 타이틀 */
    glyph68: {
      size: '68px',
      lineHeight: '84px',
      letterSpacing: '-0.3px',
      weights: ['bold'],
      usage: 'Hero title, Landing page main heading',
    },
    
    /** Main Title - 메인 타이틀 */
    glyph54: {
      size: '54px',
      lineHeight: '70px',
      letterSpacing: '-0.3px',
      weights: ['bold'],
      usage: 'Main page title, Section hero',
    },
    
    /** Section Title - 섹션 타이틀 */
    glyph48: {
      size: '48px',
      lineHeight: '62px',
      letterSpacing: '-0.3px',
      weights: ['bold'],
      usage: 'Section title, Large heading',
    },
    
    /** Large Heading - 큰 헤딩 */
    glyph38: {
      size: '38px',
      lineHeight: '50px',
      letterSpacing: '-0.3px',
      weights: ['bold'],
      usage: 'Page heading, Card title (large)',
    },
    
    /** Heading 1 */
    glyph32: {
      size: '32px',
      lineHeight: '44px',
      letterSpacing: '-0.3px',
      weights: ['bold'],
      usage: 'H1, Primary heading',
    },
    
    /** Heading 2 */
    glyph28: {
      size: '28px',
      lineHeight: '40px',
      letterSpacing: '-0.3px',
      weights: ['bold', 'medium'],
      usage: 'H2, Secondary heading, Card title',
    },
    
    /** Heading 3 */
    glyph24: {
      size: '24px',
      lineHeight: '36px',
      letterSpacing: '-0.3px',
      weights: ['bold', 'medium'],
      usage: 'H3, Module title, Subsection heading',
    },
    
    /** Heading 4 / Body Large */
    glyph20: {
      size: '20px',
      lineHeight: '32px',
      letterSpacing: '-0.3px',
      weights: ['bold', 'medium', 'regular'],
      usage: 'H4, Large body text, Button XL',
    },
    
    /** Body Text */
    glyph18: {
      size: '18px',
      lineHeight: '30px',
      letterSpacing: '-0.3px',
      weights: ['bold', 'medium', 'regular'],
      usage: 'Body text, Paragraph, Button L',
    },
    
    /** Body Small */
    glyph16: {
      size: '16px',
      lineHeight: '27px',
      letterSpacing: '-0.3px',
      weights: ['bold', 'medium', 'regular'],
      usage: 'Small body text, Form label, Button M',
    },
    
    /** Caption */
    glyph14: {
      size: '14px',
      lineHeight: '24px',
      letterSpacing: '-0.3px',
      weights: ['bold', 'medium', 'regular'],
      usage: 'Caption, Helper text, Button S',
    },
    
    /** Small Caption */
    glyph12: {
      size: '12px',
      lineHeight: '20px',
      letterSpacing: '-0.3px',
      weights: ['bold', 'medium', 'regular'],
      usage: 'Small caption, Badge, Timestamp',
    },
  },

  /**
   * Font Weights
   */
  weights: {
    bold: 700,
    medium: 500,
    regular: 400,
  },

  /**
   * Font Families
   */
  families: {
    primary: 'Spoqa Han Sans Neo',
    fallback: 'Pretendard Variable',
    logo: 'Hammersmith One',
  },
} as const;

/**
 * Tailwind Config용 Font Size 정의
 * 
 * 사용법:
 * ```tsx
 * <h1 className="text-glyph-68 font-bold">Hero Title</h1>
 * <p className="text-glyph-16 font-regular">Body text</p>
 * ```
 */
export const TailwindFontSizes = {
  'glyph-68': ['68px', { lineHeight: '84px', letterSpacing: '-0.3px' }],
  'glyph-54': ['54px', { lineHeight: '70px', letterSpacing: '-0.3px' }],
  'glyph-48': ['48px', { lineHeight: '62px', letterSpacing: '-0.3px' }],
  'glyph-38': ['38px', { lineHeight: '50px', letterSpacing: '-0.3px' }],
  'glyph-32': ['32px', { lineHeight: '44px', letterSpacing: '-0.3px' }],
  'glyph-28': ['28px', { lineHeight: '40px', letterSpacing: '-0.3px' }],
  'glyph-24': ['24px', { lineHeight: '36px', letterSpacing: '-0.3px' }],
  'glyph-20': ['20px', { lineHeight: '32px', letterSpacing: '-0.3px' }],
  'glyph-18': ['18px', { lineHeight: '30px', letterSpacing: '-0.3px' }],
  'glyph-16': ['16px', { lineHeight: '27px', letterSpacing: '-0.3px' }],
  'glyph-14': ['14px', { lineHeight: '24px', letterSpacing: '-0.3px' }],
  'glyph-12': ['12px', { lineHeight: '20px', letterSpacing: '-0.3px' }],
} as const;

/**
 * 반응형 Typography Mapping
 * 
 * 모바일에서는 작은 Glyph 사용, 데스크톱에서는 원본 Glyph 사용
 */
export const ResponsiveTypography = {
  hero: {
    mobile: 'text-glyph-38',
    tablet: 'text-glyph-54',
    desktop: 'text-glyph-68',
  },
  mainTitle: {
    mobile: 'text-glyph-32',
    tablet: 'text-glyph-48',
    desktop: 'text-glyph-54',
  },
  sectionTitle: {
    mobile: 'text-glyph-28',
    tablet: 'text-glyph-38',
    desktop: 'text-glyph-48',
  },
  heading1: {
    mobile: 'text-glyph-24',
    tablet: 'text-glyph-28',
    desktop: 'text-glyph-32',
  },
  heading2: {
    mobile: 'text-glyph-20',
    tablet: 'text-glyph-24',
    desktop: 'text-glyph-28',
  },
  heading3: {
    mobile: 'text-glyph-18',
    tablet: 'text-glyph-20',
    desktop: 'text-glyph-24',
  },
  body: {
    mobile: 'text-glyph-16',
    tablet: 'text-glyph-16',
    desktop: 'text-glyph-18',
  },
  bodySmall: {
    mobile: 'text-glyph-14',
    tablet: 'text-glyph-14',
    desktop: 'text-glyph-16',
  },
  caption: {
    mobile: 'text-glyph-12',
    tablet: 'text-glyph-12',
    desktop: 'text-glyph-14',
  },
} as const;

/**
 * Typography Helper Functions
 */

/**
 * Glyph 클래스 이름 생성
 */
export function getGlyphClass(
  glyph: keyof typeof TailwindFontSizes,
  weight: 'bold' | 'medium' | 'regular' = 'regular'
): string {
  const weightClass = {
    bold: 'font-bold',
    medium: 'font-medium',
    regular: 'font-normal',
  }[weight];
  
  return `text-${glyph} ${weightClass} tracking-[-0.3px]`;
}

/**
 * 반응형 Typography 클래스 생성
 */
export function getResponsiveTypography(
  type: keyof typeof ResponsiveTypography,
  weight: 'bold' | 'medium' | 'regular' = 'regular'
): string {
  const responsive = ResponsiveTypography[type];
  const weightClass = {
    bold: 'font-bold',
    medium: 'font-medium',
    regular: 'font-normal',
  }[weight];
  
  return `${responsive.mobile} md:${responsive.tablet} lg:${responsive.desktop} ${weightClass} tracking-[-0.3px]`;
}

/**
 * 사용 예시:
 * 
 * ```tsx
 * import { getGlyphClass, getResponsiveTypography } from '@/design-system/figma-typography';
 * 
 * // 고정 크기
 * <h1 className={getGlyphClass('glyph-32', 'bold')}>Heading 1</h1>
 * 
 * // 반응형
 * <h1 className={getResponsiveTypography('hero', 'bold')}>Hero Title</h1>
 * 
 * // Tailwind 클래스 직접 사용
 * <p className="text-glyph-16 font-normal tracking-[-0.3px]">Body text</p>
 * ```
 */

export default FigmaTypography;
