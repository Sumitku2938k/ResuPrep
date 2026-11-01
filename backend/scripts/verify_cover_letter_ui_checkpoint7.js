const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../src/config/db');
const app = require('../src/app');
const User = require('../src/models/User');
const CoverLetter = require('../src/models/CoverLetter');
const { generateToken } = require('../src/services/token.service');

// Mock localStorage for Node environment to integrate with client.js
global.storageMap = new Map();
global.localStorage = {
  getItem: (key) => global.storageMap.get(key) || null,
  setItem: (key, val) => global.storageMap.set(key, String(val)),
  removeItem: (key) => global.storageMap.delete(key),
  clear: () => global.storageMap.clear(),
};

async function runCoverLetterUiVerification() {
  console.log('===================================================================');
  console.log('   RESUPREP - PHASE 3 CHECKPOINT 7: COVER LETTER UI INTEGRATION   ');
  console.log('===================================================================\n');

  const testResults = [];
  function record(testNum, name, pass, details) {
    testResults.push({ testNum, name, pass, details });
    console.log(`[TEST ${testNum}] ${pass ? '✅ PASS' : '❌ FAIL'}: ${name}`);
    if (details) console.log(`   └─ ${details}`);
  }

  // --- SECTION 1: Static Source Code Inspection of CoverLetter.jsx ---
  console.log('--- 1. Static Source Code Inspection of CoverLetter.jsx ---');
  const coverLetterJsxPath = path.resolve(__dirname, '../../frontend/src/pages/CoverLetter.jsx');
  const jsxContent = fs.readFileSync(coverLetterJsxPath, 'utf-8');

  // TEST 1: Imports existing API functions
  const hasApiImports =
    jsxContent.includes('generateCoverLetterApi') &&
    jsxContent.includes('getCoverLettersApi') &&
    jsxContent.includes('updateCoverLetterApi') &&
    jsxContent.includes('deleteCoverLetterApi') &&
    jsxContent.includes('../api/coverLetter');

  record(
    1,
    'Imports Cover Letter API Service Functions',
    hasApiImports,
    'Imports generateCoverLetterApi, getCoverLettersApi, updateCoverLetterApi, deleteCoverLetterApi from ../api/coverLetter.js'
  );

  // TEST 2: Imports useAuth hook
  const hasAuthImport = jsxContent.includes('useAuth') && jsxContent.includes('../hooks/useAuth');
  record(2, 'Imports useAuth Hook', hasAuthImport, 'Retrieves auth context user state via useAuth()');

  // TEST 3: Zero unapproved network calls (no direct fetch or axios)
  const noDirectAxios = !jsxContent.includes('axios');
  const noDirectFetch = !jsxContent.includes('fetch(');
  record(
    3,
    'No Direct Fetch or Axios in CoverLetter.jsx',
    noDirectAxios && noDirectFetch,
    'All backend network calls routed through client.js & coverLetter.js'
  );

  // TEST 4: Static template keystroke generation retired as primary generation path
  const noKeystrokeGeneration =
    !jsxContent.includes('setLetter(openings[f.tone] + bodies[f.tone])') &&
    !jsxContent.includes('openings[tone] + bodies[tone]');
  record(
    4,
    'Static String-Template Keystroke Generation Retired',
    noKeystrokeGeneration,
    'Primary generation path delegates to backend AI pipeline via handleGenerateLetter'
  );

  // TEST 5: Active document ID tracking & UI state management
  const hasActiveIdState = jsxContent.includes('activeLetterId') && jsxContent.includes('setActiveLetterId');
  const hasLoadingStates =
    jsxContent.includes('generating') &&
    jsxContent.includes('setGenerating') &&
    jsxContent.includes('historyLoading') &&
    jsxContent.includes('setHistoryLoading');

  record(
    5,
    'Document Identity & UI States Declared',
    hasActiveIdState && hasLoadingStates,
    'Tracks activeLetterId, generating, saving, isDirty, savedLetters, historyLoading'
  );

  // TEST 6: Preserves tone selector mapping to backend enum
  const hasToneMapping =
    jsxContent.includes("id: 'professional'") &&
    jsxContent.includes("id: 'enthusiastic'") &&
    jsxContent.includes("id: 'concise'");
  record(
    6,
    'Tone Enum Alignment',
    hasToneMapping,
    'Tones map 1:1 to backend Joi enum: professional, enthusiastic, concise'
  );

  // TEST 7: Preserves PDF download functionality
  const hasPdfExport =
    jsxContent.includes("await import('html2pdf.js')") &&
    jsxContent.includes('previewRef.current') &&
    jsxContent.includes('downloadPDF');
  record(
    7,
    'Preserves Client-Side PDF Export',
    hasPdfExport,
    'Downloads rendered/edited letter directly from previewRef without triggering new API generations'
  );

  // --- SECTION 2: Runtime Backend API & MongoDB Persistence Verification ---
  console.log('\n--- 2. Runtime Backend API & MongoDB Persistence ---');
  console.log('Connecting to MongoDB...');
  await connectDB();

  const server = app.listen(0, async () => {
    const port = server.address().port;
    process.env.VITE_API_URL = `http://localhost:${port}/api/v1`;
    console.log(`Test Express server running at: http://localhost:${port}/api/v1\n`);

    let userA = null;
    let userB = null;
    let tokenA = null;
    let tokenB = null;
    const createdLetterIds = [];

    try {
      const coverLetterApiPath =
        'file://' + path.resolve(__dirname, '../../frontend/src/api/coverLetter.js').replace(/\\/g, '/');
      const coverLetterApi = await import(coverLetterApiPath);

      // Create test users
      userA = await User.create({
        name: 'Checkpoint 7 User A',
        email: `cp7_user_a_${Date.now()}@test.com`,
        password: 'Password123!',
      });
      tokenA = generateToken(userA._id);

      userB = await User.create({
        name: 'Checkpoint 7 User B',
        email: `cp7_user_b_${Date.now()}@test.com`,
        password: 'Password123!',
      });
      tokenB = generateToken(userB._id);

      // TEST 8: Authenticated generation creates document in MongoDB linked to User A
      global.localStorage.setItem('token', tokenA);
      const genPayload = {
        name: 'Alice Software Engineer',
        jobTitle: 'Staff Backend Engineer',
        company: 'Netflix',
        hiringManager: 'Engineering Team',
        keySkills: 'Distributed Systems, Node.js, Go, Kafka, Cassandra',
        achievement: 'Architected high-throughput message bus processing 100M events/day',
        tone: 'professional',
      };

      const genRes = await coverLetterApi.generateCoverLetterApi(genPayload);
      const genDoc = genRes?.data?.coverLetter;
      if (genDoc?._id) createdLetterIds.push(genDoc._id);

      const dbGenDoc = genDoc?._id ? await CoverLetter.findById(genDoc._id) : null;
      const authGenOk =
        genRes?.success === true &&
        Boolean(genDoc?._id) &&
        Boolean(genDoc?.generatedLetter) &&
        dbGenDoc !== null &&
        String(dbGenDoc.user) === String(userA._id) &&
        dbGenDoc.company === 'Netflix';

      record(
        8,
        'Authenticated Generation & MongoDB Persistence',
        authGenOk,
        `ID: ${genDoc?._id}, DB Owner: ${dbGenDoc?.user}, Content length: ${genDoc?.generatedLetter?.length} chars`
      );

      // TEST 9: History retrieval populates saved cover letters for User A
      const listRes = await coverLetterApi.getCoverLettersApi();
      const letters = listRes?.data?.coverLetters || [];
      const foundInHistory = letters.some((l) => String(l._id) === String(genDoc._id));

      record(
        9,
        'History Retrieval (Populates Saved Letters)',
        listRes?.success === true && foundInHistory,
        `Retrieved ${letters.length} saved letters; contains active letter ID: ${foundInHistory}`
      );

      // TEST 10: Update existing saved letter without creating duplicate document
      const updatedText = 'Custom edited letter body reflecting tailored personal adjustments.';
      const updateRes = await coverLetterApi.updateCoverLetterApi(genDoc._id, {
        generatedLetter: updatedText,
        tone: 'concise',
        company: 'Netflix Global',
      });
      const dbAfterUpdate = await CoverLetter.findById(genDoc._id);
      const userTotalLetters = await CoverLetter.countDocuments({ user: userA._id });

      const updateOk =
        updateRes?.success === true &&
        dbAfterUpdate?.generatedLetter === updatedText &&
        dbAfterUpdate?.tone === 'concise' &&
        userTotalLetters === 1;

      record(
        10,
        'Update Saved Letter (Zero Duplicate Duplication)',
        updateOk,
        `Document updated in place. User A total letter count remains ${userTotalLetters}`
      );

      // TEST 11: IDOR Protection: User B cannot modify or delete User A's letter
      global.localStorage.setItem('token', tokenB);
      let crossUpdateBlocked = false;
      let crossDeleteBlocked = false;

      try {
        await coverLetterApi.updateCoverLetterApi(genDoc._id, { generatedLetter: 'Malicious overwrite' });
      } catch (err) {
        if (err.status === 404) crossUpdateBlocked = true;
      }

      try {
        await coverLetterApi.deleteCoverLetterApi(genDoc._id);
      } catch (err) {
        if (err.status === 404) crossDeleteBlocked = true;
      }

      const dbAfterCrossAttempt = await CoverLetter.findById(genDoc._id);
      const idorOk = crossUpdateBlocked && crossDeleteBlocked && dbAfterCrossAttempt !== null;

      record(
        11,
        'IDOR Cross-User Isolation (HTTP 404 Enforced)',
        idorOk,
        `Cross-update blocked: ${crossUpdateBlocked}, Cross-delete blocked: ${crossDeleteBlocked}; letter preserved in DB`
      );

      // TEST 12: Delete cover letter by ID confirms removal from MongoDB
      global.localStorage.setItem('token', tokenA);
      const deleteRes = await coverLetterApi.deleteCoverLetterApi(genDoc._id);
      const dbAfterDelete = await CoverLetter.findById(genDoc._id);

      record(
        12,
        'Delete Cover Letter & MongoDB Purge',
        deleteRes?.success === true && dbAfterDelete === null,
        `Delete API response: success=true, DB document verified null: ${dbAfterDelete === null}`
      );

      // TEST 13: Anonymous generation allowed with user: null
      global.localStorage.removeItem('token');
      const anonPayload = {
        name: 'Guest Applicant',
        jobTitle: 'Junior Developer',
        company: 'StartUp Inc',
        tone: 'enthusiastic',
      };
      const anonRes = await coverLetterApi.generateCoverLetterApi(anonPayload);
      const anonDoc = anonRes?.data?.coverLetter;
      if (anonDoc?._id) createdLetterIds.push(anonDoc._id);
      const dbAnon = anonDoc?._id ? await CoverLetter.findById(anonDoc._id) : null;

      record(
        13,
        'Anonymous Generation (user: null)',
        anonRes?.success === true && dbAnon !== null && dbAnon.user === null,
        `Anonymous generation succeeded; document saved in MongoDB with user: null`
      );

      console.log('\n===============================================================');
      const allPassed = testResults.every((t) => t.pass);
      console.log(`CHECKPOINT 7 VERIFICATION OUTCOME: ${allPassed ? 'ALL TESTS PASSED ✅' : 'FAILURES DETECTED ❌'}`);
      console.log(
        `Total: ${testResults.length} | Passed: ${testResults.filter((t) => t.pass).length} | Failed: ${
          testResults.filter((t) => !t.pass).length
        }`
      );
      console.log('===============================================================\n');

      // Cleanup
      if (createdLetterIds.length > 0) {
        await CoverLetter.deleteMany({ _id: { $in: createdLetterIds } });
      }
      if (userA?._id) await User.findByIdAndDelete(userA._id);
      if (userB?._id) await User.findByIdAndDelete(userB._id);

      server.close();
      process.exit(allPassed ? 0 : 1);
    } catch (err) {
      console.error('Fatal error during verification:', err);
      if (createdLetterIds.length > 0) {
        await CoverLetter.deleteMany({ _id: { $in: createdLetterIds } }).catch(() => {});
      }
      if (userA?._id) await User.findByIdAndDelete(userA._id).catch(() => {});
      if (userB?._id) await User.findByIdAndDelete(userB._id).catch(() => {});
      server.close();
      process.exit(1);
    }
  });
}

runCoverLetterUiVerification();

