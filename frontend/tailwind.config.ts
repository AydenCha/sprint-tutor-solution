import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Spoqa Han Sans Neo', 'Pretendard Variable', 'Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'Roboto', 'sans-serif'],
        logo: ['Hammersmith One', 'sans-serif'],
      },
      fontSize: {
        // Figma Typography Scale (Glyph 기반)
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
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        step: {
          pending: "hsl(var(--step-pending))",
          "in-progress": "hsl(var(--step-in-progress))",
          completed: "hsl(var(--step-completed))",
        },
        /* Figma Design System Colors */
        figma: {
          purple: {
            '100': "hsl(var(--figma-purple-100))",
            '90': "hsl(var(--figma-purple-90))",
            '80': "hsl(var(--figma-purple-80))",
            '70': "hsl(var(--figma-purple-70))",
            '60': "hsl(var(--figma-purple-60))",
            '50': "hsl(var(--figma-purple-50))",
            '40': "hsl(var(--figma-purple-40))",
            '30': "hsl(var(--figma-purple-30))",
            '20': "hsl(var(--figma-purple-20))",
            '15': "hsl(var(--figma-purple-15))",
            '10': "hsl(var(--figma-purple-10))",
            '05': "hsl(var(--figma-purple-05))",
            '00': "hsl(var(--figma-purple-00))",
          },
          gray: {
            '100': "hsl(var(--figma-gray-100))",
            '90': "hsl(var(--figma-gray-90))",
            '80': "hsl(var(--figma-gray-80))",
            '70': "hsl(var(--figma-gray-70))",
            '60': "hsl(var(--figma-gray-60))",
            '50': "hsl(var(--figma-gray-50))",
            '40': "hsl(var(--figma-gray-40))",
            '30': "hsl(var(--figma-gray-30))",
            '20': "hsl(var(--figma-gray-20))",
            '15': "hsl(var(--figma-gray-15))",
            '10': "hsl(var(--figma-gray-10))",
            '05': "hsl(var(--figma-gray-05))",
            '00': "hsl(var(--figma-gray-00))",
          },
        green: {
          '70': "hsl(var(--figma-green-70))",
          '60': "hsl(var(--figma-green-60))",
          '00': "hsl(var(--figma-green-00))",
        },
        red: {
          '70': "hsl(var(--figma-red-70))",
          '60': "hsl(var(--figma-red-60))",
        },
        blue: {
          '50': "hsl(var(--figma-blue-50))",
          '00': "hsl(var(--figma-blue-00))",
        },
      },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        'figma-01': '0px 2px 8px 0px rgba(0, 0, 0, 0.08)',
        'figma-02': '0px 4px 24px 0px rgba(0, 0, 0, 0.1)',
      },
      borderRadius: {
        // Figma Design System Border Radius
        'figma-sm': '4px',  // Badge, Tag, Small Button
        'figma-md': '6px',  // Input, Button Small
        'figma-lg': '8px',  // Button, Card, Default
        'figma-xl': '12px', // Modal, Large Card
        // Legacy (유지, 점진적 마이그레이션)
        'lg': 'var(--radius)',
        'md': 'calc(var(--radius) - 2px)',
        'sm': 'calc(var(--radius) - 4px)',
      },
      transitionDuration: {
        // Figma Design System Transition Duration
        'fast': '150ms',    // 작은 UI 변화 (hover, focus)
        'normal': '200ms',  // 일반 전환 (modal open, dropdown)
        'slow': '300ms',    // 큰 레이아웃 변화 (page transition)
      },
      transitionTimingFunction: {
        // Figma Design System Ease Functions
        'figma-ease': 'cubic-bezier(0.4, 0, 0.2, 1)',     // 기본 ease-out
        'figma-ease-in-out': 'cubic-bezier(0.4, 0, 0.6, 1)', // accordion
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(20px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "progress-fill": {
          from: { width: "0%" },
          to: { width: "var(--progress-value)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.4s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "progress-fill": "progress-fill 1s ease-out forwards",
      },
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
  ],
} satisfies Config;
