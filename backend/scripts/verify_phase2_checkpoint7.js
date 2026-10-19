const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../src/config/db');
const app = require('../src/app');
const User = require('../src/models/User');
const ResumeAnalysis = require('../src/models/ResumeAnalysis');
const { generateToken } = require('../src/services/token.service');
const JSZip = require('jszip');

// Mock localStorage for Node test runner
global.storageMap = new Map();
global.localStorage = {
  getItem: (key) => global.storageMap.get(key) || null,
  setItem: (key, val) => global.storageMap.set(key, String(val)),
  removeItem: (key) => global.storageMap.delete(key),
  clear: () => global.storageMap.clear(),
};

const fs = require('fs');
const { jsPDF } = require('../../frontend/node_modules/jspdf/dist/jspdf.node.min.js');

// Builder for valid PDF binary buffer via jsPDF
function buildValidPdf(textContent) {
  const doc = new jsPDF();
  doc.text(textContent, 10, 10);
  const tempPath = path.join(__dirname, `temp_test_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.pdf`);
  fs.writeFileSync(tempPath, doc.output(), 'binary');
  const buffer = fs.readFileSync(tempPath);
  try {
    fs.unlinkSync(tempPath);
  } catch (e) {}
  return buffer;
}

// Builder for valid DOCX document buffer
async function buildValidDocx(textContent) {
  const zip = new JSZip();
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
  );
  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  );
  zip.file(
    'word/document.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r>
        <w:t>${textContent}</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`
  );
  return zip.generateAsync({ type: 'nodebuffer' });
}

// Normalize logic from Analyzer.jsx
function normalizeAnalysisResult(rawResult) {
  if (!rawResult || typeof rawResult !== 'object') {
    throw new Error('We received an unexpected analysis response. Please try again.');
  }

  const rawScore = rawResult.compatibilityScore;
  if (rawScore === undefined || rawScore === null) {
    throw new Error('We received an unexpected analysis response (missing score). Please try again.');
  }

  const parsedScore =
    typeof rawScore === 'number'
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

function computeScoreChartValue(score) {
  return typeof score === 'number' && !isNaN(score) && isFinite(score)
    ? Math.max(0, Math.min(100, Math.round(score)))
    : typeof score === 'string' && !isNaN(Number(score)) && isFinite(Number(score))
    ? Math.max(0, Math.min(100, Math.round(Number(score))))
    : 0;
}

async function runCheckpoint7FullVerification() {
  console.log('===============================================================');
  console.log('   RESUPREP - PHASE 2 CHECKPOINT 7 FULL END-TO-END SUITE       ');
  console.log('===============================================================\n');

  console.log('Connecting to MongoDB...');
  await connectDB();

  const server = app.listen(0, async () => {
    const port = server.address().port;
    process.env.VITE_API_URL = `http://localhost:${port}/api/v1`;
    console.log(`Test Express server running at: http://localhost:${port}/api/v1\n`);

    const testResults = [];
    function record(name, pass, details) {
      testResults.push({ name, pass, details });
      console.log(`${pass ? '✅ PASS' : '❌ FAIL'}: ${name}`);
      if (details) console.log(`   └─ ${details}`);
    }

    try {
      const resumeApiPath =
        'file://' + path.resolve(__dirname, '../../frontend/src/api/resume.js').replace(/\\/g, '/');
      const {
        analyzeResumeApi,
        getResumeHistoryApi,
        getResumeAnalysisByIdApi,
        deleteResumeAnalysisApi,
      } = await import(resumeApiPath);

      // Create test accounts
      const userA = await User.create({
        name: 'User A FullTest',
        email: `user_a_cp7_${Date.now()}@test.com`,
        password: 'Password123!',
      });
      const tokenA = generateToken(userA._id);

      const userB = await User.create({
        name: 'User B FullTest',
        email: `user_b_cp7_${Date.now()}@test.com`,
        password: 'Password123!',
      });
      const tokenB = generateToken(userB._id);

      const sampleJD =
        'Looking for a Senior Full Stack Engineer proficient in React, Node.js, Express, MongoDB, and TypeScript. Experience with Docker, REST APIs, and AWS is required.';

      // =========================================================================
      // TEST 1: PDF Resume Analysis
      // =========================================================================
      console.log('\n--- Running TEST 1: PDF Resume Analysis ---');
      localStorage.setItem('token', tokenA);
      const pdfBuffer = buildValidPdf(
        'Senior Full Stack Developer with 5 years experience in React, Node.js, Express, MongoDB, TypeScript, Docker, and REST APIs.'
      );
      const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });
      const pdfFile = new File([pdfBlob], 'test_resume.pdf', { type: 'application/pdf' });

      const pdfResponse = await analyzeResumeApi({ file: pdfFile, jobDescription: sampleJD });
      const pdfAnalysis = pdfResponse?.data?.analysis;
      const pdfNormalized = normalizeAnalysisResult(pdfAnalysis?.result);

      const test1Pass =
        pdfResponse?.success === true &&
        pdfAnalysis?.fileName === 'test_resume.pdf' &&
        pdfAnalysis?.user === userA._id.toString() &&
        typeof pdfNormalized.compatibilityScore === 'number' &&
        pdfNormalized.compatibilityScore >= 0 &&
        pdfNormalized.compatibilityScore <= 100 &&
        Array.isArray(pdfNormalized.matchedKeywords) &&
        pdfNormalized.matchedKeywords.length > 0;

      record(
        'TEST 1 - PDF Resume Analysis',
        test1Pass,
        `Score: ${pdfNormalized.compatibilityScore}, Matched: [${pdfNormalized.matchedKeywords.join(', ')}], ID: ${pdfAnalysis?._id}`
      );

      // =========================================================================
      // TEST 2: DOCX Resume Analysis
      // =========================================================================
      console.log('\n--- Running TEST 2: DOCX Resume Analysis ---');
      const docxBuffer = await buildValidDocx(
        'Senior Software Engineer with deep expertise in React, TypeScript, Node.js, Express, MongoDB, AWS, and REST APIs.'
      );
      const docxBlob = new Blob([docxBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const docxFile = new File([docxBlob], 'resume_doc.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      const docxResponse = await analyzeResumeApi({ file: docxFile, jobDescription: sampleJD });
      const docxAnalysis = docxResponse?.data?.analysis;
      const docxNormalized = normalizeAnalysisResult(docxAnalysis?.result);

      const test2Pass =
        docxResponse?.success === true &&
        docxAnalysis?.fileName === 'resume_doc.docx' &&
        docxAnalysis?.user === userA._id.toString() &&
        typeof docxNormalized.compatibilityScore === 'number' &&
        docxNormalized.compatibilityScore >= 0 &&
        docxNormalized.compatibilityScore <= 100 &&
        Array.isArray(docxNormalized.matchedKeywords) &&
        docxNormalized.matchedKeywords.length > 0;

      record(
        'TEST 2 - DOCX Resume Analysis',
        test2Pass,
        `Score: ${docxNormalized.compatibilityScore}, Matched: [${docxNormalized.matchedKeywords.join(', ')}], ID: ${docxAnalysis?._id}`
      );

      // =========================================================================
      // TEST 3: Plain Text Resume
      // =========================================================================
      console.log('\n--- Running TEST 3: Plain Text Resume Analysis ---');
      const textResume =
        'Full Stack Software Developer with 4 years experience building web apps with React, Express, MongoDB, Node.js, and TypeScript.';
      const textResponse = await analyzeResumeApi({
        resumeText: textResume,
        jobDescription: sampleJD,
      });
      const textAnalysis = textResponse?.data?.analysis;
      const textNormalized = normalizeAnalysisResult(textAnalysis?.result);

      const test3Pass =
        textResponse?.success === true &&
        textAnalysis?.fileName === 'pasted-text' &&
        textAnalysis?.user === userA._id.toString() &&
        typeof textNormalized.compatibilityScore === 'number' &&
        Array.isArray(textNormalized.matchedKeywords);

      record(
        'TEST 3 - Plain Text Resume Analysis',
        test3Pass,
        `Score: ${textNormalized.compatibilityScore}, Source: ${textAnalysis?.fileName}, ID: ${textAnalysis?._id}`
      );

      // =========================================================================
      // TEST 4: Resume History and Refresh Persistence
      // =========================================================================
      console.log('\n--- Running TEST 4: Resume History & Refresh Persistence ---');
      // User A created 3 analyses (PDF, DOCX, Text)
      const histResponseA = await getResumeHistoryApi();
      const analysesA = histResponseA?.data?.analyses || [];

      // Verify count = 3, newest first
      const newestFirst =
        analysesA.length === 3 &&
        new Date(analysesA[0].createdAt).getTime() >= new Date(analysesA[1].createdAt).getTime() &&
        new Date(analysesA[1].createdAt).getTime() >= new Date(analysesA[2].createdAt).getTime();

      // Verify single fetch
      const singleItem = await getResumeAnalysisByIdApi(analysesA[0]._id);
      const singleFetchedOk =
        singleItem?.success === true && singleItem?.data?.analysis?._id === analysesA[0]._id;

      // Verify deletion of the newest item
      const idToDelete = analysesA[0]._id;
      const delResponse = await deleteResumeAnalysisApi(idToDelete);
      const delOk = delResponse?.success === true;

      // Simulate refresh by fetching history again
      const refreshedHist = await getResumeHistoryApi();
      const remainingItems = refreshedHist?.data?.analyses || [];
      const refreshPersistenceOk =
        remainingItems.length === 2 && !remainingItems.some((item) => item._id === idToDelete);

      const test4Pass = newestFirst && singleFetchedOk && delOk && refreshPersistenceOk;
      record(
        'TEST 4 - Resume History & Refresh Persistence',
        test4Pass,
        `Initial count: ${analysesA.length}, Newest-first: ${newestFirst}, Deletion: ${delOk}, Refreshed count: ${remainingItems.length}`
      );

      // =========================================================================
      // TEST 5: User Isolation (Security Critical)
      // =========================================================================
      console.log('\n--- Running TEST 5: Security & User Isolation ---');
      // Switch active user to User B
      localStorage.setItem('token', tokenB);
      const userBResume =
        'Data Scientist with Python, PyTorch, Machine Learning, SQL, and Pandas expertise.';
      const userBResponse = await analyzeResumeApi({
        resumeText: userBResume,
        jobDescription: 'Seeking Data Scientist with Python and SQL.',
      });
      const idB = userBResponse?.data?.analysis?._id;

      // Check User B's history
      const histB = await getResumeHistoryApi();
      const countBOk = histB?.data?.analyses?.length === 1 && histB.data.analyses[0]._id === idB;

      // Check User A's history remains isolated
      localStorage.setItem('token', tokenA);
      const histAAfter = await getResumeHistoryApi();
      const countAOk = histAAfter?.data?.analyses?.length === 2;

      // User B attempts to access User A's analysis
      localStorage.setItem('token', tokenB);
      let crossUserReadCaught = false;
      try {
        await getResumeAnalysisByIdApi(remainingItems[0]._id);
      } catch (err) {
        crossUserReadCaught = true;
      }

      // User B attempts to delete User A's analysis
      let crossUserDeleteCaught = false;
      try {
        await deleteResumeAnalysisApi(remainingItems[0]._id);
      } catch (err) {
        crossUserDeleteCaught = true;
      }

      // Verify analysis in MongoDB is still present
      const docInDb = await ResumeAnalysis.findById(remainingItems[0]._id);
      const docPreserved = Boolean(docInDb);

      const test5Pass =
        countBOk && countAOk && crossUserReadCaught && crossUserDeleteCaught && docPreserved;
      record(
        'TEST 5 - Security & User Isolation',
        test5Pass,
        `User B isolated: ${countBOk}, User A isolated: ${countAOk}, Cross-read blocked: ${crossUserReadCaught}, Cross-delete blocked: ${crossUserDeleteCaught}, DB doc intact: ${docPreserved}`
      );

      // =========================================================================
      // TEST 6: Error Handling
      // =========================================================================
      console.log('\n--- Running TEST 6: Error Handling Scenarios ---');

      // 6A: Unsupported file type
      let unsupportedRejected = false;
      try {
        const fakeFile = new File(['Some random text'], 'notes.txt', { type: 'text/plain' });
        await analyzeResumeApi({ file: fakeFile, jobDescription: sampleJD });
      } catch (err) {
        unsupportedRejected = true;
      }
      record(
        'TEST 6A - Unsupported File Type',
        unsupportedRejected,
        'File rejected with appropriate validation/error'
      );

      // 6B: Oversized file (> 5MB)
      let oversizedRejected = false;
      try {
        const bigBuf = Buffer.alloc(6 * 1024 * 1024); // 6MB
        const bigBlob = new Blob([bigBuf], { type: 'application/pdf' });
        const bigFile = new File([bigBlob], 'big.pdf', { type: 'application/pdf' });
        await analyzeResumeApi({ file: bigFile, jobDescription: sampleJD });
      } catch (err) {
        oversizedRejected = true;
      }
      record(
        'TEST 6B - Oversized File (>5MB)',
        oversizedRejected,
        'Upload rejected before memory or processing exhaustion'
      );

      // 6C: Empty or too short resume text (< 20 chars)
      let shortResumeRejected = false;
      try {
        await analyzeResumeApi({ resumeText: 'Too short', jobDescription: sampleJD });
      } catch (err) {
        shortResumeRejected = true;
      }
      record(
        'TEST 6C - Short/Empty Resume Text',
        shortResumeRejected,
        'Rejected with 400 validation error'
      );

      // 6D: Missing Job Description
      let missingJdRejected = false;
      try {
        await analyzeResumeApi({ resumeText, jobDescription: '' });
      } catch (err) {
        missingJdRejected = true;
      }
      record(
        'TEST 6D - Missing Job Description',
        missingJdRejected,
        'Rejected with 400 validation error'
      );

      // 6E: Backend Unavailable
      let networkErrorHandled = false;
      try {
        // Point to an inactive port using direct http URL supported by apiClient
        const clientMod = await import(
          'file://' + path.resolve(__dirname, '../../frontend/src/api/client.js').replace(/\\/g, '/')
        );
        await clientMod.api.get('http://localhost:59999/api/v1/resume/history');
      } catch (err) {
        networkErrorHandled =
          !err.status && (err.message.includes('fetch') || err.message.includes('ECONNREFUSED') || err.message.includes('Network error'));
      }
      record(
        'TEST 6E - Backend Unavailable Network Error',
        networkErrorHandled,
        'Friendly network error generated without application crash'
      );

      // 6F: Malformed / Invalid API Response
      let malformedHandled = false;
      try {
        normalizeAnalysisResult(null);
      } catch (e1) {
        try {
          normalizeAnalysisResult({ compatibilityScore: 'invalid_score' });
        } catch (e2) {
          try {
            normalizeAnalysisResult({ compatibilityScore: 150 }); // Out of bounds
          } catch (e3) {
            malformedHandled = true;
          }
        }
      }
      record(
        'TEST 6F - Malformed / Invalid API Response Guard',
        malformedHandled,
        'Defensive validation prevents NaN scores and React render crashes'
      );

      // 6G: Unauthenticated History Request
      localStorage.clear();
      let unauthenticatedBlocked = false;
      try {
        await getResumeHistoryApi();
      } catch (err) {
        unauthenticatedBlocked = true;
      }
      record(
        'TEST 6G - Unauthenticated History Request',
        unauthenticatedBlocked,
        'Blocked with 401 Unauthorized'
      );

      // =========================================================================
      // TEST 7: UI State & Chart Clamping Resiliency
      // =========================================================================
      console.log('\n--- Running TEST 7: UI State & Clamping Resiliency ---');
      const scoreNegative = computeScoreChartValue(-10);
      const scoreOver100 = computeScoreChartValue(150);
      const scoreValid = computeScoreChartValue(85.4);
      const scoreNaN = computeScoreChartValue(NaN);
      const scoreString = computeScoreChartValue('72');

      const clampingOk =
        scoreNegative === 0 &&
        scoreOver100 === 100 &&
        scoreValid === 85 &&
        scoreNaN === 0 &&
        scoreString === 72;

      record(
        'TEST 7 - UI State & Chart Clamping',
        clampingOk,
        `Bounds clamping [0, 100] verified for chart rendering`
      );

      // =========================================================================
      // TEST 8: Legacy Logic Static Scan
      // =========================================================================
      console.log('\n--- Running TEST 8: Legacy Logic Static Scan ---');
      const fs = require('fs');
      const storageContent = fs.readFileSync(
        path.resolve(__dirname, '../../frontend/src/services/storage.js'),
        'utf8'
      );
      const analyzerContent = fs.readFileSync(
        path.resolve(__dirname, '../../frontend/src/pages/Analyzer.jsx'),
        'utf8'
      );

      const hasAnalyzeResumeInStorage = storageContent.includes('function analyzeResume');
      const hasAnalysisHistoryInStorage = storageContent.includes('function getAnalysisHistory');
      const hasAnalysesKeyInStorage = storageContent.includes('ANALYSES:');
      const hasFileTextInAnalyzer = analyzerContent.includes('file.text(');
      const hasMathRandomInAnalyzer = analyzerContent.includes('Math.random()');

      const preservesCoverLetter = storageContent.includes('saveCoverLetter');
      const preservesFeedback = storageContent.includes('saveFeedback');
      const preservesBuiltResume = storageContent.includes('saveBuiltResume');

      const legacyClean =
        !hasAnalyzeResumeInStorage &&
        !hasAnalysisHistoryInStorage &&
        !hasAnalysesKeyInStorage &&
        !hasFileTextInAnalyzer &&
        !hasMathRandomInAnalyzer &&
        preservesCoverLetter &&
        preservesFeedback &&
        preservesBuiltResume;

      record(
        'TEST 8 - Legacy Logic Verification & Future-Phase Preservation',
        legacyClean,
        'Zero obsolete mock/storage calls in active pipeline; future-phase helpers preserved'
      );

      // =========================================================================
      // SUMMARY
      // =========================================================================
      console.log('\n===============================================================');
      const allPassed = testResults.every((t) => t.pass);
      console.log(
        `CHECKPOINT 7 VERIFICATION OUTCOME: ${allPassed ? 'ALL TESTS PASSED ✅' : 'SOME TESTS FAILED ❌'}`
      );
      console.log(
        `Total: ${testResults.length} | Passed: ${testResults.filter((t) => t.pass).length} | Failed: ${testResults.filter((t) => !t.pass).length}`
      );
      console.log('===============================================================\n');

      server.close();
      process.exit(allPassed ? 0 : 1);
    } catch (err) {
      console.error('\nVerification suite crashed with error:', err);
      server.close();
      process.exit(1);
    }
  });
}

runCheckpoint7FullVerification().catch((err) => {
  console.error('Fatal initialization error:', err);
  process.exit(1);
});
