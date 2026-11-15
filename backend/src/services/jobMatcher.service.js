/**
 * Job Matcher Service
 * Pure deterministic skill extraction, normalization, and matching engine.
 * Completely independent of Express, HTTP status codes, MongoDB, and external AI APIs.
 */

// ─── CANONICAL ALIAS MAP ─────────────────────────────────────────────────────

const ALIAS_MAP = {
  // JavaScript ecosystem
  js: 'javascript',
  javascript: 'javascript',
  'java script': 'javascript',
  ecmascript: 'javascript',
  'ecma script': 'javascript',

  // TypeScript
  ts: 'typescript',
  typescript: 'typescript',
  'type script': 'typescript',

  // React & React Native
  react: 'react',
  reactjs: 'react',
  'react.js': 'react',
  'react js': 'react',
  'react native': 'react native',
  reactnative: 'react native',

  // Node.js
  node: 'node.js',
  nodejs: 'node.js',
  'node.js': 'node.js',
  'node js': 'node.js',

  // Next.js
  next: 'next.js',
  nextjs: 'next.js',
  'next.js': 'next.js',
  'next js': 'next.js',

  // Express
  express: 'express',
  expressjs: 'express',
  'express.js': 'express',
  'express js': 'express',

  // Python & frameworks
  py: 'python',
  python: 'python',
  fastapi: 'fastapi',
  'fast api': 'fastapi',
  django: 'django',
  flask: 'flask',

  // Databases & Caches
  mongodb: 'mongodb',
  mongo: 'mongodb',
  'mongo db': 'mongodb',
  postgres: 'postgresql',
  postgresql: 'postgresql',
  'postgres sql': 'postgresql',
  sql: 'sql',
  mysql: 'mysql',
  redis: 'redis',
  snowflake: 'snowflake',
  bigquery: 'bigquery',

  // Containers, Cloud & DevOps
  k8s: 'kubernetes',
  kubernetes: 'kubernetes',
  docker: 'docker',
  containerization: 'docker',
  aws: 'aws',
  'amazon web services': 'aws',
  gcp: 'gcp',
  'google cloud': 'gcp',
  'google cloud platform': 'gcp',
  azure: 'azure',
  'aws/azure/gcp': 'cloud platforms',
  'aws/cloud': 'aws',
  terraform: 'terraform',
  linux: 'linux',
  'ci/cd': 'ci/cd',
  cicd: 'ci/cd',
  'ci / cd': 'ci/cd',
  'ci-cd': 'ci/cd',
  'ci/cd pipelines': 'ci/cd',
  'continuous integration': 'ci/cd',
  git: 'git',
  github: 'git',
  gitlab: 'git',

  // Web Core & Styling
  html: 'html',
  html5: 'html',
  css: 'css',
  css3: 'css',
  'html/css': 'html/css',
  tailwind: 'tailwind css',
  tailwindcss: 'tailwind css',
  'tailwind css': 'tailwind css',
  sass: 'sass',
  scss: 'sass',

  // State Management & APIs
  redux: 'redux',
  graphql: 'graphql',
  'rest apis': 'rest apis',
  'rest api': 'rest apis',
  rest: 'rest apis',
  restful: 'rest apis',
  kafka: 'kafka',
  'apache kafka': 'kafka',

  // Testing & Quality
  jest: 'jest',
  'testing (jest)': 'jest',
  testing: 'testing',
  cypress: 'cypress',
  playwright: 'playwright',
  selenium: 'selenium',

  // Data & ML
  spark: 'spark',
  'big data (spark)': 'spark',
  'apache spark': 'spark',
  airflow: 'airflow',
  'apache airflow': 'airflow',
  'machine learning': 'machine learning',
  ml: 'machine learning',
  statistics: 'statistics',
  'tensorflow/pytorch': 'tensorflow/pytorch',
  tensorflow: 'tensorflow',
  pytorch: 'pytorch',
  tableau: 'tableau',
  'power bi': 'power bi',
  powerbi: 'power bi',
  'data visualization': 'data visualization',
  nlp: 'nlp',
  'natural language processing': 'nlp',

  // Design
  figma: 'figma',
  'ui/ux': 'ui/ux',
  'ui/ux design': 'ui/ux',
  'design systems': 'design systems',
  'user research': 'user research',
  wireframing: 'wireframing',
  accessibility: 'accessibility',

  // Languages with special characters (Preserved carefully)
  'c++': 'c++',
  cpp: 'c++',
  'c plus plus': 'c++',
  'c#': 'c#',
  csharp: 'c#',
  'c sharp': 'c#',
  '.net': '.net',
  dotnet: '.net',
  'dot net': '.net',
  go: 'go',
  golang: 'go',
  java: 'java',
  c: 'c',

  // Product & Architecture
  'product management': 'product management',
  'agile/scrum': 'agile/scrum',
  agile: 'agile/scrum',
  scrum: 'agile/scrum',
  'data analytics': 'data analytics',
  'roadmap planning': 'roadmap planning',
  'system design': 'system design',
  'cloud architecture': 'cloud architecture',
  security: 'security',
  microservices: 'microservices',
};

