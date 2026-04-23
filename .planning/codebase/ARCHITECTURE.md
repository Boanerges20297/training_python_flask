# ARCHITECTURE

## Architectural Pattern
The frontend follows a **Module-based Architecture (Feature Slices)** mixed with standard layered structures. The application is divided by domains/roles (`admin`, `client`, `barber`, `auth`).

## Core Layers
1. **Routing (`src/routes/`):** Centralized routing logic using React Router DOM. Roles-based routing is handled here (`AppRoutes.tsx`).
2. **Authentication (`src/auth/`):** Manages user session, protected routes, and role-based access control.
3. **API / Services (`src/api/`):** Contains Axios configurations and likely service functions to communicate with the backend.
4. **Modules (`src/modules/`):** Features are grouped by domain. Each module typically has its own views and components.
   - `admin`: Dashboard, Clients, Services, Appointments, Barbers.
   - `client`: Client Dashboard.
   - `barber`: Barber Dashboard.
   - `auth`: Login, Registration.
5. **Shared UI (`src/components/`):** Contains reusable components and layouts (e.g., `AppLayout.tsx`) that are used across different modules.

## Data Flow
- User interacts with a View inside a module.
- The View calls a service/API function (using Axios).
- Axios requests are intercepted by MSW (in development) or sent to the backend.
- State is updated based on the response, and UI re-renders.

## Entry Points
- `index.html`: Main HTML template.
- `src/main.tsx`: React DOM rendering, MSW initialization, and App component mounting.
- `src/App.tsx`: Root component, wrapping the application with necessary providers.
