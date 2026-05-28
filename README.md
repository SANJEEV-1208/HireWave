# HireWave

A full-stack job portal I built to connect job seekers and employers. It has AI-powered features like job recommendations, talent matching, and cover letter generation — all running on Groq's LLaMA 3.1 model.

---

## Demo

[Watch Demo](https://drive.google.com/file/d/1qN2TWvsOo3x9wXt_bEyxaiiOqGAwffHr/view?usp=drive_link) · [Live App](https://hire-wave-delta.vercel.app)

---

## What it does

**For job seekers:**
- Browse and search job listings
- See a skill match score for each job based on your profile
- Get AI-generated job recommendations
- Apply with a resume, and generate a cover letter using AI
- Chat directly with employers
- Track your application status (Applied → Shortlisted → Accepted/Rejected)
- Get notified when an employer views your profile

**For employers:**
- Post jobs with required skills
- Use AI to rank the best-matching candidates for a role
- Search for candidates by name or skill
- Manage and filter incoming applications
- View an analytics dashboard (applications over time, top jobs, status breakdown)
- Chat with candidates directly

**General:**
- JWT auth with access + refresh token rotation
- Google OAuth 2.0 login
- Email OTP verification on signup and password reset
- Role-based access (Job Seeker / Employer / Admin)
- Rate limiting on API endpoints

---

## Tech Stack

| | |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, React Router |
| Backend | Spring Boot, Spring Security, Spring Data JPA |
| Database | PostgreSQL (hosted on Supabase) |
| AI | Groq API — LLaMA 3.1 8B Instant |
| Real-time | WebSocket (STOMP over SockJS) |
| Auth | JWT, Google OAuth 2.0 |
| Email | Brevo HTTP API |
| Charts | Recharts |
| Deployment | Render (backend, Docker) + Vercel (frontend) |

---

## Project Structure

```
HireWave/
├── frontend/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── contexts/
│       ├── hooks/
│       └── services/api.js
│
└── backend/
    └── src/main/java/com/example/demo/
        ├── controllers/
        ├── services/
        ├── models/
        ├── repositories/
        ├── dto/
        ├── security/
        └── config/
```

---

## Running locally

### Prerequisites
- Java 21+
- Maven 3.8+
- Node.js 18+
- PostgreSQL 14+

### Backend

```bash
cd backend
# Create a PostgreSQL database: CREATE DATABASE jobportal;
# Set these env vars: DB_URL, DB_USERNAME, DB_PASSWORD, JWT_SECRET, BREVO_API_KEY, GOOGLE_CLIENT_ID, GROQ_API_KEY
mvn spring-boot:run
# Runs at http://localhost:8081
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Set VITE_API_URL=http://localhost:8081/api in .env.local
npm run dev
# Runs at http://localhost:5173
```

---

## Environment Variables

### Backend

| Variable | What it's for |
|---|---|
| `DB_URL` | PostgreSQL JDBC connection URL |
| `DB_USERNAME` | DB username |
| `DB_PASSWORD` | DB password |
| `JWT_SECRET` | Secret key for signing JWTs (use a long random string) |
| `BREVO_API_KEY` | Brevo API key for sending emails |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GROQ_API_KEY` | Groq API key for AI features |
| `CORS_ALLOWED_ORIGINS` | Frontend URL(s) allowed to call the API |

### Frontend

| Variable | What it's for |
|---|---|
| `VITE_API_URL` | Backend base URL, e.g. `http://localhost:8081/api` |

---

## License

MIT
