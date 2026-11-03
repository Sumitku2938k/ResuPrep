# ResuPrep Phase 4 — Backend API Contract & Verification Report

**Phase:** Phase 4: Skills Gap + FAQ + Feedback  
**Checkpoint:** Checkpoint 1 — Backend Contract Audit  
**Status:** AUDITED & VERIFIED ✅  
**Date:** 2026-11-02  
**Verified via Test Suite:** `backend/scripts/verify_phase4_checkpoint1.js` (12/12 PASS)

---

## 1. Executive Summary

This document establishes the verified API contracts for all Phase 4 backend endpoints before frontend wiring begins. All endpoints were verified against actual Express routes, controllers, Mongoose models, and Joi validation schemas mounted under `/api/v1/`.

| Feature | Endpoint | Method | Auth | Primary Purpose |
|---|---|---|---|---|
| **Skills Taxonomy** | `/api/v1/skills/taxonomy/:role` | `GET` | Public | Retrieve curated core skills, levels, and categories for a target role |
| **Skill Gap Analysis** | `/api/v1/skills/gap-analysis` | `POST` | Public | Analyze gap between user's current skills and role via OpenAI / NLP fallback |
| **FAQ Retrieval** | `/api/v1/faqs` | `GET` | Public | Retrieve active FAQs, supporting optional `?category=` filtering |
| **Feedback Submission** | `/api/v1/feedback` | `POST` | Public | Submit user rating, feature tag, and review message (persisted in MongoDB) |
| **Public Feedback** | `/api/v1/feedback/public` | `GET` | Public | Retrieve up to 50 public testimonials ordered newest first |

---

## 2. Skills API Contract

Mounted at: `backend/src/routes/skill.routes.js`  
Controller: `backend/src/controllers/skill.controller.js`  
Service: `backend/src/services/ai.service.js`

### 2.1 Role Skills Taxonomy
- **Route:** `GET /api/v1/skills/taxonomy/:role`
- **Authentication:** None (`public`).
- **Path Parameters:**
  - `role`: String slug. Supported values in controller dictionary:
    - `frontend-developer`
    - `backend-developer`
    - `data-scientist`
    - `full-stack-developer`
    - `devops-engineer`
- **Fallback Behavior:** If an unsupported role is requested, the controller safely defaults to `full-stack-developer`.
- **Response Structure (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Success",
    "data": {
      "taxonomy": {
        "role": "Frontend Developer",
        "skills": [
          { "name": "HTML/CSS", "level": "advanced", "category": "core" },
          { "name": "JavaScript", "level": "advanced", "category": "core" },
          { "name": "React", "level": "advanced", "category": "framework" },
          { "name": "TypeScript", "level": "intermediate", "category": "language" },
          { "name": "Testing (Jest/Cypress)", level: "intermediate", category: "testing" },
          { "name": "Responsive Design", level: "advanced", category: "core" },
          { "name": "Git", level: "intermediate", category: "tools" },
          { "name": "Performance Optimization", level: "intermediate", category: "advanced" }
        ]
      }
    }
  }
  ```

### 2.2 Skill Gap Analysis
- **Route:** `POST /api/v1/skills/gap-analysis`
- **Authentication:** None (`public`).
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "currentSkills": ["HTML", "CSS", "JavaScript"],
    "targetRole": "Frontend Developer"
  }
  ```
- **Validation Rules:**
  - `currentSkills`: Must be present, non-empty array of strings.
  - `targetRole`: Must be present, non-empty string.
  - If either is missing, controller returns HTTP `400 Bad Request`:
    `{ "success": false, "message": "currentSkills (array) and targetRole (string) are required" }`.
- **Response Structure (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Success",
    "data": {
      "gaps": [
        {
          "skill": "React",
          "priority": "critical",
          "resource": "Search for \"React course\" on Coursera, Udemy, or freeCodeCamp"
        },
        {
          "skill": "TypeScript",
          "priority": "high",
          "resource": "Search for \"TypeScript course\" on Coursera, Udemy, or freeCodeCamp"
        }
      ],
      "targetRole": "Frontend Developer"
    }
  }
  ```

---

## 3. FAQ API Contract

Mounted at: `backend/src/routes/faq.routes.js`  
Controller: `backend/src/controllers/faq.controller.js`  
Model: `backend/src/models/FAQ.js`

### 3.1 List FAQs
- **Route:** `GET /api/v1/faqs` *(Important: plural `/faqs`, not singular `/faq`)*
- **Authentication:** None (`public`).
- **Query Parameters:**
  - `category` (optional): Filter by category slug.
- **Sorting:** Sorted automatically by `{ category: 1, order: 1 }`.
- **Filtering Logic:** `{ isActive: true }`. If `?category=` is passed: `{ isActive: true, category }`.
- **Supported Category Enums in Mongoose Model (`FAQ.js`):**
  - `getting-started`
  - `resume-analyzer`
  - `job-matching`
  - `cv-templates`
  - `skill-assessment`
- **Response Structure (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Success",
    "data": {
      "faqs": [
        {
          "_id": "6724...",
          "question": "What is ResuPrep?",
          "answer": "ResuPrep is an AI-powered career toolkit...",
          "category": "getting-started",
          "order": 1,
          "isActive": true,
          "createdAt": "2026-11-02T...",
          "updatedAt": "2026-11-02T..."
        }
      ]
    }
  }
  ```

---

## 4. Feedback API Contract

Mounted at: `backend/src/routes/feedback.routes.js`  
Controller: `backend/src/controllers/feedback.controller.js`  
Model: `backend/src/models/Feedback.js`  
Validation: `backend/src/validators/schemas.js` (`feedbackSchema`)

