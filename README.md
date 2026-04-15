# Yorindo EMS Frontend

The frontend for Yorindo's internal Event Management System. A single-page application for managing events, participant registrations, check-ins, email communications, and user accounts.

## Tech Stack

- **React 19** with TypeScript
- **Vite 7** - Build tool and dev server
- **React Router DOM** - Client-side routing with permission-based route guards
- **React Hook Form** with Zod validation
- **Tailwind CSS 4** with shadcn/ui (Radix UI)
- **Tiptap** - Rich text editor for email campaigns
- **html5-qrcode** - QR code scanning for event check-in
- **Lucide React** - Icons

## Getting Started

### Prerequisites

- Node.js
- A running instance of the backend API

### Setup

```bash
npm install
cp .env.example .env
```

Configure the API URL in `.env`:

```env
VITE_API_BASE_URL=http://localhost:5000
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

## Project Structure

```
src/
├── components/
│   ├── auth/
│   │   └── OtpInput.tsx              # 6-digit OTP input with auto-focus
│   ├── communication/
│   │   ├── TiptapEmailEditor.tsx     # Rich text editor for email campaigns
│   │   └── SearchableFilterSelect.tsx
│   ├── ui/                           # shadcn/ui components
│   ├── Event-dialog.tsx
│   ├── Sidebar.tsx
│   └── Topbar.tsx
├── context/
│   ├── AuthContext.tsx               # Auth state, OTP login, token management
│   └── AppContext.tsx
├── hooks/
│   ├── useAuth.ts                    # Auth context consumer
│   ├── usePermission.ts             # Permission check for UI gating
│   └── useFetch.ts                   # Generic data fetching
├── layouts/
│   ├── AuthLayout.tsx                # Layout for login page
│   └── DashboardLayout.tsx           # Layout with sidebar and topbar
├── lib/
│   └── auth.ts                       # Post-login redirect logic
├── pages/
│   ├── auth/Login.tsx                # OTP login (email + 6-digit code)
│   ├── events/Events.tsx             # Event list and management
│   ├── users/
│   │   ├── Users.tsx                 # User management (super_admin only)
│   │   └── UserFormModal.tsx         # Create/edit user form
│   ├── participant/Participants.tsx   # Registration list with status management
│   ├── communication/
│   │   ├── Communication.tsx         # Email campaign creation
│   │   └── CampaignHistory.tsx       # Sent campaign status and stats
│   ├── checkin/EventCheckInDesk.tsx   # QR scanner and manual check-in
│   ├── surveys/Surveys.tsx           # Surveys page (not yet implemented)
│   ├── settings/Settings.tsx         # Settings page (not yet routed)
│   ├── Forbidden.tsx                 # 403 page
│   └── NotFound.tsx                  # 404 page
├── services/
│   ├── api.ts                        # Fetch wrapper with auth token attachment
│   ├── eventService.ts
│   ├── userService.ts
│   ├── registrationService.ts
│   └── checkInService.ts
└── App.tsx                           # Route definitions with guards
```

## Pages and Routes

| Path | Page | Access |
|------|------|--------|
| `/` | Login | Guests only (redirects if authenticated) |
| `/events` | Events | `events:view` permission |
| `/users` | User Management | `super_admin` role only |
| `/participants` | Participants | `registrations:view` permission |
| `/communication` | Email Campaigns | `communication:view` permission |
| `/communication/history` | Campaign History | `communication:view` permission |
| `/events/:eventId/check-in` | Check-in Desk | `registrations:checkin` permission |

## Authentication

The app uses passwordless OTP-based authentication:

1. User enters their email
2. Backend sends a 6-digit OTP to the email
3. User enters the OTP code
4. Backend returns a JWT token
5. Token is stored in `localStorage` and attached to all API requests via the `Authorization: Bearer` header

Auth state is managed through `AuthContext`, which validates the stored token against `GET /api/v1/auth/me` on every page load.

## Route Guards

Four route guard components in `App.tsx` control access:

- **GuestRoute** - Redirects authenticated users to their home page
- **ProtectedRoute** - Redirects unauthenticated users to login
- **PermissionRoute** - Checks a specific permission via `usePermission`, renders 403 if denied
- **SuperAdminRoute** - Requires `super_admin` role, renders 403 if denied

## API Integration

All API calls go through the `api` service (`src/services/api.ts`), which wraps `fetch` with:

- Automatic `Authorization: Bearer <token>` header when authenticated
- JSON content type headers
- Consistent response envelope (`{ data, error, message, status }`)

API paths are centralized in `apiPaths`:

```typescript
const apiPaths = {
  auth: "/api/v1/auth",
  events: "/api/v1/events",
  users: "/api/v1/users",
  communications: "/api/v1/communications",
  surveys: "/api/v1/surveys",
  analytics: "/api/v1/analytics",
};
```

## Roles and Permissions

The frontend uses `usePermission` to show or hide UI elements based on the user's permissions. This is for UX only; the backend enforces permissions independently.

| Role | Dashboard Access |
|------|-----------------|
| `super_admin` | Full access including user management |
| `admin` | Full feature access, no user management |
| `event_operator` | Events and registrations |
| `communication_operator` | Email campaigns |
| `survey_analyst` | Surveys and analytics |
