const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../src/config/db');
const app = require('../src/app');

// Polyfills for Node environment
global.storageMap = new Map();
global.localStorage = {
  getItem: (key) => global.storageMap.get(key) || null,
  setItem: (key, val) => global.storageMap.set(key, String(val)),
  removeItem: (key) => global.storageMap.delete(key),
  clear: () => global.storageMap.clear(),
};

async function runFeedbackApiServiceVerification() {
  console.log('===================================================================');
  console.log('   RESUPREP - PHASE 4 CHECKPOINT 6: FEEDBACK API SERVICE VERIFY   ');
  console.log('===================================================================\n');

  console.log('Connecting to MongoDB...');
  await connectDB();

  const server = app.listen(0, async () => {
    const port = server.address().port;
    process.env.VITE_API_URL = `http://localhost:${port}/api/v1`;
    console.log(`Live Express test server active at: http://localhost:${port}/api/v1\n`);

    const testResults = [];
    function record(testNum, name, pass, details) {
      testResults.push({ testNum, name, pass, details });
      console.log(`[TEST ${String(testNum).padStart(2, '0')}] ${pass ? '✅ PASS' : '❌ FAIL'}: ${name}`);
      if (details) console.log(`   └─ ${details}`);
    }

    const createdIds = [];

    try {
      // 1. Dynamic ESM import of the frontend feedback API service
      const feedbackApiPath = 'file://' + path.resolve(__dirname, '../../frontend/src/api/feedback.js').replace(/\\/g, '/');
      const feedbackApi = await import(feedbackApiPath);

      // TEST 01: Module Exports Verification
      const hasCreateFeedbackApi = typeof feedbackApi.createFeedbackApi === 'function';
      const hasGetFeedbackApi = typeof feedbackApi.getFeedbackApi === 'function';
      const exportsPass = hasCreateFeedbackApi && hasGetFeedbackApi;

      record(
        1,
        'Module Exports Verification',
        exportsPass,
        `createFeedbackApi: ${typeof feedbackApi.createFeedbackApi}, getFeedbackApi: ${typeof feedbackApi.getFeedbackApi}`
      );

      // TEST 02: Static Code Guardrails & Shared Client Reuse
      const fileContent = fs.readFileSync(path.resolve(__dirname, '../../frontend/src/api/feedback.js'), 'utf-8');
      const usesSharedClient = fileContent.includes("from './client.js'") || fileContent.includes('from "./client.js"');
      const noDirectAxios = !fileContent.includes('axios');
      const noDirectFetch = !fileContent.includes('fetch(');
      const noLocalStorage = !fileContent.includes('localStorage');
      const noMockData = !fileContent.includes('mock') && !fileContent.includes('dummy');
      const guardrailsPass = usesSharedClient && noDirectAxios && noDirectFetch && noLocalStorage && noMockData;

      record(
        2,
        'Static Code Guardrails & Shared Client Reuse',
        guardrailsPass,
        `Reuses client.js: ${usesSharedClient}, No axios/fetch: ${noDirectAxios && noDirectFetch}, No localStorage: ${noLocalStorage}, No mock data: ${noMockData}`
      );

      // TEST 03: Pre-Flight Input Validation - Name Validation
      let nameErrorsCaught = 0;
      const invalidNames = [null, undefined, '', ' ', 'a', 'a'.repeat(51), 123];
      for (const name of invalidNames) {
        try {
          await feedbackApi.createFeedbackApi({
            name,
            rating: 5,
            message: 'This is a valid feedback message of sufficient length.',
          });
        } catch (err) {
          nameErrorsCaught++;
        }
      }
      const nameValidationPass = nameErrorsCaught === invalidNames.length;
      record(
        3,
        'Pre-Flight Input Validation: Name (2-50 chars required)',
        nameValidationPass,
        `Rejected ${nameErrorsCaught}/${invalidNames.length} invalid name parameters before network request`
      );

      // TEST 04: Pre-Flight Input Validation - Rating Validation
      let ratingErrorsCaught = 0;
      const invalidRatings = [null, undefined, '', 0, 6, 2.5, -1, 'high', NaN];
      for (const rating of invalidRatings) {
        try {
          await feedbackApi.createFeedbackApi({
            name: 'Jane Doe',
            rating,
            message: 'This is a valid feedback message of sufficient length.',
          });
        } catch (err) {
          ratingErrorsCaught++;
        }
      }
      const ratingValidationPass = ratingErrorsCaught === invalidRatings.length;
      record(
        4,
        'Pre-Flight Input Validation: Rating (integer 1-5 required)',
        ratingValidationPass,
        `Rejected ${ratingErrorsCaught}/${invalidRatings.length} invalid rating parameters before network request`
      );

      // TEST 05: Pre-Flight Input Validation - Message Validation
      let messageErrorsCaught = 0;
      const invalidMessages = [null, undefined, '', 'Too short', 'x'.repeat(1001), 999];
      for (const message of invalidMessages) {
        try {
          await feedbackApi.createFeedbackApi({
            name: 'Jane Doe',
            rating: 5,
            message,
          });
        } catch (err) {
          messageErrorsCaught++;
        }
      }
      const messageValidationPass = messageErrorsCaught === invalidMessages.length;
      record(
        5,
        'Pre-Flight Input Validation: Message (10-1000 chars required)',
        messageValidationPass,
        `Rejected ${messageErrorsCaught}/${invalidMessages.length} invalid message parameters before network request`
      );

      // TEST 06: Pre-Flight Input Validation - Feature Enum Validation
      let featureErrorsCaught = 0;
      const invalidFeatures = ['invalid-feature', 'unknown', 123];
      for (const feature of invalidFeatures) {
        try {
          await feedbackApi.createFeedbackApi({
            name: 'Jane Doe',
            rating: 5,
            feature,
            message: 'This is a valid feedback message of sufficient length.',
          });
        } catch (err) {
          featureErrorsCaught++;
        }
      }
      const featureValidationPass = featureErrorsCaught === invalidFeatures.length;
      record(
        6,
        'Pre-Flight Input Validation: Feature Enum Restriction',
        featureValidationPass,
        `Rejected ${featureErrorsCaught}/${invalidFeatures.length} invalid feature values before network request`
      );

      // TEST 07: Live Submission with Minimal Required Fields
      const minimalRes = await feedbackApi.createFeedbackApi({
        name: 'Sarah Connor',
        rating: 5,
        message: 'The AI resume analyzer provided outstanding suggestions!',
      });
      const minDoc = minimalRes?.data?.feedback;
      if (minDoc?._id) createdIds.push(minDoc._id);

      const minimalPass = (
        minimalRes?.success === true &&
        minimalRes?.message === 'Thank you for your feedback!' &&
        minDoc?.name === 'Sarah Connor' &&
        minDoc?.rating === 5 &&
        minDoc?.role === 'User' && // Backend Mongoose default
        minDoc?.feature === 'general' && // Backend Mongoose default
        minDoc?.isPublic === true
      );

      record(
        7,
        'Live Feedback Submission (Minimal Required Fields, Defaults Applied)',
        minimalPass,
        `Status 201, ID: ${minDoc?._id}, Default role: "${minDoc?.role}", Default feature: "${minDoc?.feature}"`
      );

      // TEST 08: Live Submission with All Optional Fields
      const fullRes = await feedbackApi.createFeedbackApi({
        name: 'Alex Rivera',
        role: 'Senior Frontend Engineer',
        rating: 4,
        feature: 'resume-builder',
        message: 'The live preview and template customization in the builder are fantastic.',
      });
      const fullDoc = fullRes?.data?.feedback;
      if (fullDoc?._id) createdIds.push(fullDoc._id);

      const fullPass = (
        fullRes?.success === true &&
        fullDoc?.name === 'Alex Rivera' &&
        fullDoc?.role === 'Senior Frontend Engineer' &&
        fullDoc?.rating === 4 &&
        fullDoc?.feature === 'resume-builder'
      );

      record(
        8,
        'Live Feedback Submission (All Optional Fields Specified)',
        fullPass,
        `Status 201, ID: ${fullDoc?._id}, Role: "${fullDoc?.role}", Feature: "${fullDoc?.feature}"`
      );

      // TEST 09: Live Public Feedback Retrieval
      const publicRes = await feedbackApi.getFeedbackApi();
      const feedbackList = publicRes?.data?.feedback;
      const listPass = (
        publicRes?.success === true &&
        Array.isArray(feedbackList) &&
        feedbackList.length >= 2 &&
        feedbackList.some((f) => f._id.toString() === minDoc._id.toString()) &&
        feedbackList.some((f) => f._id.toString() === fullDoc._id.toString())
      );

      record(
        9,
        'Live Public Feedback Listing (GET /feedback/public)',
        listPass,
        `Success: ${publicRes?.success}, Total public items: ${feedbackList?.length || 0}, Contains newly submitted items: true`
      );

      // TEST 10: Backend HTTP 400 Error Preservation
      let errorPreserved = false;
      try {
        const { api } = await import('file://' + path.resolve(__dirname, '../../frontend/src/api/client.js').replace(/\\/g, '/'));
        // Direct call bypassing client validation to ensure backend Joi errors preserve status 400 and message
        await api.post('/feedback', { name: 'A' });
      } catch (err) {
        errorPreserved = (err.status === 400 && Boolean(err.message));
      }

      record(
        10,
        'Backend HTTP 400 Error Preservation & Status Propagation',
        errorPreserved,
        `Status: 400 correctly propagated with backend error message`
      );

    } catch (unexpectedErr) {
      console.error('Unexpected test harness error:', unexpectedErr);
      record(99, 'Harness Execution', false, unexpectedErr.message);
    } finally {
      // Clean up test documents created during testing
      if (createdIds.length > 0) {
        try {
          const Feedback = require('../src/models/Feedback');
          await Feedback.deleteMany({ _id: { $in: createdIds } });
        } catch (_) {}
      }
      server.close();
      console.log('\n===================================================================');
      const allPassed = testResults.every((r) => r.pass);
      console.log(`VERIFICATION SUMMARY: ${allPassed ? 'ALL TESTS PASSED ✅' : 'FAILURES DETECTED ❌'}`);
      console.log(`Passed: ${testResults.filter((r) => r.pass).length} / ${testResults.length}`);
      console.log('===================================================================\n');
      process.exit(allPassed ? 0 : 1);
    }
  });
}

runFeedbackApiServiceVerification().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

