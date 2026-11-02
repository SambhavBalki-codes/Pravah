<div align="center">
  <img src="./client/src/assets/Logo.avif" alt="Pravah logo" width="130" />
  <h1>Pravah</h1>
  <p><strong>Academic project management, supervision, and discovery.</strong></p>
  <p>
    A MERN-based platform connecting students, teachers, administrators, and visitors
    throughout the academic project lifecycle.
  </p>
</div>

<p align="center">
  <a href="https://pravah-bay-tau.vercel.app">Live application</a> ·
  <a href="https://pravah-backend-pe55.onrender.com/health">Backend health check</a>
</p>

<!-- Add product screenshots here when approved for publication.
Recommended images:
- docs/screenshots/student-dashboard.png
- docs/screenshots/teacher-dashboard.png
- docs/screenshots/admin-dashboard.png
- docs/screenshots/visitor-project-chat.png
-->

## 1. Project Introduction

Pravah is a full-stack academic project management platform built to organize
project proposals, supervision, file reviews, feedback, deadlines, publication,
and public project discovery in one system.

The application provides separate workspaces and permissions for each user role.
It also includes a project-specific retrieval-augmented generation (RAG) chatbot
that allows authenticated visitors to ask questions about approved public projects.

## 2. Project Overview

Pravah supports the following lifecycle:

```text
Proposal
   |
   v
Supervisor assignment
   |
   v
File submission and review
   |
   v
Feedback, revisions, and deadline tracking
   |
   v
Project completion
   |
   v
Publication approval
   |
   v
Visitor discovery and project chatbot
```

Project status transitions are validated by the backend:

```text
pending -> under_review -> approved -> in_progress
in_progress -> revision_required -> in_progress
in_progress -> completed
pending/under_review -> rejected
```

## 3. Key Features

### Authentication and account management

- Student registration and login.
- Teacher and administrator login.
- Visitor registration and login.
- JWT authentication using an HTTP-only `token` cookie.
- Optional `Authorization: Bearer <token>` authentication support.
- Current-user lookup through `/api/v1/auth/me`.
- Password reset through an emailed, time-limited reset token.
- Role validation and rate limiting on authentication-sensitive routes.

### Student workspace

- View project status and dashboard information.
- Submit a project proposal.
- Browse available supervisors.
- Send and cancel supervisor requests.
- Upload project files and manage personal files.
- View and download project files.
- Receive supervisor feedback and reply to feedback.
- Mark feedback as read.
- View notifications and deadlines.
- Submit a completed project for publication, optionally with a GitHub URL.

### Teacher workspace

- View dashboard information and assigned students.
- Review, accept, or reject supervisor requests.
- View assigned student and project details.
- Access project files.
- Mark files as reviewed or request revisions.
- Add general, positive, or negative feedback.
- Reply to student feedback.
- Update project status within teacher-approved transitions.
- View deadlines and teacher notifications.

### Administrator workspace

- View dashboard statistics.
- Create, update, and delete student accounts.
- Create, update, and delete teacher accounts.
- Configure teacher capacity and expertise.
- Browse users and projects.
- Approve or reject project proposals.
- Assign project supervisors.
- Update project status.
- Create, update, activate/deactivate, and delete deadlines.
- Review and decide publication requests.
- Inspect, retry, or remove project RAG indexing data.

### Visitor workspace

- Register and log in as a visitor.
- Browse completed and approved public projects.
- Search projects by title and filter by department.
- View public project details and available files.
- View per-project chat history.
- Ask questions through normal or server-sent events (SSE) streaming chat.

### Notifications

The notification system supports:

- Per-user notifications.
- Read/unread state.
- Unread count.
- Mark one or all notifications as read.
- Notification deletion.
- Types including requests, approvals, rejections, feedback, deadlines,
  meetings, system messages, and project events.
- Low, medium, and high priorities.

Notifications are generated for events such as proposals, supervisor requests,
file uploads, feedback, deadlines, publication decisions, and project activity.

### File handling

- Uploads use Multer memory storage.
- Files are uploaded to Cloudinary under `pravah/projects/<projectId>`.
- Maximum file size: 10 MB.
- Maximum files per request: 10.
- Supported extensions include PDF, DOC/DOCX, PPT/PPTX, ZIP/RAR, common image
  formats, TXT, JavaScript, CSS, HTML, and JSON.
