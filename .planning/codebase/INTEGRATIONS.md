# INTEGRATIONS

## API / Backend
The frontend is designed to integrate with a backend API (likely Flask, given the repository name `training_python_flask`).
Currently, the API layer is heavily reliant on **MSW (Mock Service Worker)** to mock responses.

### Mock Service Worker (MSW)
- **Location:** `src/mocks/`
- **Purpose:** Intercepts Axios requests and provides simulated backend responses for development and testing.
- **Workers:** Service worker setup in `public/mockServiceWorker.js`.

## Data Fetching
- **Axios:** Used as the primary HTTP client to communicate with backend REST endpoints (`src/api/`).
- **Interceptors:** Axios interceptors are typically used for injecting auth tokens or handling CSRF tokens.

## Authentication
- Custom authentication flow managed in `src/auth/` (e.g., `useAuth.ts`, `ProtectedRoute.tsx`).
- Roles: `admin`, `cliente`, `barbeiro`.

## Third-Party Libraries
- **Recharts:** Used for data visualization in dashboards.
- **Lucide React:** Used for SVG icons throughout the UI.
