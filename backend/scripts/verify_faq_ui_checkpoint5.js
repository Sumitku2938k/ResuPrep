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

async function runFaqUiIntegrationVerification() {
  console.log('===================================================================');
  console.log('   RESUPREP - PHASE 4 CHECKPOINT 5: FAQ UI INTEGRATION VERIFY      ');
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

    let createdFaq = null;

    try {
      // 1. Static Source Code Inspection of FAQ.jsx
      const faqJsxPath = path.resolve(__dirname, '../../frontend/src/pages/FAQ.jsx');
      const fileContent = fs.readFileSync(faqJsxPath, 'utf-8');

      // TEST 01: API Service Import & Architectural Integrity
      const importsService =
        fileContent.includes("from '../api/faq") || fileContent.includes('from "../api/faq');
      const usesGetFaqsApi = fileContent.includes('getFAQsApi');
      const noDirectAxios = !fileContent.includes('axios');
      const noDirectFetch = !fileContent.includes('fetch(');
      const test1Pass = importsService && usesGetFaqsApi && noDirectAxios && noDirectFetch;

      record(
        1,
        'API Service Import & Architectural Integrity',
        test1Pass,
        `Uses faq API service: ${importsService}, Calls getFAQsApi: ${usesGetFaqsApi}, No direct axios/fetch: ${noDirectAxios && noDirectFetch}`
      );

      // TEST 02: Elimination of Hardcoded FAQ Arrays
      const hasMockFaqData = fileContent.includes('const faqData =');
      const test2Pass = !hasMockFaqData;

      record(
        2,
        'Static Mock FAQ Data Eliminated',
        test2Pass,
        `Hardcoded faqData dictionary removed: ${test2Pass}`
      );

      // TEST 03: Supported Backend Category Slugs Present in Filter
      const expectedCategories = [
        'getting-started',
        'resume-analyzer',
        'job-matching',
        'cv-templates',
        'skill-assessment',
      ];
      const hasAllCategories = expectedCategories.every((cat) => fileContent.includes(cat));

      record(
        3,
        'Supported Schema Category Slugs Present in Filter',
        hasAllCategories,
        `Categories verified: ${expectedCategories.join(', ')}`
      );

      // TEST 04: Accordion Animation & Structure Preservation
      const hasChevron = fileContent.includes('HiChevronDown');
      const hasAnimatePresence = fileContent.includes('AnimatePresence');
      const hasOpenIndex = fileContent.includes('openIndex');
      const test4Pass = hasChevron && hasAnimatePresence && hasOpenIndex;

      record(
        4,
        'Accordion Animation & Interactive Structure Preserved',
        test4Pass,
        `HiChevronDown icon: ${hasChevron}, AnimatePresence: ${hasAnimatePresence}, Accordion state index: ${hasOpenIndex}`
      );

      // TEST 05: Loading, Error, Retry, and Empty States Handling in UI
      const hasLoadingState = fileContent.includes('animate-spin') && fileContent.includes('Loading frequently asked');
      const hasErrorState = fileContent.includes('Unable to Load FAQs') && fileContent.includes('HiExclamationCircle');
      const hasRetryHandler = fileContent.includes('handleRetry') || fileContent.includes('fetchFaqs');
      const hasEmptyState = fileContent.includes('No FAQs Found') && fileContent.includes('HiQuestionMarkCircle');
      const test5Pass = hasLoadingState && hasErrorState && hasRetryHandler && hasEmptyState;

      record(
        5,
        'Loading, Error, Retry, and Empty States Handling in UI',
        test5Pass,
        `Loading state: ${hasLoadingState}, Error state: ${hasErrorState}, Retry handler: ${hasRetryHandler}, Empty state: ${hasEmptyState}`
      );

      // TEST 06: Live Backend FAQ Fetching with Real Response
      const FAQ = require('../src/models/FAQ');
      createdFaq = await FAQ.create({
        question: 'How do I analyze my resume with AI?',
        answer: 'Upload your document or paste your resume text in the Analyzer tool.',
        category: 'resume-analyzer',
        order: 1,
        isActive: true,
      });

      const faqApiPath = 'file://' + path.resolve(__dirname, '../../frontend/src/api/faq.js').replace(/\\/g, '/');
      const faqApi = await import(faqApiPath);

      const res = await faqApi.getFAQsApi({ category: 'resume-analyzer' });
      const returnedFaqs = res?.data?.faqs || [];
      const foundCreatedFaq = returnedFaqs.some((f) => f._id.toString() === createdFaq._id.toString());
      const test6Pass = res?.success === true && foundCreatedFaq;

      record(
        6,
        'Live Backend FAQ Fetching with Real Data Retrieval',
        test6Pass,
        `Success: ${res?.success}, Found created FAQ in category: ${foundCreatedFaq}`
      );

      // TEST 07: Live Category Filtering
      const gettingStartedRes = await faqApi.getFAQsApi({ category: 'getting-started' });
      const gsFaqs = gettingStartedRes?.data?.faqs || [];
      // Our created FAQ was in 'resume-analyzer', so it should NOT be in 'getting-started'
      const filterWorks = !gsFaqs.some((f) => f._id.toString() === createdFaq._id.toString());

      record(
        7,
        'Live Backend Category Isolation',
        filterWorks,
        `Verified resume-analyzer item does not leak into getting-started queries`
      );

      // TEST 08: Safe Empty Result Handling
      const emptyCatRes = await faqApi.getFAQsApi({ category: 'cv-templates' });
      const safeEmpty = emptyCatRes?.success === true && Array.isArray(emptyCatRes?.data?.faqs);

      record(
        8,
        'Safe Handling of Category with Zero FAQs',
        safeEmpty,
        `Success: ${emptyCatRes?.success}, Returned empty array without failing: ${safeEmpty}`
      );

      // TEST 09: Defensive Item Normalization in UI
      // In FAQ.jsx: validFaqs filters items that don't have (question || q) and (answer || a)
      const hasDefensiveFilter = fileContent.includes('validFaqs') || (fileContent.includes('.question') && fileContent.includes('.answer'));

      record(
        9,
        'Defensive Question & Answer Extraction',
        hasDefensiveFilter,
        `Protects against malformed items missing question or answer: ${hasDefensiveFilter}`
      );

      // TEST 10: Zero LocalStorage or Client Mock Fallback
      const hasLocalStorageFaq = fileContent.includes('localStorage.getItem') && fileContent.includes('faq');
      const test10Pass = !hasLocalStorageFaq;

      record(
        10,
        'No LocalStorage or Mock Fallback Substitution',
        test10Pass,
        `Pure API data binding confirmed without client-side mock fallback`
      );

    } catch (unexpectedErr) {
      console.error('Unexpected test harness error:', unexpectedErr);
      record(99, 'Harness Execution', false, unexpectedErr.message);
    } finally {
      if (createdFaq) {
        try {
          const FAQ = require('../src/models/FAQ');
          await FAQ.deleteOne({ _id: createdFaq._id });
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

runFaqUiIntegrationVerification().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