- Re-uploading a file with the same original name creates a higher version.
- Students cannot upload to rejected or completed projects.
- Teacher review states are `pending`, `reviewed`, and `revision_requested`.

## 4. User Roles and Permissions

| Role | Main permissions |
| --- | --- |
| Student | Own proposal, supervisor requests, own project files, feedback, deadlines, notifications, and publication request |
| Teacher | Assigned students and projects, supervisor requests, file reviews, feedback, project status, deadlines, and notifications |
| Admin | User management, all projects, supervisor assignment, status decisions, deadlines, publication approvals, and RAG administration |
| Visitor | Visitor account, approved public project discovery, project details, chat history, and project chatbot |

Authorization is enforced twice:

1. The React client protects dashboard routes and redirects users to the
   dashboard for their own role.
2. The Express backend applies `isAuthenticated` and `isAuthorized(...)` to
   protected API routes. The backend remains the source of truth.

## 5. Detailed Application Workflow

### Proposal and supervision

1. A student registers or signs in.
2. The student submits a title and description.
3. The backend creates a project in `pending` state and notifies administrators.
4. An administrator reviews the proposal and can approve, reject, or move it
   through the configured project workflow.
5. The student selects an available teacher and sends a supervisor request.
6. The teacher accepts or rejects the request. Capacity limits are enforced.
7. The accepted supervisor becomes associated with the student/project.

### Project work and review

1. The student uploads project documents.
2. Files are stored in Cloudinary and recorded in the project document.
3. The teacher reviews files and may request revisions.
4. The teacher can add feedback and change the project status.
5. Students can read feedback, reply, and upload revised files.
6. Deadlines produce reminder and overdue notifications.

### Publication and discovery

1. A student submits a publication request after project completion.
2. An administrator reviews the request.
3. An approved project becomes public and is eligible for visitor discovery.
4. The backend queues RAG indexing for the project.
5. Visitors can browse the project and use its chatbot after indexing succeeds.

## 6. RAG-Based Project Chatbot

The chatbot is project-scoped: each project is indexed in its own Pinecone
namespace, so retrieval is limited to the selected project.

### Indexing pipeline

1. **Queueing:** When publication is approved, a `RagJob` is queued for the
   project. Administrators can also retry indexing.
2. **Project metadata:** The index includes title, description, department,
   GitHub URL, status, completion date, student, and supervisor metadata.
3. **PDF selection:** The worker processes project files identified as PDFs.
4. **Download:** Each file is downloaded from its stored HTTP(S) URL to a
   temporary server file. Downloads are limited to 25 MB and 30 seconds.
5. **Text extraction:** LangChain's `PDFLoader` extracts readable PDF content.
6. **Chunking:** `RecursiveCharacterTextSplitter` creates chunks of 1,000
   characters with 200 characters of overlap.
7. **Metadata:** Chunks retain project, file, page, title, source URL, and chunk
   metadata.
8. **Upsert:** Existing project vectors are cleared, then records are uploaded
   to the project's Pinecone namespace in batches of 90.
9. **State tracking:** Project and job records store queued, processing, indexed,
   or failed states, including error messages and timestamps.

### Question-answering pipeline

1. A visitor sends a question for an approved public project.
2. The API retrieves the five most relevant records from that project's
   Pinecone namespace using Pinecone document search.
3. Retrieved text is combined with the recent chat history (up to 10 messages).
4. The context and question are sent to the configured Groq model through
   LangChain's `ChatGroq`.
5. The model is instructed to answer only from the supplied project context and
   to acknowledge when information is unavailable.
6. The response and source metadata are returned and persisted in
   `VisitorChat`.
7. The streaming endpoint sends sources, response chunks, completion, or error
   events using server-sent events.

The implementation does not define an embedding model in application code;
Pinecone's configured document search/embedding behavior is used.

### RAG worker behavior

- Poll interval: 5 seconds.
- Maximum attempts: 3.
- Stale processing lock timeout: 5 minutes.
- Temporary failures are re-queued with a retry delay.
- Exhausted jobs are marked `failed`.
- Administrators can inspect status, retry a job, or delete project vectors.

