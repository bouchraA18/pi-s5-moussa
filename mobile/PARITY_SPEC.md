# Mobile Parity Spec (Web `/frontend` -> RN/Expo `/mobile`)

Goal: build a React Native (Expo) app with **UI/UX/features/behavior parity** with the web frontend in `/frontend` (based on code audit, not guesses).

## A) Audit scope (read from `/frontend`)

- Routing: `/frontend/src/main.jsx`, `/frontend/src/App.jsx`
- Styling/tokens: `/frontend/src/index.css`, `/frontend/tailwind.config.js`
- API/auth: `/frontend/src/services/api.js`
- Layout: `/frontend/src/layouts/AppLayout.jsx`
- Screens: `/frontend/src/views/*.jsx`
  - `LoginPage`, `RegisterPage`, `TeacherDashboard`, `AgentDashboard`, `ProfilePage`, `AdminUsers`, `AdminMatieres`

Web stack (as used):
- `react-router-dom` routing
- TailwindCSS styling
- `axios` API client (single instance)
- `lucide-react` icons
- `framer-motion` animations

## B) Screen / route map (web)

Defined in `/frontend/src/App.jsx`.

| Route | Screen | Uses `AppLayout` |
|---|---|---|
| `/` | redirect to `/login` | No |
| `/login` | `LoginPage` | No |
| `/register` | `RegisterPage` | No |
| `/teacher-dashboard` | `TeacherDashboard` | Yes |
| `/agent-dashboard` | `AgentDashboard` | Yes |
| `/profile` | `ProfilePage` | Yes |
| `/admin/users` | `AdminUsers` | Yes |
| `/admin/matieres` | `AdminMatieres` | Yes |

Login redirect logic (`/frontend/src/views/LoginPage.jsx`):
- If `user.role` is `ADMINISTRATEUR` OR `AGENT` OR `AGENT_SCOLARITE` -> `/agent-dashboard`
- Else -> `/teacher-dashboard`

Admin nav links visibility (`/frontend/src/layouts/AppLayout.jsx`):
- The top-nav links (Tableau de Bord / Utilisateurs / Matieres & Modules) render **only** when
  `user?.role === 'ADMINISTRATEUR'`.
- Router has **no** protected-route guard.

## C) App shell parity (`AppLayout`)

From `/frontend/src/layouts/AppLayout.jsx`:

- Navbar (sticky) with:
  - Left brand: SupNum logo image + "ClassTrack" gradient text
  - Center admin links: `hidden md:flex` and only for ADMINISTRATEUR
  - Right cluster: notification bell, divider, (optional) user name/role, profile icon, logout icon
    - user name/role is `hidden sm:block`
    - profile navigates to `/profile`
    - logout: `authService.logout()` then navigate `/login`
- Main: centered `max-w-7xl` container, renders `title` + `children`
- Footer: year + "ClassTrack - Systeme de Suivi d'Enseignements"

Notifications:
- Poll `GET /notifications` on mount and every 15s.
- Expects `{ notifications, unread_count }`.
- Dropdown:
  - Toggle by bell
  - Close on outside click (overlay)
  - Mark read: `POST /notifications/:id/read` (only if unread)
  - Mark all read: `POST /notifications/read-all` (only if unread_count > 0)
  - Delete: `DELETE /notifications/:id` (stops propagation)

Mobile (OS notifications):
- When new notifications arrive via polling, the app triggers a **local notification** (banner + sound).
- When the backend sends an Expo push, the app shows an OS notification and tapping it routes to the relevant dashboard.

## D) Component inventory (web patterns to replicate)

Web has no `/components` directory; patterns are embedded inside screens.

Shared UI patterns (mobile should implement as shared RN components):
- Stat cards (icon badge + microlabel + value; hover motion on web)
- Toolbars (search input; segmented filters/tabs)
- Tables (header row, empty states, hover-revealed actions)
- Modals (backdrop + centered card + animated enter/exit)
- Icon-text inputs (left icon; focus ring color changes)
- Primary buttons with loading spinner (`Loader2`)
- Inline banners (Profile) + timed auto-clear (3s)

