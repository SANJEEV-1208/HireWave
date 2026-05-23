# HireWave

**An AI-powered full-stack job portal** that connects job seekers with employers through intelligent matching, real-time messaging, and a modern user experience.

> Built with React + Spring Boot · AI via Groq (LLaMA 3.1) · Real-time WebSocket messaging

---

## Features

### Job Seeker
- Browse and search active job listings with filters
- AI-powered job recommendations based on profile skills
- Skill match score displayed per job (exact match against required skills)
- Apply with resume upload or saved profile resume
- AI-generated cover letter per job role
- Real-time messaging with employers
- Application status tracking (Applied → Shortlisted → Accepted/Rejected)
- Notifications when an employer views your profile

### Employer
- Post jobs with a required skills tag input
- AI talent matching — ranks top job seekers per job role using LLaMA 3.1
- Talent search — find job seekers by name or skill
- View, filter, and annotate incoming applications
- Analytics dashboard — applications over time, status distribution, top jobs
- Real-time messaging with candidates
- Unique view count per job post (self-views excluded)

### General
- JWT authentication with access + refresh token rotation (15 min / 7 day)
- Google OAuth 2.0 sign-in
- Email verification on registration
- OTP-based password reset via Gmail
- Role-based access control (Job Seeker / Employer / Admin)
- Rate limiting on all API endpoints

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, Tailwind CSS 4, React Router 7 |
| Backend | Spring Boot 4, Spring Security, Spring Data JPA |
| Database | PostgreSQL |
| AI | Groq API — LLaMA 3.1 8B Instant |
| Real-time | WebSocket — STOMP over SockJS |
| Auth | JWT (JJWT 0.12), Google OAuth 2.0 |
| Email | Gmail SMTP via Spring Mail |
| Charts | Recharts |
| Rate Limiting | Bucket4j |

---

## Project Structure

```
HireWave/
├── frontend/          React + Vite SPA
│   ├── src/
│   │   ├── components/    Navbar, shared UI
│   │   ├── pages/         All route pages
│   │   ├── contexts/      AuthContext
│   │   ├── hooks/         useWebSocket
│   │   └── services/      api.js (Axios)
│   ├── .env.example
│   └── requirements.txt
│
└── backend/           Spring Boot REST API
    ├── src/main/java/com/example/demo/
    │   ├── controllers/   REST endpoints
    │   ├── services/      Business logic + AI
    │   ├── models/        JPA entities
    │   ├── repositories/  Spring Data repos
    │   ├── dto/           Request / Response DTOs
    │   ├── security/      JWT filter, rate limiter
    │   └── config/        Security, WebSocket config
    ├── src/main/resources/
    │   ├── application.properties
    │   └── application.properties.example
    └── requirements.txt
```

---

## Getting Started

### Prerequisites

| Tool | Version |
|---|---|
| Java JDK | 21+ |
| Apache Maven | 3.8+ |
| Node.js | 18+ |
| PostgreSQL | 14+ |

### Backend Setup

```bash
cd backend

# 1. Create a PostgreSQL database
#    CREATE DATABASE jobportal;

# 2. Set environment variables (see backend/application.properties.example)
#    DB_URL, DB_USERNAME, DB_PASSWORD, JWT_SECRET,
#    MAIL_USERNAME, MAIL_PASSWORD, GOOGLE_CLIENT_ID, GROQ_API_KEY

# 3. Run
mvn spring-boot:run
# Starts at http://localhost:8081
```

### Frontend Setup

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Create environment file
cp .env.example .env.local
# Edit .env.local and set VITE_API_URL=http://localhost:8081/api

# 3. Run
npm run dev
# Opens at http://localhost:5173
```

---

## Environment Variables

### Backend — `application.properties.example`

| Variable | Description |
|---|---|
| `DB_URL` | PostgreSQL JDBC URL |
| `DB_USERNAME` | Database username |
| `DB_PASSWORD` | Database password |
| `JWT_SECRET` | 256-bit secret for JWT signing |
| `MAIL_USERNAME` | Gmail address for outgoing emails |
| `MAIL_PASSWORD` | Gmail App Password (not your login password) |
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 client ID |
| `GROQ_API_KEY` | Groq API key for LLaMA AI features |
| `CORS_ALLOWED_ORIGINS` | Comma-separated list of allowed frontend URLs |

### Frontend — `.env.example`

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend base URL e.g. `http://localhost:8081/api` |

---

## Key API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/users/register` | Register a new user |
| POST | `/api/users/login` | Login and get JWT tokens |
| GET | `/api/jobs` | List all active jobs |
| POST | `/api/jobs/employer/{id}` | Post a new job (employer) |
| GET | `/api/jobs/recommendations` | AI job recommendations for seeker |
| GET | `/api/jobs/{id}/ai-matches` | AI talent matching for a job (employer) |
| POST | `/api/chat/cover-letter?jobId={id}` | Generate AI cover letter |
| GET | `/api/users/search?query=X&role=JOB_SEEKER` | Talent search |
| POST | `/api/messages/send` | Send a message |
| GET | `/api/analytics/summary` | Employer analytics summary |

---

## Screenshots

> Coming soon — will be added after deployment.

---

## License

MIT
