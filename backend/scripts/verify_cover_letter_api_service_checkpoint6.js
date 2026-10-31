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

async function runCoverLetterApiServiceVerification() {
  console.log('===================================================================');
  console.log('   RESUPREP - PHASE 3 CHECKPOINT 6: COVER LETTER API SERVICE       ');
  console.log('===================================================================\n');

  console.log('Connecting to MongoDB...');
  await connectDB();

  const server = app.listen(0, async () => {
    const port = server.address().port;
    process.env.VITE_API_URL = `http://localhost:${port}/api/v1`;
    console.log(`Test Express server running at: http://localhost:${port}/api/v1\n`);

    const testResults = [];
    function record(testNum, name, pass, details) {
      testResults.push({ testNum, name, pass, details });
      console.log(`[TEST ${testNum}] ${pass ? '✅ PASS' : '❌ FAIL'}: ${name}`);
      if (details) console.log(`   └─ ${details}`);
    }

    let userA = null;
    let userB = null;
    let tokenA = null;
    let tokenB = null;
    const createdLetterIds = [];

    try {
      // Import the frontend coverLetter API module dynamically via ESM
      const coverLetterApiPath =
        'file://' + path.resolve(__dirname, '../../frontend/src/api/coverLetter.js').replace(/\\/g, '/');
      const coverLetterApi = await import(coverLetterApiPath);

      // TEST 1: Module exports verification
      const exportsOk =
        typeof coverLetterApi.generateCoverLetterApi === 'function' &&
        typeof coverLetterApi.getCoverLettersApi === 'function' &&
        typeof coverLetterApi.updateCoverLetterApi === 'function' &&
        typeof coverLetterApi.deleteCoverLetterApi === 'function' &&
        typeof coverLetterApi.getCoverLetterByIdApi === 'undefined';

      record(
        1,
        'Module Exports Verification',
        exportsOk,
        `generateCoverLetterApi: ${typeof coverLetterApi.generateCoverLetterApi}, getCoverLettersApi: ${typeof coverLetterApi.getCoverLettersApi}, updateCoverLetterApi: ${typeof coverLetterApi.updateCoverLetterApi}, deleteCoverLetterApi: ${typeof coverLetterApi.deleteCoverLetterApi}, getCoverLetterByIdApi: undefined (unmounted in backend)`
      );

      // TEST 2: Static Source Code Security & Shared Client Reuse Verification
      const fileContent = fs.readFileSync(path.resolve(__dirname, '../../frontend/src/api/coverLetter.js'), 'utf-8');
      const usesSharedClient = fileContent.includes("from './client.js'") || fileContent.includes('from "./client.js"');
      const noDirectAxios = !fileContent.includes('axios');
      const noDirectFetch = !fileContent.includes('fetch(');
      const noOpenAiKey = !fileContent.includes('OPENAI_API_KEY') && !fileContent.includes('sk-');
      const codeGuardsPass = usesSharedClient && noDirectAxios && noDirectFetch && noOpenAiKey;

      record(
        2,
        'Shared Client Reuse & Security Inspection',
        codeGuardsPass,
        `Uses client.js: ${usesSharedClient}, No direct axios/fetch: ${noDirectAxios && noDirectFetch}, No OpenAI keys in frontend: ${noOpenAiKey}`
      );

      // TEST 3: Pre-network required fields validation for generateCoverLetterApi
      let validationCaught = 0;
      const invalidPayloads = [
        null,
        {},
        { name: '' },
        { name: 'Alice', jobTitle: '' },
        { name: 'Alice', jobTitle: 'Software Engineer', company: '' },
        { name: 'Alice', jobTitle: 'Software Engineer', company: 'Acme', tone: 'invalid-tone' },
      ];

      for (const payload of invalidPayloads) {
        try {
          await coverLetterApi.generateCoverLetterApi(payload);
        } catch (err) {
          validationCaught++;
        }
      }

      record(
        3,
        'Pre-network Validation Guards (generateCoverLetterApi)',
        validationCaught === invalidPayloads.length,
        `Rejected ${validationCaught}/${invalidPayloads.length} invalid payloads pre-network`
      );

      // TEST 4: Pre-network validation guards for updateCoverLetterApi & deleteCoverLetterApi
      let idGuardsCaught = 0;
      const invalidIds = [null, undefined, '', '   ', 123, {}];
      for (const inv of invalidIds) {
        try {
          await coverLetterApi.updateCoverLetterApi(inv, { generatedLetter: 'test' });
        } catch (err) {
          if (err.message.includes('valid cover letter ID is required')) idGuardsCaught++;
        }
        try {
          await coverLetterApi.deleteCoverLetterApi(inv);
        } catch (err) {
          if (err.message.includes('valid cover letter ID is required')) idGuardsCaught++;
        }
      }

      record(
        4,
        'Pre-network ID Validation Guards (updateCoverLetterApi & deleteCoverLetterApi)',
        idGuardsCaught === invalidIds.length * 2,
        `Rejected ${idGuardsCaught}/${invalidIds.length * 2} invalid ID invocations before dispatch`
      );

      // Create isolated test users
      userA = await User.create({
        name: 'Checkpoint 6 User A',
        email: `cp6_user_a_${Date.now()}@test.com`,
        password: 'Password123!',
      });
      tokenA = generateToken(userA._id);

      userB = await User.create({
        name: 'Checkpoint 6 User B',
        email: `cp6_user_b_${Date.now()}@test.com`,
        password: 'Password123!',
      });
      tokenB = generateToken(userB._id);

      // TEST 5: Anonymous cover letter generation (optionalAuth -> user: null)
      global.localStorage.removeItem('token');
      const anonPayload = {
        name: 'Jane Doe',
        jobTitle: 'Backend Engineer',
        company: 'Stripe',
        hiringManager: 'Alex Rivera',
        keySkills: 'Node.js, Express, MongoDB, Distributed Systems',
        achievement: 'Scaled payment ingestion pipeline to 50k req/sec',
        tone: 'concise',
      };

      const anonRes = await coverLetterApi.generateCoverLetterApi(anonPayload);
      const anonDoc = anonRes?.data?.coverLetter;
      if (anonDoc?._id) createdLetterIds.push(anonDoc._id);

      const dbAnonDoc = anonDoc?._id ? await CoverLetter.findById(anonDoc._id) : null;
      const anonOk =
        anonRes?.success === true &&
        Boolean(anonDoc?._id) &&
        Boolean(anonDoc?.generatedLetter) &&
        dbAnonDoc !== null &&
        dbAnonDoc.user === null &&
        dbAnonDoc.tone === 'concise';

      record(
        5,
        'Anonymous Generation & Auto-Persistence (user: null)',
        anonOk,
        `Generated letter ID: ${anonDoc?._id}, Persisted in DB: ${Boolean(dbAnonDoc)}, user: ${dbAnonDoc?.user}`
      );

      // TEST 6: Authenticated cover letter generation (Linked to User A)
      global.localStorage.setItem('token', tokenA);
      const userAPayload = {
        name: 'John Developer',
        jobTitle: 'Full Stack Engineer',
        company: 'Google',
        hiringManager: 'Hiring Team',
        keySkills: 'React, Node.js, GraphQL, Cloud Computing',
        achievement: 'Redesigned core search UX reducing bounce rate by 24%',
        tone: 'enthusiastic',
      };

      const userARes = await coverLetterApi.generateCoverLetterApi(userAPayload);
      const userADoc = userARes?.data?.coverLetter;
      if (userADoc?._id) createdLetterIds.push(userADoc._id);

      const dbUserADoc = userADoc?._id ? await CoverLetter.findById(userADoc._id) : null;
      const authCreateOk =
        userARes?.success === true &&
        Boolean(userADoc?._id) &&
        Boolean(userADoc?.generatedLetter) &&
        dbUserADoc !== null &&
        String(dbUserADoc.user) === String(userA._id) &&
        dbUserADoc.tone === 'enthusiastic';

      record(
        6,
        'Authenticated Generation & Ownership Association (User A)',
        authCreateOk,
        `ID: ${userADoc?._id}, Owner: ${dbUserADoc?.user}, Letter length: ${userADoc?.generatedLetter?.length} chars`
      );

      // TEST 7: List authenticated user's cover letters (getCoverLettersApi)
      const listRes = await coverLetterApi.getCoverLettersApi();
      const letters = listRes?.data?.coverLetters || [];
      const listContainsUserA = letters.some((l) => String(l._id) === String(userADoc._id));
      const listExcludesAnon = !letters.some((l) => String(l._id) === String(anonDoc._id));

      record(
        7,
        'List Saved Letters (getCoverLettersApi)',
        listRes?.success === true && listContainsUserA && listExcludesAnon,
        `Total returned: ${letters.length}, Contains User A letter: ${listContainsUserA}, Excludes anonymous letter: ${listExcludesAnon}`
      );

      // TEST 8: Update cover letter by ID (updateCoverLetterApi)
      const updatedText = 'Updated tailored cover letter opening and closing notes.';
      const updateRes = await coverLetterApi.updateCoverLetterApi(userADoc._id, {
        generatedLetter: updatedText,
        tone: 'professional',
      });
      const updatedDoc = updateRes?.data?.coverLetter;
      const dbUpdated = await CoverLetter.findById(userADoc._id);

      record(
        8,
        'Update Cover Letter by ID (updateCoverLetterApi)',
        updateRes?.success === true && updatedDoc?.generatedLetter === updatedText && dbUpdated?.tone === 'professional',
        `Updated letter length: ${updatedDoc?.generatedLetter?.length}, tone in DB: ${dbUpdated?.tone}`
      );

      // TEST 9: IDOR Isolation - Cross-User Update Blocked (User B cannot update User A's letter)
      global.localStorage.setItem('token', tokenB);
      let crossUpdateCaught = false;
      let crossUpdateStatus = null;
      try {
        await coverLetterApi.updateCoverLetterApi(userADoc._id, {
          generatedLetter: 'Hacked letter content by User B',
        });
      } catch (err) {
        crossUpdateCaught = true;
        crossUpdateStatus = err.status;
      }

      const dbVerifyAfterCrossUpdate = await CoverLetter.findById(userADoc._id);
      const crossUpdateSafe =
        crossUpdateCaught &&
        crossUpdateStatus === 404 &&
        dbVerifyAfterCrossUpdate.generatedLetter === updatedText;

      record(
        9,
        'IDOR Isolation: Cross-User Update Blocked (HTTP 404)',
        crossUpdateSafe,
        `User B update attempt blocked with HTTP ${crossUpdateStatus}; document untouched in DB`
      );

      // TEST 10: IDOR Isolation - Cross-User Deletion Blocked (User B cannot delete User A's letter)
      let crossDeleteCaught = false;
      let crossDeleteStatus = null;
      try {
        await coverLetterApi.deleteCoverLetterApi(userADoc._id);
      } catch (err) {
        crossDeleteCaught = true;
        crossDeleteStatus = err.status;
      }

      const dbVerifyAfterCrossDelete = await CoverLetter.findById(userADoc._id);
      const crossDeleteSafe =
        crossDeleteCaught &&
        crossDeleteStatus === 404 &&
        dbVerifyAfterCrossDelete !== null;

      record(
        10,
        'IDOR Isolation: Cross-User Deletion Blocked (HTTP 404)',
        crossDeleteSafe,
        `User B delete attempt blocked with HTTP ${crossDeleteStatus}; document safely preserved in DB`
      );

      // TEST 11: Route Protection - Unauthenticated Protected Calls Rejected (HTTP 401)
      global.localStorage.removeItem('token');
      let unauthListCaught = false;
      let unauthUpdateCaught = false;
      let unauthDeleteCaught = false;

      try {
        await coverLetterApi.getCoverLettersApi();
      } catch (err) {
        if (err.status === 401) unauthListCaught = true;
      }
      try {
        await coverLetterApi.updateCoverLetterApi(userADoc._id, { tone: 'concise' });
      } catch (err) {
        if (err.status === 401) unauthUpdateCaught = true;
      }
      try {
        await coverLetterApi.deleteCoverLetterApi(userADoc._id);
      } catch (err) {
        if (err.status === 401) unauthDeleteCaught = true;
      }

      record(
        11,
        'Unauthenticated Route Protection (HTTP 401 Enforced)',
        unauthListCaught && unauthUpdateCaught && unauthDeleteCaught,
        `List rejected: ${unauthListCaught}, Update rejected: ${unauthUpdateCaught}, Delete rejected: ${unauthDeleteCaught}`
      );

      // TEST 12: Delete Cover Letter by ID (deleteCoverLetterApi)
      global.localStorage.setItem('token', tokenA);
      const deleteRes = await coverLetterApi.deleteCoverLetterApi(userADoc._id);
      const dbAfterDelete = await CoverLetter.findById(userADoc._id);

      record(
        12,
        'Delete Cover Letter by ID (deleteCoverLetterApi)',
        deleteRes?.success === true && dbAfterDelete === null,
        `API returned success: ${deleteRes?.success}, Document deleted from MongoDB: ${dbAfterDelete === null}`
      );

      // TEST 13: Single-Record GET Endpoint Remains Intentionally Unexposed
      record(
        13,
        'Omission of Nonexistent getCoverLetterByIdApi',
        typeof coverLetterApi.getCoverLetterByIdApi === 'undefined',
        'Single-record GET endpoint is not mounted in backend; function omitted per architectural rule'
      );

      console.log('\n===============================================================');
      const allPassed = testResults.every((t) => t.pass);
      console.log(`CHECKPOINT 6 VERIFICATION OUTCOME: ${allPassed ? 'ALL TESTS PASSED ✅' : 'FAILURES DETECTED ❌'}`);
      console.log(`Total: ${testResults.length} | Passed: ${testResults.filter((t) => t.pass).length} | Failed: ${testResults.filter((t) => !t.pass).length}`);
      console.log('===============================================================\n');

      // Cleanup test records
      if (createdLetterIds.length > 0) {
        await CoverLetter.deleteMany({ _id: { $in: createdLetterIds } });
      }
      if (userA?._id) await User.findByIdAndDelete(userA._id);
      if (userB?._id) await User.findByIdAndDelete(userB._id);

      server.close();
      process.exit(allPassed ? 0 : 1);
    } catch (err) {
      console.error('Fatal error during verification:', err);
      // Clean up in case of error
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

runCoverLetterApiServiceVerification();

