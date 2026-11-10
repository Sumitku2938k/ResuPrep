// ─── localStorage Service (Generic utilities for client-side persistence) ───
// NOTE: All Phase 1–4 features are fully migrated to backend APIs and MongoDB:
//   - Phase 1: Authentication -> AuthContext & /api/v1/auth
//   - Phase 2: Resume Analysis & History -> resumeApi (/api/v1/resume) & MongoDB
//   - Phase 3: CV Templates -> templatesApi (/api/v1/templates) & MongoDB
//   - Phase 3: Resume Builder -> builderApi (/api/v1/builder) & MongoDB
//   - Phase 3: Cover Letter -> coverLetterApi (/api/v1/cover-letter) & MongoDB
//   - Phase 4: Skills Gap Analysis -> skillsApi (/api/v1/skills)
//   - Phase 4: FAQ Retrieval -> faqApi (/api/v1/faqs) & MongoDB
//   - Phase 4: Feedback Submission & Reviews -> feedbackApi (/api/v1/feedback) & MongoDB
//
// Generic storage helpers below are preserved for theme settings and any future client-side utility caching.

export function getItem(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function setItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Gracefully handle storage quota or private mode errors
  }
}

export function removeItem(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore error
  }
}