// ─── CURATED TECH DICTIONARY FOR JOB DESCRIPTION EXTRACTION ──────────────────
// Each entry specifies the canonical normalized key, display label, and boundary-safe regex pattern.

const TECH_DICTIONARY = [
  { canonical: 'c++', display: 'C++', regex: /(?:^|[^a-zA-Z0-9+#])(c\+\+|cpp|c\s+plus\s+plus)(?=$|[^a-zA-Z0-9+#])/i },
  { canonical: 'c#', display: 'C#', regex: /(?:^|[^a-zA-Z0-9+#])(c#|c\s+sharp)(?=$|[^a-zA-Z0-9+#])/i },
  { canonical: '.net', display: '.NET', regex: /(?:^|[^a-zA-Z0-9+#])(\.net|dotnet|dot\s+net)(?=$|[^a-zA-Z0-9+#])/i },
  { canonical: 'ci/cd', display: 'CI/CD', regex: /(?:^|[^a-zA-Z0-9])(ci\/cd|ci-cd|cicd|continuous\s+integration)(?=$|[^a-zA-Z0-9])/i },
  { canonical: 'javascript', display: 'JavaScript', regex: /(?<!\.)\b(javascript|ecmascript|js)\b/i },
  { canonical: 'typescript', display: 'TypeScript', regex: /(?<!\.)\b(typescript|ts)\b/i },
  { canonical: 'react native', display: 'React Native', regex: /\b(react\s+native)\b/i },
  { canonical: 'react', display: 'React', regex: /\b(react(?:\.js|js)?)\b/i },
  { canonical: 'node.js', display: 'Node.js', regex: /\b(node(?:\.js|js)?)\b/i },
  { canonical: 'next.js', display: 'Next.js', regex: /\b(next(?:\.js|js)?)\b/i },
  { canonical: 'express', display: 'Express', regex: /\b(express(?:\.js|js)?)\b/i },
  { canonical: 'python', display: 'Python', regex: /\b(python)\b/i },
  { canonical: 'fastapi', display: 'FastAPI', regex: /\b(fastapi|fast\s+api)\b/i },
  { canonical: 'django', display: 'Django', regex: /\b(django)\b/i },
  { canonical: 'mongodb', display: 'MongoDB', regex: /\b(mongodb|mongo\s+db)\b/i },
  { canonical: 'postgresql', display: 'PostgreSQL', regex: /\b(postgresql|postgres)\b/i },
  { canonical: 'sql', display: 'SQL', regex: /\b(sql)\b/i },
  { canonical: 'redis', display: 'Redis', regex: /\b(redis)\b/i },
  { canonical: 'kubernetes', display: 'Kubernetes', regex: /\b(kubernetes|k8s)\b/i },
  { canonical: 'docker', display: 'Docker', regex: /\b(docker)\b/i },
  { canonical: 'aws', display: 'AWS', regex: /\b(aws|amazon\s+web\s+services)\b/i },
  { canonical: 'gcp', display: 'GCP', regex: /\b(gcp|google\s+cloud)\b/i },
  { canonical: 'azure', display: 'Azure', regex: /\b(azure)\b/i },
  { canonical: 'terraform', display: 'Terraform', regex: /\b(terraform)\b/i },
  { canonical: 'linux', display: 'Linux', regex: /\b(linux)\b/i },
  { canonical: 'git', display: 'Git', regex: /\b(git|github|gitlab)\b/i },
  { canonical: 'html', display: 'HTML', regex: /\b(html5?)\b/i },
  { canonical: 'css', display: 'CSS', regex: /\b(css3?)\b/i },
  { canonical: 'tailwind css', display: 'Tailwind CSS', regex: /\b(tailwind(?:\s*css)?)\b/i },
  { canonical: 'redux', display: 'Redux', regex: /\b(redux)\b/i },
  { canonical: 'graphql', display: 'GraphQL', regex: /\b(graphql)\b/i },
  { canonical: 'kafka', display: 'Kafka', regex: /\b(kafka)\b/i },
  { canonical: 'rest apis', display: 'REST APIs', regex: /\b(rest(?:ful)?(?:\s+apis?)?)\b/i },
  { canonical: 'jest', display: 'Jest', regex: /\b(jest)\b/i },
  { canonical: 'cypress', display: 'Cypress', regex: /\b(cypress)\b/i },
  { canonical: 'playwright', display: 'Playwright', regex: /\b(playwright)\b/i },
  { canonical: 'spark', display: 'Apache Spark', regex: /\b(spark|apache\s+spark)\b/i },
  { canonical: 'airflow', display: 'Airflow', regex: /\b(airflow|apache\s+airflow)\b/i },
  { canonical: 'machine learning', display: 'Machine Learning', regex: /\b(machine\s+learning|ml)\b/i },
  { canonical: 'tensorflow', display: 'TensorFlow', regex: /\b(tensorflow)\b/i },
  { canonical: 'pytorch', display: 'PyTorch', regex: /\b(pytorch)\b/i },
  { canonical: 'tableau', display: 'Tableau', regex: /\b(tableau)\b/i },
  { canonical: 'power bi', display: 'Power BI', regex: /\b(power\s*bi)\b/i },
  { canonical: 'figma', display: 'Figma', regex: /\b(figma)\b/i },
  { canonical: 'ui/ux', display: 'UI/UX Design', regex: /(?:^|[^a-zA-Z0-9])(ui\/ux(?:\s+design)?|ux\/ui)(?=$|[^a-zA-Z0-9])/i },
  { canonical: 'design systems', display: 'Design Systems', regex: /\b(design\s+systems?)\b/i },
  { canonical: 'accessibility', display: 'Accessibility', regex: /\b(accessibility|a11y)\b/i },
  { canonical: 'java', display: 'Java', regex: /\b(java)\b/i },
  { canonical: 'c', display: 'C', regex: /(?:^|[^a-zA-Z0-9+#])(c)(?=$|[^a-zA-Z0-9+#])/i },
];

// ─── NORMALIZATION FUNCTIONS ─────────────────────────────────────────────────

/**
 * Normalizes a single skill string to a lowercased canonical key.
 * Trims whitespace, strips surrounding punctuation (without stripping internal symbols
 * like in C++, C#, .NET, Node.js), and maps known aliases.
 *
 * @param {*} rawSkill - The skill input to normalize
 * @returns {string} The normalized canonical skill key, or '' if invalid
 */
function normalizeSkill(rawSkill) {
  if (typeof rawSkill !== 'string') return '';

  let trimmed = rawSkill.trim();
  if (!trimmed) return '';

  // Remove surrounding quotes, parentheses, brackets, or commas
  trimmed = trimmed.replace(/^[\s,;:()[\]{}"']+|[\s,;:()[\]{}"']+$/g, '');
  if (!trimmed) return '';

  // Collapse internal whitespace
  const lower = trimmed.toLowerCase().replace(/\s+/g, ' ');

  // Look up in alias map
  if (Object.prototype.hasOwnProperty.call(ALIAS_MAP, lower)) {
    return ALIAS_MAP[lower];
  }

  return lower;
}

/**
 * Normalizes an array of skills, filtering invalid/empty entries and deduplicating.
 *
 * @param {Array} skills - Array of raw skill strings
 * @returns {string[]} Unique normalized skill keys
 */
function normalizeSkills(skills) {
  if (!Array.isArray(skills)) return [];

  const seen = new Set();
  const normalizedList = [];

  for (const s of skills) {
    const norm = normalizeSkill(s);
    if (norm && !seen.has(norm)) {
      seen.add(norm);
      normalizedList.push(norm);
    }
  }

  return normalizedList;
}

// ─── RESUME SKILL EXTRACTION ─────────────────────────────────────────────────

/**
 * Extracts candidate skills from a ResumeBuilder document.
 * Primary source: resume.skills
 * Supplemental source: resume.projects[].technologies (comma/slash separated)
 * Strictly does NOT extract from free-form summary or experience descriptions.
 *
 * @param {Object} resume - ResumeBuilder document or object
 * @returns {string[]} Deduplicated array of human-readable skill names
 */
function extractResumeSkills(resume) {
  if (!resume || typeof resume !== 'object') return [];

  const extractedList = [];
  const seenNormalized = new Set();

  function addSkill(raw) {
    if (typeof raw !== 'string') return;
    const trimmed = raw.trim();
    if (!trimmed) return;
    const norm = normalizeSkill(trimmed);
    if (norm && !seenNormalized.has(norm)) {
      seenNormalized.add(norm);
      extractedList.push(trimmed);
    }
  }

  // 1. Primary: resume.skills
  if (Array.isArray(resume.skills)) {
    for (const skill of resume.skills) {
      addSkill(skill);
    }
  }

  // 2. Supplemental: resume.projects[].technologies
  if (Array.isArray(resume.projects)) {
    for (const project of resume.projects) {
      if (project && typeof project.technologies === 'string') {
        const parts = project.technologies.split(/[,/|]/);
        for (const part of parts) {
          addSkill(part);
        }
      }
    }
  }

  return extractedList;
}

// ─── JOB DESCRIPTION SKILL EXTRACTION ────────────────────────────────────────

const PREFERRED_SECTION_REGEX =
  /^\s*(?:#+\s*)?(?:preferred\s+skills?|nice\s+to\s+have|bonus\s+skills?|good\s+to\s+have|additional\s+skills?|preferred\s+qualifications?|desired\s+skills?|plus(?:es)?|bonus)[\w\s/]*:?\s*$/i;

const RESET_SECTION_REGEX =
  /^\s*(?:#+\s*)?(?:requirements?|required\s+skills?|responsibilities|qualifications?|minimum\s+qualifications?|required\s+qualifications?|what\s+you(?:'ll|\s+will)\s+do|who\s+you\s+are|about\s+the\s+role|what\s+we\s+offer|benefits)[\w\s/]*:?\s*$/i;

/**
 * Extracts recognizable skills from a raw job description using boundary-safe regex matching
 * against the curated technical dictionary. Section headings are detected to partition
 * skills into requiredSkills and preferredSkills.
 *
 * @param {string} jobDescription - Raw pasted job description
 * @returns {Object} { requiredSkills, preferredSkills, extractedSkillsCount, status }
 */
function extractSkillsFromJD(jobDescription) {
  if (!jobDescription || typeof jobDescription !== 'string' || !jobDescription.trim()) {
    return {
      requiredSkills: [],
      preferredSkills: [],
      extractedSkillsCount: 0,
      status: 'no-skills-found',
    };
  }

  const lines = jobDescription.split(/\r?\n/);
  let isPreferredSection = false;

  const requiredFound = new Map(); // norm -> display
  const preferredFound = new Map(); // norm -> display

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Check for section transitions
    if (PREFERRED_SECTION_REGEX.test(line)) {
      isPreferredSection = true;
      continue;
    } else if (RESET_SECTION_REGEX.test(line)) {
      isPreferredSection = false;
      continue;
    }

    // Match skills in line
    for (const entry of TECH_DICTIONARY) {
      if (entry.regex.test(line)) {
        if (isPreferredSection) {
          if (!requiredFound.has(entry.canonical) && !preferredFound.has(entry.canonical)) {
            preferredFound.set(entry.canonical, entry.display);
          }
        } else {
          // If already in preferred, promote to required
          if (preferredFound.has(entry.canonical)) {
            preferredFound.delete(entry.canonical);
          }
          if (!requiredFound.has(entry.canonical)) {
            requiredFound.set(entry.canonical, entry.display);
          }
        }
      }
    }
  }

  const requiredSkills = Array.from(requiredFound.values());
  const preferredSkills = Array.from(preferredFound.values());
  const totalCount = requiredSkills.length + preferredSkills.length;

  return {
    requiredSkills,
    preferredSkills,
    extractedSkillsCount: totalCount,
    status: totalCount > 0 ? 'success' : 'no-skills-found',
  };
}

// ─── EXPERIENCE COMPATIBILITY ────────────────────────────────────────────────

/**
 * Calculates conservative informational experience compatibility.
 * Strictly does NOT penalize or alter the numeric skill match percentage.
 *
 * @param {Object} resume - ResumeBuilder document
 * @param {Object} job - Job document
 * @returns {Object} { status, requiredLevel, requiredMinYears, estimatedYears, note }
 */
function calculateExperienceCompatibility(resume, job) {
  const jobExp = job?.experience || {};
  const requiredLevel = jobExp.level || 'mid';
  const requiredMinYears = typeof jobExp.min === 'number' ? jobExp.min : 0;

  if (!resume || !Array.isArray(resume.experience) || resume.experience.length === 0) {
    return {
      status: 'unknown',
      requiredLevel,
      requiredMinYears,
      estimatedYears: null,
      note: 'No experience entries found in resume; compatibility cannot be determined.',
    };
  }

  // Attempt to parse start and end years conservatively
  let totalMonths = 0;
  let parsableEntries = 0;

  for (const exp of resume.experience) {
    if (!exp) continue;
    const startStr = exp.startDate ? String(exp.startDate).trim() : '';
    const endStr = exp.current ? 'current' : exp.endDate ? String(exp.endDate).trim() : '';

    if (!startStr) continue;

    const startYearMatch = startStr.match(/\b(19\d\d|20\d\d)\b/);
    if (!startYearMatch) continue;

    const startYear = parseInt(startYearMatch[1], 10);
    let endYear = new Date().getFullYear();

    if (endStr && endStr.toLowerCase() !== 'current' && endStr.toLowerCase() !== 'present') {
      const endYearMatch = endStr.match(/\b(19\d\d|20\d\d)\b/);
      if (endYearMatch) {
        endYear = parseInt(endYearMatch[1], 10);
      }
    }

    if (endYear >= startYear) {
      const diffYears = endYear - startYear;
      totalMonths += Math.max(12, diffYears * 12);
      parsableEntries++;
    }
  }

  if (parsableEntries === 0) {
    return {
      status: 'unknown',
      requiredLevel,
      requiredMinYears,
      estimatedYears: null,
      note: 'Experience dates could not be reliably parsed; compatibility cannot be determined.',
    };
  }

  const estimatedYears = Math.round((totalMonths / 12) * 10) / 10;

  let status = 'match';
  let note = 'Estimated experience meets or exceeds job requirements.';

  if (estimatedYears < requiredMinYears * 0.7) {
    status = 'below';
    note = `Estimated experience (${estimatedYears} yrs) is below required ${requiredMinYears} yrs.`;
  } else if (estimatedYears < requiredMinYears) {
    status = 'partial';
    note = `Estimated experience (${estimatedYears} yrs) is close to required ${requiredMinYears} yrs.`;
  }

  return {
    status,
    requiredLevel,
    requiredMinYears,
    estimatedYears,
    note,
  };
}

// ─── CORE MATCHING ENGINE ────────────────────────────────────────────────────

/**
 * Calculates the deterministic matching score and skill breakdown between a candidate resume
 * and job requirements using the approved formula:
 * MatchPercentage = round(0.85 * RequiredScore + 0.15 * PreferredScore)
 *
 * @param {Object} resume - ResumeBuilder object or document
 * @param {Object} job - Job object or extracted requirements
 * @returns {Object} Detailed explainable matching result
 */
function calculateJobMatch(resume, job) {
  // Handle empty or invalid job safely
  if (!job || typeof job !== 'object') {
    return {
      matchPercentage: 0,
      matchedRequiredSkills: [],
      missingRequiredSkills: [],
      matchedPreferredSkills: [],
      missingPreferredSkills: [],
      partialSkills: [],
      breakdown: {
        requiredWeight: 85,
        preferredWeight: 15,
        requiredScore: 0,
        preferredScore: 0,
        matchedRequiredCount: 0,
        totalRequiredCount: 0,
        matchedPreferredCount: 0,
        totalPreferredCount: 0,
      },
      experienceCompatibility: {
        status: 'unknown',
        requiredLevel: 'mid',
        requiredMinYears: 0,
        note: 'Invalid or missing job specifications.',
      },
      status: 'insufficient-job-skills',
    };
  }

  // 1. Extract and normalize candidate skills
  const candidateRawSkills = extractResumeSkills(resume);
  const candidateNormSet = new Set(normalizeSkills(candidateRawSkills));

  // 2. Normalize and deduplicate job required skills
  const rawReq = Array.isArray(job.requiredSkills) ? job.requiredSkills : [];
  const reqMap = new Map(); // norm -> original display label

  for (const s of rawReq) {
    if (typeof s !== 'string') continue;
    const trimmed = s.trim();
    const norm = normalizeSkill(trimmed);
    if (norm && !reqMap.has(norm)) {
      reqMap.set(norm, trimmed);
    }
  }

  // 3. Normalize and deduplicate job preferred skills (excluding any already in required)
  const rawPref = Array.isArray(job.preferredSkills) ? job.preferredSkills : [];
  const prefMap = new Map(); // norm -> original display label

  for (const s of rawPref) {
    if (typeof s !== 'string') continue;
    const trimmed = s.trim();
    const norm = normalizeSkill(trimmed);
    if (norm && !reqMap.has(norm) && !prefMap.has(norm)) {
      prefMap.set(norm, trimmed);
    }
  }

  const totalRequired = reqMap.size;
  const totalPreferred = prefMap.size;

  // Experience compatibility evaluation (independent indicator)
  const experienceCompatibility = calculateExperienceCompatibility(resume, job);

  // Edge case: Job has zero requirements
  if (totalRequired === 0 && totalPreferred === 0) {
    return {
      matchPercentage: 0,
      matchedRequiredSkills: [],
      missingRequiredSkills: [],
      matchedPreferredSkills: [],
      missingPreferredSkills: [],
      partialSkills: [],
      breakdown: {
        requiredWeight: 85,
        preferredWeight: 15,
        requiredScore: 0,
        preferredScore: 0,
        matchedRequiredCount: 0,
        totalRequiredCount: 0,
        matchedPreferredCount: 0,
        totalPreferredCount: 0,
      },
      experienceCompatibility,
      status: 'insufficient-job-skills',
    };
  }

  // 4. Calculate matches and missing skills
  const matchedRequiredSkills = [];
  const missingRequiredSkills = [];

  for (const [norm, display] of reqMap.entries()) {
    if (candidateNormSet.has(norm)) {
      matchedRequiredSkills.push(display);
    } else {
      missingRequiredSkills.push(display);
    }
  }

  const matchedPreferredSkills = [];
  const missingPreferredSkills = [];

  for (const [norm, display] of prefMap.entries()) {
    if (candidateNormSet.has(norm)) {
      matchedPreferredSkills.push(display);
    } else {
      missingPreferredSkills.push(display);
    }
  }

  // 5. Calculate scores based on weights
  const matchedRequiredCount = matchedRequiredSkills.length;
  const matchedPreferredCount = matchedPreferredSkills.length;

  const requiredScore = totalRequired > 0 ? (matchedRequiredCount / totalRequired) * 100 : 0;
  const preferredScore = totalPreferred > 0 ? (matchedPreferredCount / totalPreferred) * 100 : 0;

  let requiredWeight = 85;
  let preferredWeight = 15;
  let rawScore = 0;

  if (totalRequired > 0 && totalPreferred > 0) {
    requiredWeight = 85;
    preferredWeight = 15;
    rawScore = 0.85 * requiredScore + 0.15 * preferredScore;
  } else if (totalRequired > 0) {
    requiredWeight = 100;
    preferredWeight = 0;
    rawScore = requiredScore;
  } else {
    // Only preferred skills exist
    requiredWeight = 0;
    preferredWeight = 100;
    rawScore = preferredScore;
  }

  const matchPercentage = Math.min(100, Math.max(0, Math.round(rawScore)));

  return {
    matchPercentage,
    matchedRequiredSkills,
    missingRequiredSkills,
    matchedPreferredSkills,
    missingPreferredSkills,
    partialSkills: [], // Reserved for future compatibility mappings
    breakdown: {
      requiredWeight,
      preferredWeight,
      requiredScore: Math.round(requiredScore * 10) / 10,
      preferredScore: Math.round(preferredScore * 10) / 10,
      matchedRequiredCount,
      totalRequiredCount: totalRequired,
      matchedPreferredCount,
      totalPreferredCount: totalPreferred,
    },
    experienceCompatibility,
    status: 'success',
  };
}

module.exports = {
  normalizeSkill,
  normalizeSkills,
  extractResumeSkills,
  extractSkillsFromJD,
  calculateExperienceCompatibility,
  calculateJobMatch,
  ALIAS_MAP,
  TECH_DICTIONARY,
};