### 4.1 Submit Feedback
- **Route:** `POST /api/v1/feedback`
- **Authentication:** None (`public`).
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "name": "Jane Doe",
    "role": "Product Designer",
    "rating": 5,
    "feature": "resume-analyzer",
    "message": "The keyword matching saved me days of preparation!"
  }
  ```
- **Validation Rules (Joi `feedbackSchema`):**
  - `name`: String, trimmed, min 2, max 50, required.
  - `role`: String, trimmed, max 50, default: `'User'`.
  - `rating`: Integer, min 1, max 5, required.
  - `feature`: String enum: `'resume-analyzer'`, `'job-matcher'`, `'resume-builder'`, `'cover-letter'`, `'skill-assessment'`, `'general'`. Default: `'general'`.
  - `message`: String, trimmed, min 10, max 1000, required.
- **Response Structure (HTTP 201 Created):**
  ```json
  {
    "success": true,
    "message": "Thank you for your feedback!",
    "data": {
      "feedback": {
        "_id": "6724...",
        "name": "Jane Doe",
        "role": "Product Designer",
        "rating": 5,
        "feature": "resume-analyzer",
        "message": "The keyword matching saved me days of preparation!",
        "isPublic": true,
        "createdAt": "2026-11-02T...",
        "updatedAt": "2026-11-02T..."
      }
    }
  }
  ```

### 4.2 List Public Feedback Testimonials
- **Route:** `GET /api/v1/feedback/public`
- **Authentication:** None (`public`).
- **Backend Query:** `Feedback.find({ isPublic: true }).sort({ createdAt: -1 }).limit(50)`
- **Response Structure (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Success",
    "data": {
      "feedback": [
        {
          "_id": "6724...",
          "name": "Jane Doe",
          "role": "Product Designer",
          "rating": 5,
          "feature": "resume-analyzer",
          "message": "The keyword matching saved me days of preparation!",
          "isPublic": true,
          "createdAt": "2026-11-02T...",
          "updatedAt": "2026-11-02T..."
        }
      ]
    }
  }
  ```

---

## 5. AI Engine and NLP Fallback Analysis

In `backend/src/services/ai.service.js`:
- Function: `analyzeSkillGap(currentSkills, targetRole)`
- **OpenAI Integration:** Targets `gpt-3.5-turbo` with prompt instructing:
  `Return a JSON array of objects with keys: skill (string), priority ("critical"/"high"/"medium"/"low"), resource (string). Return ONLY valid JSON.`
- **NLP Fallback Logic (`fallbackSkillGap`):**
  - Triggered if `OPENAI_API_KEY` is not configured, or if the OpenAI API returns an error (such as HTTP 404 for deprecated `gpt-3.5-turbo`).
  - Contains role-skill dictionaries for `frontend developer`, `backend developer`, `full stack developer`, `data scientist`, `devops engineer`, and `product manager`.
  - Compares `currentSkills` set against target skills. Missing skills are assigned prioritized gap levels (`critical`, `high`, `medium`, `low`) and curated learning search queries.
- **Contract Parity:** Both OpenAI output and fallback return identical array structures of `{ skill, priority, resource }`. The frontend service and UI do not need special handling for fallback vs. live AI responses.

---

## 6. Frontend Integration Recommendations

### Dedicated Service Modules to Implement
1. **`frontend/src/api/skills.js`:**
   - `getSkillTaxonomyApi(role)` -> `GET /skills/taxonomy/:role`
   - `analyzeSkillGapApi({ currentSkills, targetRole })` -> `POST /skills/gap-analysis`
2. **`frontend/src/api/faq.js`:**
   - `getFaqsApi(params = {})` -> `GET /faqs?category=...`
3. **`frontend/src/api/feedback.js`:**
   - `submitFeedbackApi(payload)` -> `POST /feedback`
   - `getPublicFeedbackApi()` -> `GET /feedback/public`

### UI Field Mapping Insights
- **`Skills.jsx`:** Currently has hardcoded `skillData` and `comparisonTable`. When wiring, connect role selection to `getSkillTaxonomyApi(role)` and user skill comparison to `analyzeSkillGapApi({ currentSkills, targetRole })`.
- **`FAQ.jsx`:** Currently uses `{ q, a }` in a local dictionary. The backend returns `{ question, answer }`. The frontend should map `faq.question` and `faq.answer`.
- **`Feedback.jsx`:** Currently uses `localStorage` (`storage.js`). Replace `saveFeedback` with `submitFeedbackApi` and `getFeedback` with `getPublicFeedbackApi()`.

---

## 7. Known Issues & Backend Discrepancies

1. **FAQ Model Category Enum vs. Seed Data:**
   - In `backend/scripts/seed.js`, lines 70–101 define FAQs with `category: 'mock-interview'`.
   - However, `backend/src/models/FAQ.js` defines:
     `enum: ['getting-started', 'resume-analyzer', 'job-matching', 'cv-templates', 'skill-assessment']`.
   - Running `seed.js` with `'mock-interview'` causes a Mongoose validation error unless `'mock-interview'` is added to `FAQ.js` or adjusted in seed data.
2. **Pluralization Contract:**
   - The route prefix is `/api/v1/faqs` (plural). Calls to `/api/v1/faq` return HTTP 404. The frontend service must strictly use `/faqs`.
3. **Feedback Model Ownership:**
   - The `Feedback` model does not contain a `user` ObjectId reference. All feedback submissions are anonymous by design, and `GET /public` retrieves all approved/public testimonials globally.

