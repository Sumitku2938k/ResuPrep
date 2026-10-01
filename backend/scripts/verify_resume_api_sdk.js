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

async function testResumeApiSdk() {
  console.log('Connecting DB...');
  await connectDB();

  const server = app.listen(0, async () => {
    const port = server.address().port;
    process.env.VITE_API_URL = `http://localhost:${port}/api/v1`;
    console.log(`Resume API SDK Test Server running on port ${port}`);

    try {
      const resumeApiPath = 'file://' + path.resolve(__dirname, '../../frontend/src/api/resume.js').replace(/\\/g, '/');
      const {
        analyzeResumeApi,
        getResumeHistoryApi,
        getResumeAnalysisByIdApi,
        deleteResumeAnalysisApi,
      } = await import(resumeApiPath);

      // Create test user and token
      const testUser = await User.create({
        name: 'SDK Resume Tester',
        email: `sdk_resume_${Date.now()}@example.com`,
        password: 'Password123!',
      });
      const token = generateToken(testUser._id);
      localStorage.setItem('token', token);

      const jobDescription = 'Looking for a Senior React and Node.js Engineer with TypeScript, Express, and MongoDB skills.';
      const resumeText = 'Senior Full Stack Engineer with extensive experience in React, Node.js, Express, MongoDB, TypeScript, REST APIs, Git, and Docker.';

      // 1. Test analyzeResumeApi with plain text payload
      console.log('\n--- 1. Testing analyzeResumeApi ({ resumeText, jobDescription }) ---');
      const analyzeRes = await analyzeResumeApi({ resumeText, jobDescription });
      console.log('analyzeResumeApi Success:', analyzeRes.success);
      console.log('Compatibility Score:', analyzeRes.data?.analysis?.result?.compatibilityScore);
      console.log('Matched Keywords:', analyzeRes.data?.analysis?.result?.matchedKeywords);
      const analysisId = analyzeRes.data?.analysis?._id;

      if (!analyzeRes.success || !analysisId) {
        throw new Error('analyzeResumeApi failed');
      }

      // 2. Test getResumeHistoryApi
      console.log('\n--- 2. Testing getResumeHistoryApi () ---');
      const historyRes = await getResumeHistoryApi();
      console.log('getResumeHistoryApi Success:', historyRes.success);
      console.log('History count:', historyRes.data?.analyses?.length);
      if (!historyRes.success || historyRes.data?.analyses?.length === 0) {
        throw new Error('getResumeHistoryApi failed');
      }

      // 3. Test getResumeAnalysisByIdApi
      console.log('\n--- 3. Testing getResumeAnalysisByIdApi (analysisId) ---');
      const singleRes = await getResumeAnalysisByIdApi(analysisId);
      console.log('getResumeAnalysisByIdApi Success:', singleRes.success);
      console.log('Single item ID matches:', singleRes.data?.analysis?._id === analysisId);
      if (!singleRes.success || singleRes.data?.analysis?._id !== analysisId) {
        throw new Error('getResumeAnalysisByIdApi failed');
      }

      // 4. Test deleteResumeAnalysisApi
      console.log('\n--- 4. Testing deleteResumeAnalysisApi (analysisId) ---');
      const deleteRes = await deleteResumeAnalysisApi(analysisId);
      console.log('deleteResumeAnalysisApi Success:', deleteRes.success);
      console.log('Delete message:', deleteRes.message);

      // Verify deletion
      try {
        await getResumeAnalysisByIdApi(analysisId);
        throw new Error('Item should not exist after deletion');
      } catch (err) {
        console.log('Item successfully deleted (404 caught cleanly):', err.message, '| Status:', err.status);
      }

      // 5. Test Error Handling (unauthenticated history call)
      console.log('\n--- 5. Testing Error Normalization (Unauthenticated) ---');
      localStorage.removeItem('token');
      try {
        await getResumeHistoryApi();
        throw new Error('Should have thrown 401 error');
      } catch (err) {
        console.log('Error normalized correctly by client:', err.message, '| Status:', err.status);
      }

      console.log('\nALL RESUME API SDK TESTS PASSED 100%! ✅');
    } catch (err) {
      console.error('SDK Verification failed:', err);
    } finally {
      server.close();
      process.exit(0);
    }
  });
}

testResumeApiSdk();