## 7. Technology Stack

### Frontend

- React 19
- Vite
- React Router
- Redux Toolkit and Redux Persist
- TanStack React Query
- Tailwind CSS
- Recharts
- Axios
- React Toastify

### Backend

- Node.js with ECMAScript modules
- Express 5
- Mongoose and MongoDB
- JSON Web Tokens
- bcryptjs
- Multer
- Cloudinary
- Nodemailer
- express-validator
- express-rate-limit

### AI and document processing

- LangChain
- Groq through `@langchain/groq`
- Pinecone
- LangChain PDF loader
- Recursive character text splitting
- `pdf-parse` dependency for PDF-related backend processing

### Testing

- Vitest
- Supertest

## 8. System Architecture

```text
Browser
  |
  | React/Vite application
  | Axios + credentials
  v
Express API
  |
  +-- JWT cookie authentication and role authorization
  +-- Controllers and validation
  +-- Mongoose data access
  |      |
  |      v
  |   MongoDB
  |
  +-- Cloudinary file storage
  +-- SMTP email delivery
  +-- RAG worker
         |
         +-- PDF download and extraction
         +-- Pinecone project namespace
         +-- Groq response generation
```

The backend starts the database connection, deadline reminder worker, and RAG
indexer when `server/server.js` starts.

## 9. Project Folder Structure

```text
Pravah/
├── client/
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── components/
│       ├── lib/
│       ├── pages/
│       │   ├── admin/
│       │   ├── auth/
│       │   ├── student/
│       │   ├── teacher/
│       │   └── visitor/
│       └── store/
│           └── slices/
├── server/
│   ├── config/
│   ├── controllers/
│   ├── jobs/
│   ├── middlewares/
│   ├── models/
│   ├── router/
│   ├── services/
│   ├── tests/
│   ├── utils/
│   ├── app.js
│   └── server.js
└── uploads/
```

`node_modules`, build output, and environment files are intentionally excluded
from the documented source structure.

## 10. Local Installation and Setup

### Prerequisites

- Node.js compatible with the installed React/Vite and Express dependencies.
- A MongoDB database.
- Cloudinary credentials for file uploads.
- SMTP credentials for password-reset email.
- Pinecone credentials and an index for RAG features.
- Groq credentials for chatbot responses.

### Install dependencies

The repository contains independent `client` and `server` package manifests:

```bash
cd server
npm install

cd ../client
npm install
```

There is no root `package.json`; commands must be run from the corresponding
package directory.

## 11. Environment Variables

### Server variables

Create `server/.env` with values for the following names:

```env
PORT=4000
FRONTEND_URL=<frontend-origin>

MONGO_URI=<mongodb-connection-string>

JWT_SECRET=<strong-random-secret>
JWT_EXPIRE=7d
COOKIE_EXPIRE=7
COOKIE_SAME_SITE=<optional-cookie-same-site-policy>
NODE_ENV=<development-or-production>

SMTP_HOST=<smtp-host>
SMTP_PORT=<smtp-port>
SMTP_USER=<smtp-username>
SMTP_PASSWORD=<smtp-password>
SMTP_SERVICE=<smtp-service-name>

CLOUDINARY_CLOUD_NAME=<cloudinary-cloud-name>
CLOUDINARY_API_KEY=<cloudinary-api-key>
CLOUDINARY_API_SECRET=<cloudinary-api-secret>

PINECONE_API_KEY=<pinecone-api-key>
PINECONE_INDEX=<pinecone-index-name>

GROQ_API_KEY=<groq-api-key>
GROQ_MODEL=<groq-model-name>
```

### Client variable

Create `client/.env` when the backend is not at the default development URL:

```env
VITE_API_URL=<api-origin>/api/v1
```

The client currently falls back to `http://localhost:4000/api/v1` when
`VITE_API_URL` is not set. This fallback is for local development only.

Never commit real credentials. The repository currently does not include a
sanitized `.env.example` file.

## 12. Running the Application Locally

Run the backend and frontend in separate terminals:

```bash
# Terminal 1
cd server
npm start
```

```bash
# Terminal 2
cd client
npm run dev
```

The client package scripts also provide:

