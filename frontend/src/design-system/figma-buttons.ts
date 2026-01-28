/**
 * Figma Design System - Button Specifications
 * 
 * Figma MCP server 종료 후에도 사용 가능하도록 프로젝트에 영구 저장됩니다.
 * 
 * Source: https://www.figma.com/design/CxKrltJY9eOcUjBeIXEkko/강사-온보딩-솔루션?node-id=2-2615
 * Extracted: 2026-01-28
 */

export const FigmaButtons = {
  /**
   * Button Variants
   */
  variants: {
    primary: {
      name: 'Primary Button',
      default: {
        background: '#9933FF', // purple-50
        color: '#FFFFFF', // gray-00
        border: 'none',
      },
      hover: {
        background: '#8228DB', // purple-60
        color: '#FFFFFF',
        border: 'none',
      },
      disabled: {
        background: '#D5D6DD', // gray-40
        color: '#ADAEB8', // gray-30
        border: 'none',
      },
    },
    secondary: {
      name: 'Secondary Button',
      default: {
        background: '#F6F6F8', // gray-10
        color: '#333236', // gray-100
        border: 'none',
      },
      hover: {
        background: '#EDEDF0', // gray-15
        color: '#333236',
        border: 'none',
      },
      disabled: {
        background: '#FBFBFB', // gray-05
        color: '#D5D6DD', // gray-40
        border: 'none',
      },
    },
    tertiary: {
      name: 'Tertiary Button',
      default: {
        background: 'transparent',
        color: '#9933FF', // purple-50
        border: 'none',
      },
      hover: {
        background: '#FBF5FF', // purple-00
        color: '#9933FF',
        border: 'none',
      },
      disabled: {
        background: 'transparent',
        color: '#D5D6DD', // gray-40
        border: 'none',
      },
    },
    icon: {
      name: 'Icon Button',
      default: {
        background: 'transparent',
        color: '#333236', // gray-100
        border: 'none',
      },
      hover: {
        background: '#F6F6F8', // gray-10
        color: '#333236',
        border: 'none',
      },
      disabled: {
        background: 'transparent',
        color: '#D5D6DD', // gray-40
        border: 'none',
      },
    },
  },

  /**
   * Button Sizes
   * 
   * Height는 padding 포함한 전체 높이
   */
  sizes: {
    xl: {
      height: '54px',
      padding: '13px 24px', // (54 - 28) / 2 = 13px vertical
      fontSize: '18px',
      lineHeight: '30px', // Glyph-18 (실제로는 28px content)
      fontWeight: 'bold', // 700
      letterSpacing: '-0.3px',
      borderRadius: '8px',
      gap: '6px',
    },
    lg: {
      height: '42px',
      padding: '9px 20px', // (42 - 24) / 2 = 9px vertical
      fontSize: '16px',
      lineHeight: '27px', // Glyph-16 (실제로는 24px content)
      fontWeight: 'medium', // 500
      letterSpacing: '-0.3px',
      borderRadius: '8px',
      gap: '4px',
    },
    md: {
      height: '40px',
      padding: '8px 16px', // (40 - 24) / 2 = 8px vertical
      fontSize: '14px',
      lineHeight: '24px', // Glyph-14
      fontWeight: 'medium', // 500
      letterSpacing: '-0.3px',
      borderRadius: '8px',
      gap: '4px',
    },
    sm: {
      height: '32px',
      padding: '5px 12px', // (32 - 22) / 2 = 5px vertical
      fontSize: '12px',
      lineHeight: '20px', // Glyph-12 (실제로는 22px content)
      fontWeight: 'medium', // 500
      letterSpacing: '-0.3px',
      borderRadius: '6px',
      gap: '4px',
    },
  },

  /**
   * Icon Button Sizes (정사각형)
   */
  iconSizes: {
    lg: {
      size: '40px',
      iconSize: '20px',
      borderRadius: '8px',
    },
    md: {
      size: '32px',
      iconSize: '16px',
      borderRadius: '6px',
    },
    sm: {
      size: '24px',
      iconSize: '12px',
      borderRadius: '4px',
    },
  },
} as const;

/**
 * Tailwind Config용 Button Variants 정의
 */
export const TailwindButtonVariants = {
  variant: {
    primary: 'bg-figma-purple-50 text-figma-gray-00 hover:bg-figma-purple-60 disabled:bg-figma-gray-40 disabled:text-figma-gray-30',
    secondary: 'bg-figma-gray-10 text-figma-gray-100 hover:bg-figma-gray-15 disabled:bg-figma-gray-05 disabled:text-figma-gray-40',
    tertiary: 'bg-transparent text-figma-purple-50 hover:bg-figma-purple-00 disabled:text-figma-gray-40',
    icon: 'bg-transparent text-figma-gray-100 hover:bg-figma-gray-10 disabled:text-figma-gray-40',
  },
  size: {
    xl: 'h-[54px] px-6 text-glyph-18 font-bold gap-[6px] rounded-lg',
    lg: 'h-[42px] px-5 text-glyph-16 font-medium gap-1 rounded-lg',
    md: 'h-[40px] px-4 text-glyph-14 font-medium gap-1 rounded-lg',
    sm: 'h-[32px] px-3 text-glyph-12 font-medium gap-1 rounded-md',
  },
  iconSize: {
    lg: 'size-[40px] rounded-lg',
    md: 'size-[32px] rounded-md',
    sm: 'size-[24px] rounded',
  },
} as const;

/**
 * 사용 예시:
 * 
 * ```tsx
 * import { Button } from '@/components/ui/button';
 * 
 * // Primary Button XL
 * <Button variant="primary" size="xl">확인</Button>
 * 
 * // Secondary Button LG
 * <Button variant="secondary" size="lg">취소</Button>
 * 
 * // Icon Button MD
 * <Button variant="icon" size="icon-md">
 *   <Icon />
 * </Button>
 * ```
 */

export default FigmaButtons;
