# STRUCTURE

## Directory Layout
```text
frontend/
├── public/                 # Static assets and MSW worker
├── src/
│   ├── api/                # Axios configuration and API services
│   ├── assets/             # Images, fonts, etc.
│   ├── auth/               # Authentication context and protected routes
│   ├── components/         # Shared UI components and layouts
│   │   ├── layouts/        # Application layouts (e.g., AppLayout)
│   │   └── ui/             # Reusable UI elements (buttons, inputs)
│   ├── mocks/              # MSW mock handlers and db setup
│   ├── modules/            # Domain-specific feature modules
│   │   ├── admin/          # Admin views and components
│   │   ├── auth/           # Login/Register views
│   │   ├── barber/         # Barber specific views
│   │   └── client/         # Client specific views
│   ├── routes/             # Application routing (AppRoutes.tsx)
│   ├── types/              # Global TypeScript interfaces and types
│   └── utils/              # Helper functions and utilities
├── .planning/              # Agent planning and codebase maps
├── index.html              # Main HTML entry
├── package.json            # Dependencies and scripts
├── vite.config.ts          # Vite bundler configuration
└── index.css               # Global CSS styling
```

## Key Locations
- **Routing:** `src/routes/AppRoutes.tsx`
- **Global Styles:** `src/index.css`
- **Mock Database:** `src/mocks/db.ts`
- **Mock Handlers:** `src/mocks/handlers.ts`
- **Main Entry:** `src/main.tsx`

## Naming Conventions
- **Components/Views:** PascalCase (e.g., `DashboardView.tsx`, `AppLayout.tsx`).
- **Hooks:** camelCase with `use` prefix (e.g., `useAuth.ts`).
- **Utils/Helpers:** camelCase (e.g., `formatDate.ts`).
- **Interfaces/Types:** Often PascalCase, sometimes prefixed with `I` (e.g., `User.ts`, `IAppointment`).