```bash
cd client
npm run build
npm run preview
npm run lint
```

The server package defines `npm run dev`, which runs `nodemon server.js`.
`nodemon` is not declared in the server's `package.json` dependencies, so use
`npm start` unless Nodemon is already available in the environment or is added
as an approved development dependency.

## 13. Deployment Architecture

The currently supplied deployment endpoints are:

| Component | URL |
| --- | --- |
| Frontend | https://pravah-bay-tau.vercel.app |
| Backend | https://pravah-backend-pe55.onrender.com |
| Backend health | https://pravah-backend-pe55.onrender.com/health |

Expected production flow:

```text
Vercel frontend
       |
       | HTTPS requests with credentials
       v
Render Express backend
       |
       +-- MongoDB
       +-- Cloudinary
       +-- SMTP provider
       +-- Pinecone
       +-- Groq
```

For production configuration:

1. Set the backend `FRONTEND_URL` to
   `https://pravah-bay-tau.vercel.app`.
2. Set the frontend `VITE_API_URL` to
   `https://pravah-backend-pe55.onrender.com/api/v1`.
3. Set `NODE_ENV=production`.
4. Configure `COOKIE_SAME_SITE` according to the deployed frontend/backend
   relationship and HTTPS cookie requirements.
5. Add all backend service credentials to the hosting provider's secret
   environment configuration.
6. Verify `GET https://pravah-backend-pe55.onrender.com/health`.

No Dockerfile, Docker Compose file, Vercel configuration, Render configuration,
CI workflow, migration script, seed script, or deployment manifest was found in
the repository. The URLs above are therefore documented as supplied deployment
endpoints, not as a repository-defined deployment procedure.

## 14. API Overview

Base URL:

```text
<backend-origin>/api/v1
```

### Health

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | Backend health response; this route is outside `/api/v1` |

### Authentication: `/auth`

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/register` | Register a student |
| POST | `/login` | Log in as Student, Teacher, or Admin |
| GET | `/logout` | Clear the authenticated session |
| POST | `/password/forgot` | Request a password-reset email |
| PUT | `/password/reset/:token` | Set a new password |
| GET | `/me` | Fetch the authenticated user |

### Student: `/student`

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/project` | Fetch the student's project |
| POST | `/proposal` | Submit a proposal |
| POST | `/upload/:projectID` | Upload up to 10 files |
| GET | `/fetch-supervisors` | List teachers available for supervision |
| POST | `/request-supervisor` | Request a teacher |
| GET | `/getSupervisor` | Fetch assigned supervisor |
| GET | `/feedback/:projectId` | Fetch project feedback |
| GET | `/fetch-dashboard-stats` | Fetch student dashboard statistics |
| GET | `/files/:projectId` | List project files |
| GET | `/download/:projectId/:fileId` | Download a project file |
| GET | `/feedback-history` | Fetch feedback history |
| PUT | `/feedback/read-all` | Mark all feedback as read |
| PUT | `/feedback/:feedbackId/read` | Mark one feedback item as read |
| GET | `/my-requests` | List supervisor requests |
| PUT | `/requests/:id/cancel` | Cancel a supervisor request |
| GET | `/my-files` | List the student's files |
| DELETE | `/files/:projectId/:fileId` | Delete a student file |
| POST | `/feedback/:feedbackId/reply` | Reply to feedback |
| POST | `/publication-request` | Request public publication |

