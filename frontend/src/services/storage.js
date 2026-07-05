// ─── localStorage Service ───
// All data is stored in the browser's localStorage. No backend needed.

const KEYS = {
  USER: 'ResuPrep_user',
  ANALYSES: 'ResuPrep_analyses',
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

// ─── Auth (localStorage only) ───

export function getUser() {
  return getItem(KEYS.USER, null);
}

export function loginUser(email, password) {
  // Simple local auth: store user in localStorage
  const user = { id: generateId(), email, name: email.split('@')[0] };
  setItem(KEYS.USER, user);
  return user;
}

export function signupUser(name, email, password) {
  const user = { id: generateId(), name, email };
  setItem(KEYS.USER, user);
  return user;
}

export function logoutUser() {
  localStorage.removeItem(KEYS.USER);
}

// ─── Resume Analysis (ported from backend ai.service.js fallback) ───

const commonSkills = [
  'javascript', 'python', 'react', 'node', 'express', 'mongodb', 'sql', 'html', 'css',
  'typescript', 'java', 'docker', 'kubernetes', 'aws', 'git', 'agile', 'scrum',
  'api', 'rest', 'graphql', 'testing', 'ci/cd', 'linux', 'angular', 'vue',
  'machine learning', 'data', 'analytics', 'communication', 'leadership', 'teamwork',
  'problem-solving', 'management', 'excel', 'figma', 'design', 'ux', 'ui',
  'nextjs', 'tailwind', 'sass', 'webpack', 'vite', 'redis', 'postgresql',
  'firebase', 'azure', 'gcp', 'terraform', 'jenkins', 'nginx',
];

export function analyzeResume(resumeText, jobDescription) {
  const resumeTextLower = resumeText.toLowerCase();
  const jdTextLower = jobDescription.toLowerCase();

  // Find standard skills first (handles multi-word, special chars, short words like 'ui')
  const foundStandardSkills = commonSkills.filter(skill => {
    // Regex matches the skill with word/punctuation boundaries
    const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?:^|\\W)${escapedSkill}(?:$|\\W)`);
    return regex.test(jdTextLower);
  });

  // Extract other long words (length > 4) from JD
  const jdWords = jdTextLower.split(/[^a-z0-9+#-]+/).filter(w => w.length > 4);
  const additionalKeywords = [...new Set(jdWords)].filter(w => !commonSkills.includes(w));

  const jdKeywords = [...new Set([...foundStandardSkills, ...additionalKeywords])].slice(0, 20);

  const matched = jdKeywords.filter(k => {
    const escapedK = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?:^|\\W)${escapedK}(?:$|\\W)`);
    return regex.test(resumeTextLower);
  });
  const missing = jdKeywords.filter(k => !matched.includes(k));

  const score = jdKeywords.length > 0
    ? Math.min(95, Math.round((matched.length / jdKeywords.length) * 100) + Math.floor(Math.random() * 10))
    : 50;

  const result = {
    compatibilityScore: score,
    matchedKeywords: matched.slice(0, 10),
    missingKeywords: missing.slice(0, 10),
    skillGaps: missing.slice(0, 5).map(k => `Develop proficiency in ${k}`),
    improvementTips: [
      'Tailor your resume to match the job description keywords',
      'Add quantifiable achievements (e.g., "Increased efficiency by 30%")',
      'Use action verbs to start bullet points',
      'Keep your resume to 1-2 pages',
      'Include a professional summary at the top',
    ],
    summary: score >= 75
      ? 'Strong match! Your resume aligns well with the job requirements.'
      : score >= 50
        ? 'Moderate match. Consider adding more relevant keywords and experience.'
        : 'Low match. Significant improvements needed to align with this role.',
    interviewQuestions: {
      technical: matched.slice(0, 3).map(k => `Can you explain your experience working with ${k}?`).concat(
        missing.slice(0, 2).map(k => `How would you approach learning ${k} for this role?`)
      ),
      hr: [
        'Tell me about a time you had to overcome a significant challenge.',
        'Where do you see your career heading in the next few years?',
        'How do you prioritize tasks when you have multiple tight deadlines?'
      ],
      project: [
        'Walk me through a complex project you recently completed from start to finish.',
        'Describe a time when a project\'s requirements changed drastically. How did you adapt?'
      ]
    }
  };

  // Save to history
  const history = getItem(KEYS.ANALYSES, []);
  history.unshift({ id: generateId(), date: new Date().toISOString(), result });
  setItem(KEYS.ANALYSES, history.slice(0, 50));

  return result;
}

export function getAnalysisHistory() {
  return getItem(KEYS.ANALYSES, []);
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
