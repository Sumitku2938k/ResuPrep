const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../src/config/db');
const app = require('../src/app');
const User = require('../src/models/User');
const { generateToken } = require('../src/services/token.service');

// Mock localStorage for Node test runner
global.storageMap = new Map();
global.localStorage = {
  getItem: (key) => global.storageMap.get(key) || null,
  setItem: (key, val) => global.storageMap.set(key, String(val)),
  removeItem: (key) => global.storageMap.delete(key),
  clear: () => global.storageMap.clear(),
};

async function runCheckpoint3Verification() {
  console.log('Connecting DB for Checkpoint 3 verification...');
  await connectDB();

  const server = app.listen(0, async () => {
    const port = server.address().port;
    process.env.VITE_API_URL = `http://localhost:${port}/api/v1`;
    console.log(`Checkpoint 3 Test Server running on port ${port}`);

    try {
      const resumeApiPath = 'file://' + path.resolve(__dirname, '../../frontend/src/api/resume.js').replace(/\\/g, '/');
      const { analyzeResumeApi } = await import(resumeApiPath);

      // Create test user and token
      const testUser = await User.create({
        name: 'Checkpoint3 Tester',
        email: `cp3_tester_${Date.now()}@example.com`,
        password: 'Password123!',
      });
      const token = generateToken(testUser._id);
      localStorage.setItem('token', token);

      const jobDescription = 'Looking for a Senior React Engineer with Node.js, Express, MongoDB, TypeScript, Docker, and REST APIs.';

      // Test 1: Plain Text Submission via analyzeResumeApi
      console.log('\n=== TEST 1: Plain Text Resume Analysis ===');
      const resumeText = 'Senior Full Stack Engineer with 5+ years building scalable apps using React, Node.js, Express, MongoDB, and TypeScript.';
      const textRes = await analyzeResumeApi({ resumeText, jobDescription });
      console.log('Text API Status: success =', textRes.success);
      console.log('Score:', textRes.data?.analysis?.result?.compatibilityScore);
      console.log('Matched Keywords:', textRes.data?.analysis?.result?.matchedKeywords);
      console.log('Missing Keywords:', textRes.data?.analysis?.result?.missingKeywords);
      console.log('Skill Gaps count:', textRes.data?.analysis?.result?.skillGaps?.length);
      console.log('Tips count:', textRes.data?.analysis?.result?.improvementTips?.length);
      console.log('Summary:', textRes.data?.analysis?.result?.summary);

      if (!textRes.success || typeof textRes.data?.analysis?.result?.compatibilityScore !== 'number') {
        throw new Error('Test 1 failed: Invalid plain text analysis response');
      }

      // Test 2: PDF Binary File Upload via analyzeResumeApi
      console.log('\n=== TEST 2: PDF File Upload Analysis ===');
      function buildValidPdf(textContent) {
        let content = `BT /F1 12 Tf 72 712 Td (${textContent}) Tj ET`;
        let streamLen = Buffer.byteLength(content, 'utf8');
        let body = '';
        const offsets = [];

        function addObj(str) {
          offsets.push(Buffer.byteLength(body, 'latin1'));
          body += str + '\n';
        }

        body += '%PDF-1.4\n';
        addObj('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
        addObj('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj');
        addObj('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj');
        addObj('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj');
        addObj(`5 0 obj\n<< /Length ${streamLen} >>\nstream\n${content}\nendstream\nendobj`);

        const startXref = Buffer.byteLength(body, 'latin1');
        let xref = `xref\n0 6\n0000000000 65535 f \r\n`;
        for (let i = 0; i < 5; i++) {
          xref += String(offsets[i]).padStart(10, '0') + ' 00000 n \r\n';
        }
        const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;
        return Buffer.from(body + xref + trailer, 'latin1');
      }

      const pdfBuffer = buildValidPdf('Experienced React, Node.js, Express, MongoDB, TypeScript, Docker developer.');
      const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });
      pdfBlob.name = 'sample_resume.pdf';

      const pdfRes = await analyzeResumeApi({ file: pdfBlob, jobDescription });
      console.log('PDF API Status: success =', pdfRes.success);
      console.log('PDF File Name in Record:', pdfRes.data?.analysis?.fileName);
      console.log('PDF Compatibility Score:', pdfRes.data?.analysis?.result?.compatibilityScore);
      console.log('PDF Matched Keywords:', pdfRes.data?.analysis?.result?.matchedKeywords);

      if (!pdfRes.success || !pdfRes.data?.analysis?.result) {
        throw new Error('Test 2 failed: Invalid PDF upload analysis response');
      }

      // Test 3: Backend Validation Error Handling (Missing Job Description)
      console.log('\n=== TEST 3: Validation Error Handling ===');
      let caughtError = null;
      try {
        await analyzeResumeApi({ resumeText, jobDescription: '' });
      } catch (err) {
        caughtError = err;
      }
      console.log('Expected error caught:', caughtError ? caughtError.message : 'NONE');
      if (!caughtError) {
        throw new Error('Test 3 failed: Backend did not return error for missing job description');
      }

      // Test 4: Anonymous Upload (User not logged in)
      console.log('\n=== TEST 4: Anonymous Plain Text Analysis ===');
      localStorage.clear(); // remove token
      const anonRes = await analyzeResumeApi({ resumeText, jobDescription });
      console.log('Anonymous Success:', anonRes.success);
      console.log('Anonymous User ID (expected null):', anonRes.data?.analysis?.user);
      if (!anonRes.success || anonRes.data?.analysis?.user !== null) {
        throw new Error('Test 4 failed: Anonymous analysis user should be null');
      }

      // Test 5: Verify Result Integrity & Contract Match
      console.log('\n=== TEST 5: Result Contract Verification ===');
      const r = pdfRes.data?.analysis?.result;
      const hasScore = typeof r.compatibilityScore === 'number' && r.compatibilityScore >= 0 && r.compatibilityScore <= 100;
      const hasMatched = Array.isArray(r.matchedKeywords);
      const hasMissing = Array.isArray(r.missingKeywords);
      const hasGaps = Array.isArray(r.skillGaps);
      const hasTips = Array.isArray(r.improvementTips);
      const hasSummary = typeof r.summary === 'string';

      console.log('Has valid compatibilityScore (0-100):', hasScore);
      console.log('Has matchedKeywords array:', hasMatched);
      console.log('Has missingKeywords array:', hasMissing);
      console.log('Has skillGaps array:', hasGaps);
      console.log('Has improvementTips array:', hasTips);
      console.log('Has summary string:', hasSummary);

      if (!hasScore || !hasMatched || !hasMissing || !hasGaps || !hasTips || !hasSummary) {
        throw new Error('Test 5 failed: Missing or invalid result fields in backend contract');
      }

      console.log('\n>>> ALL 5 CHECKPOINT 3 RUNTIME INTEGRATION TESTS PASSED! <<<');
      process.exit(0);
    } catch (err) {
      console.error('Checkpoint 3 verification failed with error:', err);
      process.exit(1);
    } finally {
      server.close();
    }
  });
}

runCheckpoint3Verification();
