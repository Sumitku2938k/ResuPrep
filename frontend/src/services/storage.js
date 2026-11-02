// ─── localStorage Service (Temporary mock data for unmigrated features) ───
// NOTE: Authentication is handled by AuthContext and backend API (/api/v1/auth).
// NOTE: Resume Analysis & History are handled by resumeApi (/api/v1/resume) and MongoDB.
// NOTE: CV Templates are handled by templatesApi (/api/v1/templates) and MongoDB.
// NOTE: Resume Builder is handled by builderApi (/api/v1/builder) and MongoDB.
// NOTE: Cover Letter is handled by coverLetterApi (/api/v1/cover-letter) and MongoDB.
// The helpers below remain only for features scheduled for migration in future phases (Phase 4: Feedback).

const KEYS = {
  FEEDBACK: 'ResuPrep_feedback',
};

// ─── Helpers ───

function getItem(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setItem(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ─── Feedback (Scheduled for Phase 4 migration) ───

export function saveFeedback(feedback) {
  const all = getItem(KEYS.FEEDBACK, []);
  all.unshift({ id: generateId(), date: new Date().toISOString(), ...feedback });
  setItem(KEYS.FEEDBACK, all);
}

export function getFeedback() {
  return getItem(KEYS.FEEDBACK, []);
}
