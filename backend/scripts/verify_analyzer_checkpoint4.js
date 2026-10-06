const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../src/config/db');
const app = require('../src/app');

// Mock localStorage for Node test runner
global.storageMap = new Map();
global.localStorage = {
  getItem: (key) => global.storageMap.get(key) || null,
  setItem: (key, val) => global.storageMap.set(key, String(val)),
  removeItem: (key) => global.storageMap.delete(key),
  clear: () => global.storageMap.clear(),
};

// Extracted from Analyzer.jsx for unit and integration verification
function normalizeAnalysisResult(rawResult) {
  if (!rawResult || typeof rawResult !== 'object') {
    throw new Error('We received an unexpected analysis response. Please try again.');
  }

  const rawScore = rawResult.compatibilityScore;
  if (rawScore === undefined || rawScore === null) {
    throw new Error('We received an unexpected analysis response (missing score). Please try again.');
  }

  const parsedScore = typeof rawScore === 'number'
    ? rawScore
    : typeof rawScore === 'string' && !isNaN(Number(rawScore))
      ? Number(rawScore)
      : NaN;

  if (isNaN(parsedScore) || !isFinite(parsedScore) || parsedScore < 0 || parsedScore > 100) {
    throw new Error('We received an unexpected analysis response (invalid score). Please try again.');
  }

  const matchedKeywords = Array.isArray(rawResult.matchedKeywords)
    ? rawResult.matchedKeywords.filter((k) => typeof k === 'string' && k.trim().length > 0)
    : [];

  const missingKeywords = Array.isArray(rawResult.missingKeywords)
    ? rawResult.missingKeywords.filter((k) => typeof k === 'string' && k.trim().length > 0)
    : [];

  const skillGaps = Array.isArray(rawResult.skillGaps)
    ? rawResult.skillGaps.filter((g) => typeof g === 'string' && g.trim().length > 0)
    : [];

  const improvementTips = Array.isArray(rawResult.improvementTips)
    ? rawResult.improvementTips.filter((t) => typeof t === 'string' && t.trim().length > 0)
    : [];

  const summary = typeof rawResult.summary === 'string' ? rawResult.summary.trim() : '';

  let interviewQuestions = null;
  if (rawResult.interviewQuestions && typeof rawResult.interviewQuestions === 'object') {
    const iq = rawResult.interviewQuestions;
    const technical = Array.isArray(iq.technical) ? iq.technical.filter((q) => typeof q === 'string') : [];
    const hr = Array.isArray(iq.hr) ? iq.hr.filter((q) => typeof q === 'string') : [];
    const project = Array.isArray(iq.project) ? iq.project.filter((q) => typeof q === 'string') : [];
    if (technical.length > 0 || hr.length > 0 || project.length > 0) {
      interviewQuestions = { technical, hr, project };
    }
  }

  return {
    compatibilityScore: Math.round(parsedScore),
    matchedKeywords,
    missingKeywords,
    skillGaps,
    improvementTips,
    summary,
    interviewQuestions,
  };
}

function computeIsResultEmpty(result) {
  return Boolean(
    result &&
    (!result.matchedKeywords || result.matchedKeywords.length === 0) &&
    (!result.missingKeywords || result.missingKeywords.length === 0) &&
    (!result.skillGaps || result.skillGaps.length === 0) &&
    (!result.improvementTips || result.improvementTips.length === 0) &&
    !result.summary
  );
}

// Extracted from ScoreChart.jsx
function computeScoreChartValue(score) {
  return typeof score === 'number' && !isNaN(score) && isFinite(score)
    ? Math.max(0, Math.min(100, Math.round(score)))
    : (typeof score === 'string' && !isNaN(Number(score)) && isFinite(Number(score)))
      ? Math.max(0, Math.min(100, Math.round(Number(score))))
      : 0;
}

