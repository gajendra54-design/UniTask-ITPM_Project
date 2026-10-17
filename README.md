# UniTask

UniTask is a university group project built with MongoDB, Express, React, and Node.js. It brings assignment planning, study schedules, group collaboration, and AI-assisted study tools into one application.

## Features

- Register, sign in, manage a profile, and reset passwords by email.
- Manage assignments and subtasks, with AI-assisted task breakdowns.
- Plan study sessions in a calendar with recurring tasks, a three-task daily limit, and an eight-hour daily workload limit.
- Track progress, task priorities, analytics, and skills development.
- Collaborate in groups using invitations, task boards, comments, resources, and notifications.
- Generate study flashcards from uploaded materials and share flashcard sets.
- Get assignment guidance, group health reports, and task distribution suggestions using Groq.

## Technology

The frontend uses React 19, Vite 7, Tailwind CSS, React Router, Axios, and charting libraries. The backend uses Express 5, Mongoose, JWT authentication, Supabase Storage, Groq, and scheduled jobs. Tests use Vitest, React Testing Library, Jest, Supertest, and Playwright.

## Requirements

- Node.js 22.13 or newer in the Node 22 series, with npm.
- A running MongoDB instance, either local or hosted.
- A Supabase project with a Storage bucket named `resources`. The current resource implementation uses public URLs, so configure the bucket accordingly.
- A Groq API key for AI features.
- SendGrid or SMTP credentials for password resets and email reports.

The optional scanned-PDF OCR path uses `pdf2pic`, which requires GraphicsMagick and Ghostscript on the backend host. OCR may also download Tesseract language data on first use.

## Local setup

Run commands from the project folder. The frontend and backend have separate package manifests and lockfiles.

### 1. Install dependencies

```powershell
npm --prefix backend ci
npm --prefix frontend ci
```

### 2. Configure the backend

```powershell
Copy-Item backend/.env.example backend/.env
```

Edit `backend/.env`:

- `MONGO_URI`: MongoDB connection string.
- `JWT_SECRET`: a long, randomly generated secret.
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`: your project's server-side storage credentials. The storage client is initialized at startup.
- `GROQ_API_KEY`: enables AI calls; AI chat returns a configuration error if this is absent.
- `SENDGRID_API_KEY` and `EMAIL_FROM`, or the `SMTP_*` settings: email delivery configuration.
- `PORT`: defaults to `5000`.

Use real credentials in `.env`, not in source code. Never put the Supabase service-role key in frontend files. `.env.example` contains placeholders only.

### 3. Start the backend

In the first terminal:

```powershell
cd backend
npm run dev
```

For a normal Node process, use `npm start`. Start the backend from its directory so environment loading and relative upload paths resolve correctly. The server waits for MongoDB before listening.

### 4. Start the frontend

In a second terminal:

```powershell
cd frontend
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`. During development, Vite proxies `/api` to `http://127.0.0.1:5000`. If the backend port changes, update the proxy target in `frontend/vite.config.js`.

Check the backend at `http://localhost:5000/api/health`, then register an account through the UI.

## Development commands

```powershell
# Production frontend build
npm --prefix frontend run build

# Frontend static checks and unit tests
npm --prefix frontend run lint
npm --prefix frontend test

# Backend tests
npm --prefix backend test -- --runInBand
```

Browser tests are separate from unit tests. With the application running and suitable test data available:

```powershell
cd frontend
npx playwright install chromium
npx playwright test
```

Review `frontend/tests/` before running browser tests: they may depend on seeded accounts or application data. The backend analytics and flashcard suites currently exercise mock routes; they do not verify the corresponding live features.

## Project layout

```text
backend/
  config/             MongoDB and Supabase setup
  controllers/        API request handlers
  middleware/         Authentication middleware
  models/             Mongoose schemas
  routes/             Express routes
  services/           AI and application services
  cron/ and jobs/     Scheduled notifications and reports
  priority-tracking/  Priority module
  skills-analysis/    Skills analysis module
  tests/              Backend tests
frontend/
  src/api/            Calendar and assignment API helpers
  src/components/     Shared and feature-specific UI
  src/context/        Authentication state
  src/modules/        Priority, skills, and analytics features
  src/pages/          Application pages
  src/tests/          Component tests
  tests/              Playwright browser tests
 docs/                Feature designs and business rules
```

Use this README for current setup and the feature documentation in `docs/` for design context. Historical planning notes and presentation drafts are available in Git history.

## API overview

Routes are mounted below `/api`: `auth`, `assignments`, `subtasks`, `calendar`, `priority`, `chatbot`, `skills-analysis`, `study`, `groups`, `resources`, and `notifications`. Most feature routes require a JWT in the `Authorization: Bearer <token>` header.

## Deployment and troubleshooting

- Deploy `frontend/dist` after building. Configure SPA fallback routing and forward `/api` requests to the backend; the Vite development proxy is not included in the build.
- MongoDB connection failures: check `MONGO_URI`, database availability, credentials, and hosted database network access.
- Storage startup/upload errors: check Supabase credentials and the `resources` bucket.
- AI errors: check the Groq key, provider quota, and network access.
- Password reset failures: configure email delivery. The reset link currently defaults to the local frontend address; review it before deployment.
- Scanned PDF failures: verify the OCR system dependencies above.
- Task attachments currently use local upload paths; serving and authorizing those downloads needs deployment-specific configuration.
- The production build currently emits a large-chunk warning. This does not prevent building, but route-level code splitting would improve initial load size.

## Further documentation

- [Study calendar business rules](docs/study-calendar-business-rules.md)
- [Resource hub design](docs/RESOURCE_HUB_DESIGN.md)
- [AI chatbot guide](docs/AI_CHATBOT_GUIDE.md)
- [Skills analysis module](backend/skills-analysis/README.md)

---

## 📧 Contact

contributors - Lochana Chandira , Nipuna Lakmal , Nirwan , D.M.G. Dissanayake

For questions or feedback about this academic project, please open an issue in the repository.

---
