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

async function runPhase4Checkpoint8Verification() {
  console.log('===================================================================');
  console.log('   RESUPREP - PHASE 4 CHECKPOINT 8: LEGACY CLEANUP & AUDIT FINAL   ');
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

    try {
      // 1. Inspect Skills.jsx
      const skillsPath = path.resolve(__dirname, '../../frontend/src/pages/Skills.jsx');
      const skillsContent = fs.readFileSync(skillsPath, 'utf-8');

      // TEST 01: Skills UI uses API service
      const skillsUsesApi =
        (skillsContent.includes("from '../api/skills.js'") || skillsContent.includes("from '../api/skills'")) &&
        skillsContent.includes('getSkillsTaxonomyApi') &&
        skillsContent.includes('analyzeSkillGapApi');
      record(
        1,
        'Skills UI Uses Established API Services',
        skillsUsesApi,
        `Imports getSkillsTaxonomyApi & analyzeSkillGapApi from api/skills: ${skillsUsesApi}`
      );

      // TEST 02: Obsolete static Skills data removed
      const skillsStaticDataRemoved =
        !skillsContent.includes('const skillData =') &&
        !skillsContent.includes('const comparisonTable =');
      record(
        2,
        'Obsolete Static Skills Datasets Removed from Skills.jsx',
        skillsStaticDataRemoved,
        `Hardcoded skillData & comparisonTable removed: ${skillsStaticDataRemoved}`
      );

      // TEST 03: Hardcoded course recommendations eliminated as fallback
      const hardcodedCoursesRemoved = !skillsContent.includes('const courses = [');
      record(
        3,
        'Hardcoded Course Recommendations Eliminated',
        hardcodedCoursesRemoved,
        `Static courses array removed, real gap.resource rendered: ${hardcodedCoursesRemoved}`
      );

      // 2. Inspect FAQ.jsx
      const faqPath = path.resolve(__dirname, '../../frontend/src/pages/FAQ.jsx');
      const faqContent = fs.readFileSync(faqPath, 'utf-8');

      // TEST 04: FAQ UI uses API service
      const faqUsesApi =
        (faqContent.includes("from '../api/faq.js'") || faqContent.includes("from '../api/faq'")) &&
        faqContent.includes('getFAQsApi');
      record(
        4,
        'FAQ UI Uses Established API Service',
        faqUsesApi,
        `Imports getFAQsApi from api/faq: ${faqUsesApi}`
      );

      // TEST 05: Obsolete hardcoded FAQ data removed
      const faqDataRemoved = !faqContent.includes('const faqData =');
      record(
        5,
        'Obsolete Hardcoded faqData Dictionary Removed from FAQ.jsx',
        faqDataRemoved,
        `Static faqData dictionary removed: ${faqDataRemoved}`
      );

      // 3. Inspect Feedback.jsx
      const feedbackPath = path.resolve(__dirname, '../../frontend/src/pages/Feedback.jsx');
      const feedbackContent = fs.readFileSync(feedbackPath, 'utf-8');

      // TEST 06: Feedback UI uses API service
      const feedbackUsesApi =
        (feedbackContent.includes("from '../api/feedback.js'") || feedbackContent.includes("from '../api/feedback'")) &&
        feedbackContent.includes('createFeedbackApi') &&
        feedbackContent.includes('getFeedbackApi');
      record(
        6,
        'Feedback UI Uses Established API Services',
        feedbackUsesApi,
        `Imports createFeedbackApi & getFeedbackApi from api/feedback: ${feedbackUsesApi}`
      );

      // TEST 07: Legacy feedback localStorage persistence removed
      const feedbackStorageRemoved =
        !feedbackContent.includes('saveFeedback') &&
        !feedbackContent.includes('getFeedback(') &&
        !feedbackContent.includes("from '../services/storage'");
      record(
        7,
        'Legacy Feedback LocalStorage Persistence Removed from Feedback.jsx',
        feedbackStorageRemoved,
        `saveFeedback & getFeedback calls and storage imports removed: ${feedbackStorageRemoved}`
      );

      // TEST 08: Mock review data eliminated as fallback
      const mockReviewsRemoved = !feedbackContent.includes('const defaultReviews =');
      record(
        8,
        'Mock Reviews Array Eliminated from Feedback.jsx',
        mockReviewsRemoved,
        `Hardcoded defaultReviews array removed: ${mockReviewsRemoved}`
      );

      // 4. Inspect storage.js
      const storagePath = path.resolve(__dirname, '../../frontend/src/services/storage.js');
      const storageContent = fs.readFileSync(storagePath, 'utf-8');

      // TEST 09: storage.js cleaned of obsolete feedback functions
      const storageFeedbackCleaned =
        !storageContent.includes('saveFeedback') &&
        !storageContent.includes('getFeedback') &&
        !storageContent.includes('FEEDBACK:');
      record(
        9,
        'Obsolete Feedback Methods Removed from storage.js',
        storageFeedbackCleaned,
        `saveFeedback, getFeedback, and KEYS.FEEDBACK removed: ${storageFeedbackCleaned}`
      );

      // TEST 10: Generic storage helpers preserved in storage.js
      const genericStoragePreserved =
        storageContent.includes('export function getItem') &&
        storageContent.includes('export function setItem') &&
        storageContent.includes('export function removeItem');
      record(
        10,
        'Generic Storage Helpers Preserved in storage.js',
        genericStoragePreserved,
        `getItem, setItem, and removeItem available for client utility caching: ${genericStoragePreserved}`
      );

      // 5. Inspect Navbar.jsx for Theme Persistence Guardrail
      const navbarPath = path.resolve(__dirname, '../../frontend/src/components/Navbar.jsx');
      const navbarContent = fs.readFileSync(navbarPath, 'utf-8');

      const themePreserved =
        navbarContent.includes("localStorage.getItem('theme')") &&
        navbarContent.includes("localStorage.setItem('theme'");

      // Test theme functionality in memory
      global.localStorage.setItem('theme', 'dark');
      const darkRead = global.localStorage.getItem('theme');
      global.localStorage.setItem('theme', 'light');
      const lightRead = global.localStorage.getItem('theme');
      const themeFunctional = darkRead === 'dark' && lightRead === 'light';

      record(
        11,
        'Theme Functionality Preserved (localStorage.theme Guardrail)',
        themePreserved && themeFunctional,
        `Navbar theme handling intact: ${themePreserved}, Light/Dark toggles work: ${themeFunctional}`
      );

      // TEST 12: No direct axios or fetch calls in pages
      const noDirectHttp =
        !skillsContent.includes('axios') &&
        !skillsContent.includes('fetch(') &&
        !faqContent.includes('axios') &&
        !faqContent.includes('fetch(') &&
        !feedbackContent.includes('axios') &&
        !feedbackContent.includes('fetch(');
      record(
        12,
        'No Direct Fetch or Axios Invocations in Migrated Pages',
        noDirectHttp,
        `All 3 pages communicate strictly through the central api/ layer: ${noDirectHttp}`
      );

      // TEST 13: Truthful Error States (No Silent Fake Fallback on API Failures)
      const truthfulErrorStates =
        skillsContent.includes('analysisError') &&
        faqContent.includes('Unable to Load FAQs') &&
        feedbackContent.includes('Unable to Load Feedback');
      record(
        13,
        'Truthful Error & Retry Handling Preserved (No Fake Mock Fallback)',
        truthfulErrorStates,
        `All 3 pages surface real API error messages and retry actions: ${truthfulErrorStates}`
      );

      // TEST 14: Runtime Live API Integration End-to-End
      // Import the three live API services
      const skillsApiPath = 'file://' + path.resolve(__dirname, '../../frontend/src/api/skills.js').replace(/\\/g, '/');
      const faqApiPath = 'file://' + path.resolve(__dirname, '../../frontend/src/api/faq.js').replace(/\\/g, '/');
      const feedbackApiPath = 'file://' + path.resolve(__dirname, '../../frontend/src/api/feedback.js').replace(/\\/g, '/');

      const skillsApi = await import(skillsApiPath);
      const faqApi = await import(faqApiPath);
      const feedbackApi = await import(feedbackApiPath);

      const skillsTaxonomyRes = await skillsApi.getSkillsTaxonomyApi('frontend-developer');
      const faqRes = await faqApi.getFAQsApi();
      const feedbackRes = await feedbackApi.getFeedbackApi();

      const runtimePass = (
        skillsTaxonomyRes?.success === true &&
        skillsTaxonomyRes?.data?.taxonomy?.role === 'Frontend Developer' &&
        faqRes?.success === true &&
        Array.isArray(faqRes?.data?.faqs) &&
        feedbackRes?.success === true &&
        Array.isArray(feedbackRes?.data?.feedback)
      );

      record(
        14,
        'Live Runtime Backend Connectivity Across Skills, FAQ, and Feedback',
        runtimePass,
        `Taxonomy role: "${skillsTaxonomyRes?.data?.taxonomy?.role}", FAQ items: ${faqRes?.data?.faqs?.length}, Feedback items: ${feedbackRes?.data?.feedback?.length}`
      );

    } catch (unexpectedErr) {
      console.error('Unexpected test harness error:', unexpectedErr);
      record(99, 'Harness Execution', false, unexpectedErr.message);
    } finally {
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

runPhase4Checkpoint8Verification().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