### Teacher: `/teacher`

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/dashboard` | Fetch teacher dashboard |
| GET | `/requests` | List supervisor requests |
| PUT | `/requests/:id/accept` | Accept a request |
| PUT | `/requests/:id/reject` | Reject a request |
| GET | `/students` | List assigned students |
| GET | `/students/:id` | Fetch an assigned student |
| GET | `/projects` | List teacher projects |
| GET | `/projects/:id` | Fetch a teacher project |
| GET | `/projects/:id/files` | List project files |
| GET | `/projects/:projectId/files/:fileId` | Download a project file |
| POST | `/projects/:id/feedback` | Add project feedback |
| PUT | `/projects/:id/status` | Update project status |
| GET | `/deadlines` | List teacher deadlines |
| GET | `/files` | List teacher-accessible files |
| PUT | `/projects/:projectId/files/:fileId/review` | Review a file |
| POST | `/projects/:projectId/feedback/:feedbackId/reply` | Reply to student feedback |

### Admin: `/admin`

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/dashboard` | Fetch admin dashboard statistics |
| POST/PUT/DELETE | `/create-student`, `/update-student/:id`, `/delete-student/:id` | Manage students |
| POST/PUT/DELETE | `/create-teacher`, `/update-teacher/:id`, `/delete-teacher/:id` | Manage teachers |
| GET | `/users` | List users |
| GET | `/projects` | List projects |
| GET | `/projects/:projectId` | Fetch project details |
| PUT | `/projects/:projectId/decision` | Approve or reject a project |
| PUT | `/projects/:projectId/supervisor` | Assign a supervisor |
| PUT | `/projects/:projectId/status` | Update project status |
| GET/POST | `/deadlines` | List or create deadlines |
| PUT/PATCH/DELETE | `/deadlines/:deadlineId` and `/deadlines/:deadlineId/toggle` | Manage deadlines |
| GET | `/projects/publication-requests` | List publication requests |
| PATCH | `/projects/:projectId/publication` | Approve, reject, or make publication private |
| GET | `/projects/:projectId/rag/status` | Inspect RAG status |
| POST | `/projects/:projectId/rag/retry` | Retry RAG indexing |
| DELETE | `/projects/:projectId/rag` | Delete project vectors |

### Notifications: `/notifications`

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/` | List notifications |
| GET | `/unread-count` | Fetch unread count |
| PUT | `/read-all` | Mark all as read |
| PUT | `/:id/read` | Mark one as read |
| DELETE | `/:id` | Delete a notification |

These routes are available to Student, Teacher, and Admin roles.

### Visitor: `/visitor`

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/register` | Register a visitor |
| POST | `/login` | Log in as a visitor |
| POST | `/logout` | Log out a visitor |
| GET | `/projects` | List approved public completed projects |
| GET | `/projects/:id` | Fetch one public project |
| GET | `/projects/:projectId/chat` | Fetch visitor chat history |
| POST | `/projects/:projectId/chat` | Ask a project question |
| POST | `/projects/:projectId/chat/stream` | Ask a question with SSE streaming |
| POST | `/student/submit-public` | Submit a student project for publication |

All API paths above are relative to `/api/v1/<router-prefix>`.

## 15. Security and Authorization

- Passwords are hashed with bcryptjs before storage.
- JWTs are signed with `JWT_SECRET` and expire according to `JWT_EXPIRE`.
- Authentication cookies are HTTP-only.
- Cookies are secure in production and support configurable SameSite behavior.
- Protected routes verify the token and load the current user from MongoDB.
- Role checks return `403` for unauthorized roles.
- Request bodies and route parameters use `express-validator`.
- Login, registration, password reset, and visitor chat routes are rate-limited.
- CORS allows the configured `FRONTEND_URL` and credentials.
- File type, extension, size, and count checks run before file handling.
- Project status transitions are validated by the Mongoose project lifecycle logic.
- Visitor chat is limited to completed, public, approved projects with successful
  RAG indexing.

Production deployments should use HTTPS, strong unique secrets, restricted
database/service credentials, and provider-managed secret storage.

## 16. Testing Instructions

Backend tests are located in `server/tests` and use Vitest. The verified test
areas are:

- Visitor route authorization.
- Publication approval and RAG queueing.
- RAG worker success, retry, and exhausted-failure states.
- Streaming chatbot source, chunk, completion, and error events.

Run the backend test suite:

```bash
cd server
npm test
```

Run the client lint script:

```bash
cd client
npm run lint
```

No client test suite was found in the repository.


## 17. Contributors and Acknowledgements

### Contributor

- **Sambhav** — project author 

### Acknowledgements

Pravah uses and builds on the following open-source technologies:

- React, Vite, React Router, Redux Toolkit, TanStack React Query, Tailwind CSS,
  Recharts, Axios, and React Toastify.
- Node.js, Express, Mongoose, MongoDB, JWT, bcryptjs, Multer, and Nodemailer.
- LangChain, Groq, Pinecone, Cloudinary, Vitest, and Supertest.




