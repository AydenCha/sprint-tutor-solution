# Sprint Tutor Flow – Frontend

React + TypeScript + Vite frontend for the Codeit Sprint Instructor Onboarding Portal.

## Tech Stack

- Vite, React 18, TypeScript
- Tailwind CSS, shadcn/ui
- React Query, React Hook Form, Zod

## Setup

```bash
npm install
npm run dev    # http://localhost:5173
```

Set `VITE_API_URL` (default: `http://localhost:8080/api`) if the backend runs elsewhere.

## Scripts

- `npm run dev` – Development server
- `npm run build` – Production build
- `npm run build:dev` – Development build
- `npm run lint` – ESLint

## Source Structure

```
src/
├── pages/           # Route-level pages (Landing, PMDashboard, InstructorDashboard, etc.)
├── components/      # Reusable UI
│   ├── ui/          # shadcn components
│   └── modules/     # Content modules (DocumentQuiz, VideoQuiz, FileUpload, Checklist)
├── services/api.ts  # API client (auth, instructors, tasks, files, etc.)
├── contexts/        # AuthContext (auth state)
├── hooks/           # useAutoSave, useUnsavedChanges, useToast, use-mobile
├── design-system/   # Figma tokens (colors, typography, buttons)
├── config/          # env (VITE_API_URL)
├── lib/             # utils
└── utils/           # videoUtils, etc.
```

## License

Copyright © 2026 Codeit