Icons required (lucide imports in `/frontend`):
- Layout: `Clock`, `Bell`, `User`, `LogOut`, `Check`, `Trash2`
- Auth: `Mail`, `Lock`, `ArrowRight`, `Loader2`, `CheckCircle2`, `Phone`
- Teacher: `BarChart3`, `History`, `PlusCircle`, `FileText`, `Calendar`, `ChevronDown`, `Search`, `X`, `AlertCircle`
- Agent: `Users`, `FileSearch`, `MoreHorizontal`, `ArrowUpRight` (plus overlaps)
- Admin Users: `Plus`, `Edit2`, `Shield`, `BookOpen`, `ChevronDown` (plus overlaps)
- Admin Matieres: `Layers` (plus overlaps)

## E) Features & flows (web)

### E1) Auth

Login (`/login`):
- POST `/login` with `{ email, password }` via `authService.login`.
- On success: stores `token` + `user` in `localStorage`, then redirects by role (see section B).
- On error: inline banner text "Identifiants incorrects. Veuillez reessayer."
- "Oublie ?" link is `href="#"` (no functionality).

Register (`/register`):
- POST `/register` with:
  - `{ name, nom, prenom, email, telephone, password, password_confirmation }`
- On success: stores `token` + `user` in `localStorage`, navigates to `/teacher-dashboard`.

### E2) Teacher dashboard (`/teacher-dashboard`)

Load:
- On mount: `GET /pointages` + `GET /matieres` in parallel.
- Defaults:
  - `date = new Date().toISOString().split('T')[0]` (YYYY-MM-DD)
  - `type_seance = 'CM'`
  - selects the first matiere if present

Create:
- POST `/pointages` with `{ ...formData, annee_scolaire_id: 1 }` (hardcoded `annee_scolaire_id`).
- Success uses blocking `alert("Pointage reussi !")`.
- Horaires:
  - `heure_debut` / `heure_fin` are chosen from a fixed list of slots (no manual entry):
    - `08:00 - 09:30`
    - `09:45 - 11:15`
    - `11:30 - 13:00`
    - `15:00 - 16:30`
    - `17:00 - 18:30`
- Type:
  - Selection uses shortcut buttons `CM` / `TD` / `TP` (no dropdown).

Edit:
- Only when `session.statut === 'EN_ATTENTE'`.
- PUT `/pointages/:id` with `formData`.
- On edit start: `window.scrollTo({ top: 0, behavior: 'smooth' })`.

Delete:
- Only when `session.statut === 'EN_ATTENTE'`.
- Confirm via `window.confirm(...)`.
- DELETE `/pointages/:id`.

History filters:
- Search: only on `s.matiere?.nom` (case-insensitive).
- Filter date: exact match (`s.date === filterDate`).
- Filter matiere: `s.matiere_id.toString() === filterMatiere`.

Statuses:
- `APPROUVE` -> green pill
- `EN_ATTENTE` -> amber pill
- `REJETE` -> red pill; click shows motif modal using
  `session.motif_rejet || "Aucun motif specifie"`.

Note: `loading` state exists but the UI does not render a spinner; empty-state can show briefly while loading.

### E3) Agent/Admin dashboard (`/agent-dashboard`)

Tabs:
- `pending` -> `GET /admin/pending`
- `validated` -> `GET /pointages`

Stats:
- `GET /admin/stats` (on tab change) expecting:
  - `pending_count`, `validated_count`, `validated_this_month`, `total_hours`, `distribution`
  - `distribution` is not rendered in this view.

Approve (optimistic):
- Removes row immediately, POST `/admin/approve/:id`, restores list on error.

Reject (optimistic + required reason):
- Reason must be non-empty after `.trim()`.
- Removes row + closes modal, POST `/admin/reject/:id` with `{ motif_rejet }`.
- Restores list on error (modal stays closed).

### E4) Profile (`/profile`)

Load:
- `GET /user` populates `user` + `profileData`.

Update profile:
- PUT `/profile` with `{ name, nom, prenom, telephone }`.
- Success:
  - shows success banner and clears it after 3000ms
  - merges returned user into `localStorage.user`

Change password:
- PUT `/profile/password` with
  `{ current_password, new_password, new_password_confirmation }`.
- Success: clears password fields + success banner (3000ms).

### E5) Admin Users (`/admin/users`)

List:
- GET `/users` supports either `res.data` array or `res.data.data` array.
- Search on `name` and `email`.
- Role filter: `ALL` / `ENSEIGNANT` / `AGENT_SCOLARITE` / `ADMINISTRATEUR`.

Create/edit:
- Modal form.
- POST `/users` or PUT `/users/:id` with `{ name, nom, prenom, email, telephone, role, password }`.
- Password required only for create; edit sends `password` possibly empty (web label says leave empty to not change).

