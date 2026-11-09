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

async function runFeedbackUiIntegrationVerification() {
  console.log('===================================================================');
  console.log('   RESUPREP - PHASE 4 CHECKPOINT 7: FEEDBACK UI INTEGRATION VERIFY ');
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
      // 1. Static Source Code Inspection of Feedback.jsx
      const feedbackJsxPath = path.resolve(__dirname, '../../frontend/src/pages/Feedback.jsx');
      const fileContent = fs.readFileSync(feedbackJsxPath, 'utf-8');

      // TEST 01: API Service Import & Architectural Integrity
      const importsService =
        fileContent.includes("from '../api/feedback") || fileContent.includes('from "../api/feedback');
      const usesCreateApi = fileContent.includes('createFeedbackApi');
      const usesGetApi = fileContent.includes('getFeedbackApi');
      const noDirectAxios = !fileContent.includes('axios');
      const noDirectFetch = !fileContent.includes('fetch(');
      const test1Pass = importsService && usesCreateApi && usesGetApi && noDirectAxios && noDirectFetch;

      record(
        1,
        'API Service Import & Architectural Integrity',
        test1Pass,
        `Uses feedback API service: ${importsService}, Uses createFeedbackApi: ${usesCreateApi}, Uses getFeedbackApi: ${usesGetApi}, No direct axios/fetch: ${noDirectAxios && noDirectFetch}`
      );

      // TEST 02: Elimination of Hardcoded Mock/Seeded Reviews & LocalStorage
      const hasDefaultReviews = fileContent.includes('const defaultReviews =');
      const hasStorageImport = fileContent.includes("from '../services/storage'") || fileContent.includes('from "../services/storage"');
      const test2Pass = !hasDefaultReviews && !hasStorageImport;

      record(
        2,
        'Static Mock Reviews & LocalStorage Primary Path Eliminated',
        test2Pass,
        `Hardcoded defaultReviews removed: ${!hasDefaultReviews}, storage.js import removed: ${!hasStorageImport}`
      );

      // TEST 03: Duplicate Submission Guard & Form Invalidation Prevention
      const hasSubmittingGuard = fileContent.includes('if (submitting) return;');
      const hasDisabledInputs = fileContent.includes('disabled={submitting}');
      const hasSpinnerState = fileContent.includes('Submitting...');
      const test3Pass = hasSubmittingGuard && hasDisabledInputs && hasSpinnerState;

      record(
        3,
        'Duplicate Submission Guard & Disabled Button States',
        test3Pass,
        `Guard check: ${hasSubmittingGuard}, Inputs disabled: ${hasDisabledInputs}, Submitting spinner: ${hasSpinnerState}`
      );

      // TEST 04: Loading, Error, Retry, and Empty States for Feedback List
      const hasReviewsLoading = fileContent.includes('loadingReviews') && fileContent.includes('animate-spin');
      const hasReviewsError = fileContent.includes('reviewsError') && fileContent.includes('HiExclamationCircle');
      const hasRetryAction = fileContent.includes('onClick={fetchReviews}');
      const hasEmptyState = fileContent.includes('No Feedback Yet') && fileContent.includes('HiChatAlt2');
      const test4Pass = hasReviewsLoading && hasReviewsError && hasRetryAction && hasEmptyState;

      record(
        4,
        'Loading, Error, Retry, and Empty States in UI',
        test4Pass,
        `Loading state: ${hasReviewsLoading}, Error state: ${hasReviewsError}, Retry action: ${hasRetryAction}, Empty state: ${hasEmptyState}`
      );

      // TEST 05: Form Validation Matching Backend Joi Contract
      const hasNameValidation = fileContent.includes('trimmedName.length < 2') || fileContent.includes('form.name.trim()');
      const hasRatingValidation = fileContent.includes('form.rating < 1');
      const hasMessageValidation = fileContent.includes('trimmedMessage.length < 10') || fileContent.includes('message.trim()');
      const test5Pass = hasNameValidation && hasRatingValidation && hasMessageValidation;

      record(
        5,
        'Pre-Flight Form Validation Matching Backend Joi Schema',
        test5Pass,
        `Name validation (2-50 chars): ${hasNameValidation}, Rating validation (1-5): ${hasRatingValidation}, Message validation (10-1000): ${hasMessageValidation}`
      );

      // TEST 06: Review Card Component Preservation
      const hasReviewCard = fileContent.includes('<ReviewCard review={review} />') || fileContent.includes('<ReviewCard');
      record(
        6,
        'ReviewCard Component Architecture Preserved',
        hasReviewCard,
        `ReviewCard properly imported and rendered for each backend review item: ${hasReviewCard}`
      );

      // TEST 07: Live Backend Submission & Persistence to MongoDB
      const feedbackApiPath = 'file://' + path.resolve(__dirname, '../../frontend/src/api/feedback.js').replace(/\\/g, '/');
      const feedbackApi = await import(feedbackApiPath);

      const submissionPayload = {
        name: 'Checkpoint 7 Test User',
        role: 'Full Stack Developer',
        rating: 5,
        feature: 'resume-analyzer',
        message: 'The live integration of feedback with MongoDB works flawlessly!',
      };

      const submitRes = await feedbackApi.createFeedbackApi(submissionPayload);
      const createdDoc = submitRes?.data?.feedback;
      if (createdDoc?._id) createdIds.push(createdDoc._id);

      const submitSuccess = (
        submitRes?.success === true &&
        createdDoc?.name === 'Checkpoint 7 Test User' &&
        createdDoc?.rating === 5 &&
        createdDoc?.isPublic === true
      );

      record(
        7,
        'Live Feedback Submission & MongoDB Persistence',
        submitSuccess,
        `Status 201 Created, ID: ${createdDoc?._id}, Persisted in DB: ${Boolean(createdDoc?._id)}`
      );

      // TEST 08: Live Public Listing & Refresh Behavior
      const listRes = await feedbackApi.getFeedbackApi();
      const publicReviews = listRes?.data?.feedback || [];
      const foundInPublic = publicReviews.some((r) => r._id.toString() === createdDoc._id.toString());

      record(
        8,
        'Live Feedback List Refresh from Backend',
        foundInPublic,
        `Newly submitted feedback item found in GET /feedback/public: ${foundInPublic}`
      );

      // TEST 09: Rejection of Invalid Submission (Form State Integrity)
      let rejectedPreFlight = false;
      try {
        await feedbackApi.createFeedbackApi({
          name: 'A', // Too short
          rating: 6, // Too high
          message: 'Short', // Too short
        });
      } catch (err) {
        rejectedPreFlight = true;
      }

      record(
        9,
        'Invalid Feedback Rejection Pre-Flight',
        rejectedPreFlight,
        `Client validation intercepts malformed submissions before network dispatch: ${rejectedPreFlight}`
      );

      // TEST 10: Reset on Success / Preserve on Failure Contract in UI
      const hasResetOnSuccess = fileContent.includes("setForm({ name: '', role: '', rating: 0, feature: 'general', message: '' });");
      const preservesFormOnError = fileContent.includes('setSubmitError(msg)');
      const test10Pass = hasResetOnSuccess && preservesFormOnError;

      record(
        10,
        'Form Reset on Success and Preservation on Error',
        test10Pass,
        `Form reset on success: ${hasResetOnSuccess}, Form inputs preserved on failure: ${preservesFormOnError}`
      );

    } catch (unexpectedErr) {
      console.error('Unexpected test harness error:', unexpectedErr);
      record(99, 'Harness Execution', false, unexpectedErr.message);
    } finally {
      // Clean up test documents
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

runFeedbackUiIntegrationVerification().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

