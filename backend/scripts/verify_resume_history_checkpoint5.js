const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../src/config/db');
const app = require('../src/app');
const User = require('../src/models/User');
const ResumeAnalysis = require('../src/models/ResumeAnalysis');
const { generateToken } = require('../src/services/token.service');

// Mock localStorage for Node test runner
global.storageMap = new Map();
global.localStorage = {
  getItem: (key) => global.storageMap.get(key) || null,
  setItem: (key, val) => global.storageMap.set(key, String(val)),
  removeItem: (key) => global.storageMap.delete(key),
  clear: () => global.storageMap.clear(),
};

async function runCheckpoint5Verification() {
  console.log('=== CHECKPOINT 5: RESUME HISTORY VERIFICATION SUITE ===\n');

  console.log('Connecting DB for Checkpoint 5 verification...');
  await connectDB();

  const server = app.listen(0, async () => {
    const port = server.address().port;
    process.env.VITE_API_URL = `http://localhost:${port}/api/v1`;
    console.log(`Checkpoint 5 Test Server running on port ${port}`);

    try {
      const resumeApiPath = 'file://' + path.resolve(__dirname, '../../frontend/src/api/resume.js').replace(/\\/g, '/');
      const {
        analyzeResumeApi,
        getResumeHistoryApi,
        deleteResumeAnalysisApi,
      } = await import(resumeApiPath);

      // 1. Create two test users: User A and User B
      console.log('\n--- Setting Up Test Users ---');
      const userA = await User.create({
        name: 'History User A',
        email: `history_user_a_${Date.now()}@example.com`,
        password: 'Password123!',
      });
      const tokenA = generateToken(userA._id);

      const userB = await User.create({
        name: 'History User B',
        email: `history_user_b_${Date.now()}@example.com`,
        password: 'Password123!',
      });
      const tokenB = generateToken(userB._id);

      // TEST 1: Unauthenticated request should fail with 401
      console.log('\n--- TEST 1: Unauthenticated History Access ---');
      localStorage.clear();
      let unauthCaught = null;
      try {
        await getResumeHistoryApi();
      } catch (err) {
        unauthCaught = err;
      }
      console.log('Unauthenticated error caught:', unauthCaught ? unauthCaught.message : 'NONE');
      if (!unauthCaught) {
        throw new Error('Test 1 failed: Unauthenticated user should not be able to fetch history');
      }

      // TEST 2: User A creates two analyses
      console.log('\n--- TEST 2: User A Creates Analyses and History Loads ---');
      localStorage.setItem('token', tokenA);

      const jobDescription = 'Looking for a Senior React and Node.js Engineer with Express, MongoDB, and TypeScript.';
      const resumeText1 = 'Senior Developer skilled in React, Node.js, Express, MongoDB, TypeScript, Docker, and REST APIs.';
      const resumeText2 = 'Full Stack Engineer with React, Python, Django, PostgreSQL, and AWS experience.';

      console.log('Submitting Analysis 1 for User A...');
      const res1 = await analyzeResumeApi({ resumeText: resumeText1, jobDescription });
      const id1 = res1.data?.analysis?._id;
      console.log('Analysis 1 created with ID:', id1);

      console.log('Submitting Analysis 2 for User A...');
      const res2 = await analyzeResumeApi({ resumeText: resumeText2, jobDescription });
      const id2 = res2.data?.analysis?._id;
      console.log('Analysis 2 created with ID:', id2);

      // TEST 3: Fetch User A history and verify count & ordering
      console.log('\n--- TEST 3: User A History Fetch & Ordering (Newest First) ---');
      const historyA = await getResumeHistoryApi();
      console.log('History A fetch success:', historyA.success);
      console.log('History A count:', historyA.data?.analyses?.length);

      if (!historyA.success || historyA.data?.analyses?.length !== 2) {
        throw new Error('Test 3 failed: Expected 2 analyses in User A history');
      }

      const items = historyA.data.analyses;
      // Newest should be index 0 (id2)
      console.log('First item ID:', items[0]._id, '(Expected newest id2:', id2, ')');
      console.log('Second item ID:', items[1]._id, '(Expected id1:', id1, ')');

      if (items[0]._id !== id2 || items[1]._id !== id1) {
        throw new Error('Test 3 failed: History is not ordered newest first');
      }

      // Check fields in history item
      const item0 = items[0];
      console.log('Item has compatibilityScore:', item0.result?.compatibilityScore);
      console.log('Item has matchedKeywords:', Array.isArray(item0.result?.matchedKeywords));
      console.log('Item has createdAt:', item0.createdAt);
      if (typeof item0.result?.compatibilityScore !== 'number') {
        throw new Error('Test 3 failed: Missing result fields in history item');
      }

      // TEST 4: User Isolation - User B cannot see User A's history
      console.log('\n--- TEST 4: User Isolation (User B cannot see User A history) ---');
      localStorage.setItem('token', tokenB);
      const historyB = await getResumeHistoryApi();
      console.log('History B fetch success:', historyB.success);
      console.log('History B count (Expected 0):', historyB.data?.analyses?.length);

      if (historyB.data?.analyses?.length !== 0) {
        throw new Error('Test 4 failed: User B saw analyses belonging to User A!');
      }

      // TEST 5: Deletion with Ownership Enforcement
      console.log('\n--- TEST 5: Deletion Authorization & Ownership ---');
      // User B tries to delete User A's analysis (id1)
      let deleteUnauthorizedCaught = null;
      try {
        await deleteResumeAnalysisApi(id1);
      } catch (err) {
        deleteUnauthorizedCaught = err;
      }
      console.log('User B deleting User A item rejected:', deleteUnauthorizedCaught ? deleteUnauthorizedCaught.message : 'FAILED TO REJECT');
      if (!deleteUnauthorizedCaught) {
        throw new Error('Test 5 failed: User B was able to delete User A analysis');
      }

      // User A deletes their own analysis (id1)
      localStorage.setItem('token', tokenA);
      console.log('User A deleting their own analysis (id1)...');
      const deleteRes = await deleteResumeAnalysisApi(id1);
      console.log('Delete success:', deleteRes.success);
      console.log('Delete message:', deleteRes.message);

      // Verify history count after deletion
      const historyAfterDelete = await getResumeHistoryApi();
      console.log('User A history count after deletion (Expected 1):', historyAfterDelete.data?.analyses?.length);
      if (historyAfterDelete.data?.analyses?.length !== 1 || historyAfterDelete.data?.analyses[0]._id !== id2) {
        throw new Error('Test 5 failed: Deleted item still in history or wrong item deleted');
      }

      // TEST 6: Refresh Persistence (Simulate page reload by re-reading directly from DB)
      console.log('\n--- TEST 6: Refresh Persistence from MongoDB ---');
      const dbAnalyses = await ResumeAnalysis.find({ user: userA._id }).sort({ createdAt: -1 });
      console.log('MongoDB persistence count for User A:', dbAnalyses.length);
      if (dbAnalyses.length !== 1 || dbAnalyses[0]._id.toString() !== id2) {
        throw new Error('Test 6 failed: MongoDB persistence failed');
      }

      console.log('\n>>> ALL 6 CHECKPOINT 5 RUNTIME TESTS PASSED! <<<');
      process.exit(0);
    } catch (err) {
      console.error('Checkpoint 5 verification failed with error:', err);
      process.exit(1);
    } finally {
      server.close();
    }
  });
}

runCheckpoint5Verification();