Delete:
- Confirm prompt then DELETE `/users/:id`.

### E6) Admin Matieres (`/admin/matieres`)

List:
- GET `/matieres` supports either `res.data` array or `res.data.data` array.
- Search on `nom` and `code`.
- Level filter: `ALL`, `L1`, `L2`, `L3`, `M1`, `M2`.

Create/edit:
- Modal form.
- POST `/matieres` or PUT `/matieres/:id` with:
  - `code`, `nom`, `description`, `niveau`, `semestre` (1/2), `credit`, `nombre_heures_prevu`, `filiale`
- `filiale` exists in formData but has no UI field in the modal.
- On success, the web code calls `fetchMatieres()` + `closeModal()` twice.

Errors:
- If response contains `{ message, errors }`, AdminMatieres flattens `errors` and shows a multi-line `alert(...)`.

## F) API/auth behavior (as used by `/frontend`)

From `/frontend/src/services/api.js`:
- Base URL: `VITE_API_URL` or default `http://localhost:8000/api`
- Default headers: JSON + Accept JSON
- Request interceptor: `Authorization: Bearer <token>` from `localStorage.token`
- No response interceptors (no refresh flow; no auto-logout on 401)

Endpoints used:
- Auth: POST `/login`, POST `/register`, POST `/logout`
- User: GET `/user`, PUT `/profile`, PUT `/profile/password`
- Pointages: GET/POST `/pointages`, PUT/DELETE `/pointages/:id`
- Matieres: GET/POST `/matieres`, PUT/DELETE `/matieres/:id`
- Users: GET/POST `/users`, PUT/DELETE `/users/:id`
- Notifications: GET `/notifications`, POST `/notifications/:id/read`, POST `/notifications/read-all`, DELETE `/notifications/:id`
- Agent/admin: GET `/admin/stats`, GET `/admin/pending`, POST `/admin/approve/:id`, POST `/admin/reject/:id`

## G) Global UX rules (web)

- Alerts/confirms:
  - Teacher/Agent/Admin screens use blocking `alert()` and `window.confirm()`.
  - Profile uses inline banners (success/error) and auto-clears after 3000ms.
- Loading:
  - Agent dashboard: centered spinner + text.
  - Admin lists: spinner inside table area.
  - Teacher: no explicit spinner UI.
- Empty states:
  - Teacher: "Aucune session enregistree"
  - Agent: "Aucune demande trouvee" (message changes when searchTerm is set)
  - Admin Users: "Aucun utilisateur trouve"
  - Admin Matieres: "Aucun module trouve"
  - Notifications: "Aucune notification"
- Locale formatting uses `fr-FR` via `toLocaleDateString`/`toLocaleTimeString`.

## H) Design tokens (Tailwind + inline)

From `/frontend/tailwind.config.js`:
- `primary.600 = #004e7c` (brand)
- `accent.500 = #f97316`, `accent.600 = #ea580c`
- Full `primary` palette is defined in the Tailwind config (reuse as-is for NativeWind tokens).

Inline/arbitrary colors used:
- Teacher panel: `#0c4a6e`
- Teacher inputs: `#336b8a` with border `#4a8fb3`
- Teacher table header bg: `#fcfdfe`

Common radii/shadows used:
- Radii: `rounded-xl`, `rounded-2xl`, `rounded-3xl`, plus `rounded-[24px]`, `rounded-[32px]`, `rounded-[2rem]`, `rounded-[2.5rem]`
- Shadows: `shadow-sm`, `shadow-lg`, `shadow-xl`, `shadow-2xl` + colored shadow utilities

Non-standard Tailwind classes referenced in JSX that may be no-ops (not in config/defaults):
- `animate-blob`, `animation-delay-2000`, `animate-in`, `fade-in`, `pl-5.5`

## I) Phase C checklist (to be updated during implementation)

