# ResuPrep — AI-Powered Resume Analyzer, Mock Interview & Career Toolkit

A full-stack AI-powered career platform that helps users analyze resumes, optimize ATS scores, build professional resumes, generate cover letters, match jobs, assess skills, and practice AI-powered mock interviews with real-time gesture and confidence analysis.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS 3, Framer Motion, Chart.js |
| Backend | Node.js, Express.js, MongoDB (Mongoose), JWT |
| AI | OpenAI GPT-3.5-turbo (with fallback NLP) |

## Features

- **Resume Analyzer** — Upload PDF/DOCX resumes and receive AI-powered ATS compatibility scores, keyword matching, and improvement suggestions.
- **Job Matcher** — Match your profile against curated job listings based on skills and experience.
- **Resume Builder** — Create professional resumes with live preview and PDF export.
- **Cover Letter Generator** — Generate personalized AI-powered cover letters with multiple writing tones.
- **CV Templates** — Choose from 8+ professionally designed resume templates.
- **Skill Gap Analysis** — Compare your skills against job requirements with radar charts and personalized recommendations.
- **Skill Assessment** — Interactive quizzes across Python, Machine Learning, SQL, Web Development, and Communication.
- **AI Mock Interview** — Practice technical and HR interviews with AI-generated questions tailored to your selected role.
- **Gesture & Confidence Analysis** — Analyze eye contact, facial expressions, posture, confidence, and communication during mock interviews using AI-powered computer vision.
- **Interview Performance Report** — Receive detailed feedback, strengths, weaknesses, communication analysis, and improvement suggestions after every interview.
- **AI Career Assistant** — Floating AI chatbot for resume tips, ATS guidance, interview preparation, and career advice.
- **Dark/Light Mode** — Persistent theme toggle.
- **FAQ & Feedback** — Community-driven FAQs and feedback system with ratings.

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB running locally or a MongoDB Atlas URI
- (Optional) OpenAI API key for AI features

### Backend Setup

```bash
cd backend
cp .env.example .env    # Edit with your MongoDB URI and OpenAI key
npm install
npm run seed            # Populate templates and FAQs
npm run dev             # Starts on http://localhost:5000
```

### Frontend Setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev             # Starts on http://localhost:5173
```

### Environment Variables

**Backend (.env)**
```
MONGO_URI=mongodb://localhost:27017/ResuPrepDB
```

**Frontend (.env)**
```
VITE_API_URL=http://localhost:5000/api/v1
```

## API Documentation

Swagger UI available at `http://localhost:5000/api/docs` when backend is running.

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/        # DB & Swagger config
│   │   ├── controllers/   # Route handlers
│   │   ├── middleware/    # Auth, upload, validation, errors
│   │   ├── models/        # Mongoose schemas
│   │   ├── routes/        # Express routes
│   │   ├── services/      # AI, Interview, Resume, Job matching services
│   │   │      ├── ai/
│   │   │      ├── interview/
│   │   │      ├── gesture-analysis/
│   │   │      └── parser/
│   │   ├── utils/         # Logger, API response
│   │   └── validators/    # Joi schemas
│   └── scripts/           # Seed data
│
├── frontend/
│   ├── src/
│   │   ├── api/           # Axios instance
│   │   ├── components/    # Shared UI components
│   │   ├── context/       # Auth context
│   │   ├── hooks/         # Custom hooks
│   │   ├── pages/         # 11 page components
│   │   └── styles/        # Global CSS
│   └── index.html
└── README.md
```