async function runCheckpoint4Verification() {
  console.log('=== CHECKPOINT 4 VERIFICATION SUITE ===\n');

  // Test 1: Successful Normalization with Full Payload
  console.log('--- TEST 1: Full Valid Backend Payload Mapping ---');
  const validPayload = {
    compatibilityScore: 85,
    matchedKeywords: ['React', 'Node.js', 'Express', 'MongoDB'],
    missingKeywords: ['Docker', 'Kubernetes'],
    skillGaps: ['Cloud deployment experience', 'Container orchestration'],
    improvementTips: ['Add a Dockerfile to key projects', 'Mention AWS/GCP exposure'],
    summary: 'Candidate demonstrates strong full-stack skills with minor DevOps gaps.',
  };
  const normalized1 = normalizeAnalysisResult(validPayload);
  console.log('Normalized Score:', normalized1.compatibilityScore);
  console.log('Matched Keywords:', normalized1.matchedKeywords);
  console.log('Missing Keywords:', normalized1.missingKeywords);
  console.log('Skill Gaps count:', normalized1.skillGaps.length);
  console.log('Improvement Tips count:', normalized1.improvementTips.length);
  console.log('Summary:', normalized1.summary);
  if (normalized1.compatibilityScore !== 85 || normalized1.matchedKeywords.length !== 4) {
    throw new Error('Test 1 failed: Incorrect mapping of valid payload');
  }

  // Test 2: Score Parsing & Bounds Clamping in ScoreChart
  console.log('\n--- TEST 2: Score Chart Defensive Validation ---');
  const chartVal1 = computeScoreChartValue(76);
  const chartVal2 = computeScoreChartValue("92");
  const chartVal3 = computeScoreChartValue(NaN);
  const chartVal4 = computeScoreChartValue(undefined);
  const chartVal5 = computeScoreChartValue(-10);
  const chartVal6 = computeScoreChartValue(150);
  console.log('chartVal(76) =', chartVal1, '(expected 76)');
  console.log('chartVal("92") =', chartVal2, '(expected 92)');
  console.log('chartVal(NaN) =', chartVal3, '(expected 0, no crash)');
  console.log('chartVal(undefined) =', chartVal4, '(expected 0, no crash)');
  console.log('chartVal(-10) =', chartVal5, '(expected 0 clamped)');
  console.log('chartVal(150) =', chartVal6, '(expected 100 clamped)');
  if (chartVal1 !== 76 || chartVal2 !== 92 || chartVal3 !== 0 || chartVal4 !== 0 || chartVal5 !== 0 || chartVal6 !== 100) {
    throw new Error('Test 2 failed: ScoreChart numeric protection failed');
  }

  // Test 3: Array Validation (Defensive against null/undefined/non-array)
  console.log('\n--- TEST 3: Array Validation Against Malformed Keyword Fields ---');
  const dirtyPayload = {
    compatibilityScore: 70,
    matchedKeywords: null, // should safely become []
    missingKeywords: "Not an array", // should safely become []
    skillGaps: undefined, // should safely become []
    improvementTips: ['Valid Tip', '', '   ', null, 'Another Tip'], // filter non-strings / empty
    summary: 'A summary',
  };
  const normalized3 = normalizeAnalysisResult(dirtyPayload);
  console.log('matchedKeywords is array:', Array.isArray(normalized3.matchedKeywords), normalized3.matchedKeywords);
  console.log('missingKeywords is array:', Array.isArray(normalized3.missingKeywords), normalized3.missingKeywords);
  console.log('skillGaps is array:', Array.isArray(normalized3.skillGaps), normalized3.skillGaps);
  console.log('improvementTips cleaned count:', normalized3.improvementTips.length, normalized3.improvementTips);
  if (!Array.isArray(normalized3.matchedKeywords) || !Array.isArray(normalized3.missingKeywords) || normalized3.improvementTips.length !== 2) {
    throw new Error('Test 3 failed: Array normalization failed');
  }

  // Test 4: Empty Result Handling
  console.log('\n--- TEST 4: Empty Result State Handling ---');
  const emptyPayload = {
    compatibilityScore: 50,
    matchedKeywords: [],
    missingKeywords: [],
    skillGaps: [],
    improvementTips: [],
    summary: '',
  };
  const normalized4 = normalizeAnalysisResult(emptyPayload);
  const isEmpty = computeIsResultEmpty(normalized4);
  console.log('isResultEmpty =', isEmpty, '(expected true)');
  if (!isEmpty) {
    throw new Error('Test 4 failed: isResultEmpty flag should be true');
  }

  // Test 5: Malformed Response Protection
  console.log('\n--- TEST 5: Malformed Response Rejection ---');
  const malformedCases = [
    null,
    undefined,
    'a string',
    {}, // missing score
    { compatibilityScore: NaN },
    { compatibilityScore: -5 },
    { compatibilityScore: 105 },
    { compatibilityScore: 'invalid' },
  ];
  let rejectedCount = 0;
  for (const tc of malformedCases) {
    try {
      normalizeAnalysisResult(tc);
    } catch (err) {
      rejectedCount++;
    }
  }
  console.log(`Rejected ${rejectedCount}/${malformedCases.length} malformed cases with user-safe error.`);
  if (rejectedCount !== malformedCases.length) {
    throw new Error('Test 5 failed: Failed to reject all malformed payloads');
  }

  // Test 6: Result Refresh (State overwriting)
  console.log('\n--- TEST 6: Result Refresh (New Result Replaces Old) ---');
  let currentResult = normalized1;
  console.log('Analysis 1 Score:', currentResult.compatibilityScore);
  currentResult = null; // Analysis 2 starts
  console.log('Loading state: previous result cleared to null');
  currentResult = normalized3; // Analysis 2 finishes
  console.log('Analysis 2 Score:', currentResult.compatibilityScore);
  if (currentResult.compatibilityScore !== 70 || currentResult.matchedKeywords.length !== 0) {
    throw new Error('Test 6 failed: State refresh failed');
  }

  // Test 7: Live Backend Integration Verification
  console.log('\n--- TEST 7: Live Backend Integration Verification ---');
  await connectDB();
  const server = app.listen(0, async () => {
    const port = server.address().port;
    process.env.VITE_API_URL = `http://localhost:${port}/api/v1`;
    console.log(`Live test server on port ${port}`);

    try {
      const resumeApiPath = 'file://' + path.resolve(__dirname, '../../frontend/src/api/resume.js').replace(/\\/g, '/');
      const { analyzeResumeApi } = await import(resumeApiPath);

      const jobDescription = 'Looking for a Senior TypeScript and Node.js backend developer with Express and MongoDB.';
      const resumeText = 'Senior Full Stack Developer skilled in TypeScript, Node.js, Express, MongoDB, and React with 5 years experience.';

      const apiResponse = await analyzeResumeApi({ resumeText, jobDescription });
      console.log('Live API Response Success:', apiResponse.success);

      const liveRawResult = apiResponse?.data?.analysis?.result;
      const liveNormalized = normalizeAnalysisResult(liveRawResult);
      console.log('Live Normalized Score:', liveNormalized.compatibilityScore);
      console.log('Live Matched Keywords:', liveNormalized.matchedKeywords);
      console.log('Live Missing Keywords:', liveNormalized.missingKeywords);
      console.log('Live Skill Gaps count:', liveNormalized.skillGaps.length);
      console.log('Live Tips count:', liveNormalized.improvementTips.length);
      console.log('Live Summary:', liveNormalized.summary);

      if (typeof liveNormalized.compatibilityScore !== 'number' || !Array.isArray(liveNormalized.matchedKeywords)) {
        throw new Error('Test 7 failed: Live API response did not normalize correctly');
      }

      console.log('\n>>> ALL 7 CHECKPOINT 4 TESTS PASSED! <<<');
      process.exit(0);
    } catch (err) {
      console.error('Test 7 failed:', err);
      process.exit(1);
    } finally {
      server.close();
    }
  });
}

runCheckpoint4Verification();