| Item | Route | Status | Verification notes |
|---|---|---|---|
| AppLayout + Notifications | (global) | Done | Implemented navbar + footer + notifications polling/actions; blur backdrop implemented via `expo-blur`; brand text gradient implemented via masked + linear gradient. |
| Login | `/login` | Done | Verified role redirect + API/storage parity against `/frontend/src/views/LoginPage.jsx`. |
| Register | `/register` | Done | Verified API/storage/redirect parity against `/frontend/src/views/RegisterPage.jsx`. |
| Teacher Dashboard | `/teacher-dashboard` | Done | API parity for GET/POST/PUT/DELETE `/pointages` + GET `/matieres`; horaires forced to fixed slots; type uses CM/TD/TP shortcuts; history uses vertical cards on mobile; hover-only actions mapped to touch (tap card toggles actions). |
| Agent Dashboard | `/agent-dashboard` | Done | API parity for GET `/admin/stats`, GET `/admin/pending`/`/pointages`, POST approve/reject; hover-only row actions mapped to touch (tap row toggles actions). |
| Profile | `/profile` | Done | Implemented GET `/user`, PUT `/profile`, PUT `/profile/password`; success banner auto-clears after 3000ms (matches web), error banner persists until next submit (matches web); AsyncStorage `user` is merged like web localStorage merge. |
| Admin Users | `/admin/users` | Done | Implemented GET/POST/PUT/DELETE `/users` with web response-shape handling; search + role filter; create/edit modal; delete confirm; hover-revealed row actions mapped to tap-row-to-toggle actions (documented constraint). |
| Admin Matieres | `/admin/matieres` | Done | Implemented GET/POST/PUT/DELETE `/matieres` with web response-shape handling; search + level filter; create/edit modal incl. hidden `filiale` field in payload; error `{message, errors}` flatten+alert; hover-revealed row actions mapped to tap-row-to-toggle actions (documented constraint). |

## J) Parity constraints to document during mobile build

1. Hover-revealed affordances must map to touch (press/long-press/swipe) without changing intent.
2. Web uses `localStorage`; mobile must persist token/user similarly (storage choice must keep behavior parity).
3. Web uses `framer-motion`; mobile needs an equivalent animation system.
4. Web hides admin nav links under `md` but still has URL navigation; mobile must preserve access to the same screens and document unavoidable differences.

## K) Run & verify (Expo)

From repo root:

- Install deps: `cd mobile` then `npm install`
  - If `npm` resolves incorrectly on Windows, use: `& "C:\Program Files\nodejs\npm.cmd" install`
- Start dev server: `npm run start`
- Start backend API (for phone/LAN testing): from repo root run `php artisan serve --host 0.0.0.0 --port 8000`
  - Ensure Windows firewall allows inbound `8000` and that your phone is on the same Wi‑Fi/LAN.
- Run Android emulator: `npm run android`
- Run iOS simulator (macOS only): `npm run ios`
- Run on physical device:
  - Install **Expo Go**
  - `npm run start` then scan the QR code

Environment variables (`mobile/.env`):
- `EXPO_PUBLIC_API_URL`
  - iOS simulator: `http://localhost:8000/api` (matches web default)
  - Android emulator: `http://10.0.2.2:8000/api` (Android maps host `localhost` differently)
  - Physical device: `http://<your-lan-ip>:8000/api`
- `EXPO_PUBLIC_SCHOOL_EMAIL_DOMAIN` (default: `supnum.mr`)
  - UI accepts either full `user@domain` or just `user` (domain auto-appended)
  - API enforces the domain only for `ENSEIGNANT` + `AGENT_SCOLARITE` via `SCHOOL_EMAIL_DOMAIN` (backend `.env`)
- `EXPO_PUBLIC_EXPO_PROJECT_ID` (optional)
  - Used to register an Expo push token for remote push notifications.
  - If unset, the app still shows **in-app notifications** and can show **local notifications** while the app is running, but remote push (app closed) may not work.

## L) Parity verification (current)

Implemented screens / flows:
- Auth: Login + Register (API + storage + role redirect)
- App shell: header + notifications polling/actions + logout + profile nav
- Enseignant: pointage create/edit/delete + filters + motif modal
- Agent/Administrateur: stats + pending/validated lists + approve/reject + motif modal
- Profil: profile update + password change + inline success/error banners
- Admin: users CRUD + matieres CRUD + filters + modals + alerts/confirm parity

Documented/known platform differences (must remain minimal):
- Hover-only UI (web): mapped to touch by “tap row toggles actions” in tables (Teacher/Agent/Admin Users/Admin Matières).
- Native date input: web uses HTML date input; mobile uses `@react-native-community/datetimepicker` (closest equivalent).
- Backdrop blur + gradient styles: web uses CSS `backdrop-blur-*` + Tailwind gradients; mobile uses `expo-blur` + `expo-linear-gradient` (closest equivalent; platform rendering may differ slightly).

## Remaining work

- None. (Known platform constraints are documented in section L.)
