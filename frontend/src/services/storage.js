// ─── localStorage Service (Temporary mock data for unmigrated features) ───
// NOTE: Authentication is handled by AuthContext and backend API (/api/v1/auth).
// NOTE: Resume Analysis & History are handled by resumeApi (/api/v1/resume) and MongoDB.
// The helpers below remain only for features scheduled for migration in future phases.

const KEYS = {
  RESUMES: 'ResuPrep_resumes',
  COVER_LETTERS: 'ResuPrep_cover_letters',
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

// ─── Cover Letter ───

export function saveCoverLetter(data) {
  const letters = getItem(KEYS.COVER_LETTERS, []);
  letters.unshift({ id: generateId(), date: new Date().toISOString(), ...data });
  setItem(KEYS.COVER_LETTERS, letters.slice(0, 50));
}

export function getCoverLetters() {
  return getItem(KEYS.COVER_LETTERS, []);
}

// ─── Feedback ───

export function saveFeedback(feedback) {
  const all = getItem(KEYS.FEEDBACK, []);
  all.unshift({ id: generateId(), date: new Date().toISOString(), ...feedback });
  setItem(KEYS.FEEDBACK, all);
}

export function getFeedback() {
  return getItem(KEYS.FEEDBACK, []);
}

// ─── Resume Builder ───

export function saveBuiltResume(resume) {
  const all = getItem(KEYS.RESUMES, []);
  const existing = all.findIndex(r => r.id === resume.id);
  if (existing >= 0) {
    all[existing] = { ...resume, updatedAt: new Date().toISOString() };
  } else {
    all.unshift({ ...resume, id: generateId(), createdAt: new Date().toISOString() });
  }
  setItem(KEYS.RESUMES, all);
}

export function getBuiltResumes() {
  return getItem(KEYS.RESUMES, []);
}
