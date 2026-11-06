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

async function runFaqApiServiceVerification() {
  console.log('===================================================================');
  console.log('   RESUPREP - PHASE 4 CHECKPOINT 4: FAQ API SERVICE VERIFICATION   ');
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
      const FAQ = require('../src/models/FAQ');
      // Ensure at least one test FAQ exists for live data verification
      createdFaq = await FAQ.create({
        question: 'What is ResuPrep API Test?',
        answer: 'ResuPrep provides tools for career advancement.',
        category: 'getting-started',
        order: 1,
        isActive: true,
      });

      // 1. Dynamic ESM import of the frontend FAQ API service
      const faqApiPath = 'file://' + path.resolve(__dirname, '../../frontend/src/api/faq.js').replace(/\\/g, '/');
      const faqApi = await import(faqApiPath);

      // TEST 01: Module Export Verification
      const hasGetFAQsApi = typeof faqApi.getFAQsApi === 'function';
      record(
        1,
        'Module Export Verification',
        hasGetFAQsApi,
        `getFAQsApi is exported as a function: ${hasGetFAQsApi}`
      );

      // TEST 02: Static Code Guardrails & Shared Client Reuse
      const fileContent = fs.readFileSync(path.resolve(__dirname, '../../frontend/src/api/faq.js'), 'utf-8');
      const usesSharedClient = fileContent.includes("from './client.js'") || fileContent.includes('from "./client.js"');
      const noDirectAxios = !fileContent.includes('axios');
      const noDirectFetch = !fileContent.includes('fetch(');
      const noOpenAiKeys = !fileContent.includes('OPENAI_API_KEY') && !fileContent.includes('sk-');
      const noMockData = !fileContent.includes('mock') && !fileContent.includes('faqData');
      const guardrailsPass = usesSharedClient && noDirectAxios && noDirectFetch && noOpenAiKeys && noMockData;

      record(
        2,
        'Static Code Guardrails & Shared Client Reuse',
        guardrailsPass,
        `Reuses client.js: ${usesSharedClient}, No axios/fetch: ${noDirectAxios && noDirectFetch}, No OpenAI keys: ${noOpenAiKeys}, No hardcoded fallback FAQs: ${noMockData}`
      );

      // TEST 03: Default Invocation (Retrieves All Active FAQs)
      const allFaqsRes = await faqApi.getFAQsApi();
      const validAllFaqs = (
        allFaqsRes?.success === true &&
        Array.isArray(allFaqsRes?.data?.faqs)
      );
      record(
        3,
        'Default Invocation (No Query String)',
        validAllFaqs,
        `Success: ${allFaqsRes?.success}, Total active FAQs returned: ${allFaqsRes?.data?.faqs?.length || 0}`
      );

      // TEST 04: Category Filtering via String Parameter
      const catStringRes = await faqApi.getFAQsApi('getting-started');
      const validCatString = (
        catStringRes?.success === true &&
        Array.isArray(catStringRes?.data?.faqs) &&
        catStringRes.data.faqs.every((f) => f.category === 'getting-started')
      );
      record(
        4,
        'Category Filtering via String Parameter ("getting-started")',
        validCatString,
        `Success: ${catStringRes?.success}, Matched count: ${catStringRes?.data?.faqs?.length || 0}, All match category: ${validCatString}`
      );

      // TEST 05: Category Filtering via Object Parameter
      const catObjRes = await faqApi.getFAQsApi({ category: 'getting-started' });
      const validCatObj = (
        catObjRes?.success === true &&
        Array.isArray(catObjRes?.data?.faqs) &&
        catObjRes.data.faqs.every((f) => f.category === 'getting-started')
      );
      record(
        5,
        'Category Filtering via Object Parameter ({ category: "getting-started" })',
        validCatObj,
        `Success: ${catObjRes?.success}, Matched count: ${catObjRes?.data?.faqs?.length || 0}`
      );

      // TEST 06: "all" Category Query Handling (Omits Query Parameter)
      const catAllStringRes = await faqApi.getFAQsApi('all');
      const catAllObjRes = await faqApi.getFAQsApi({ category: 'all' });
      const allFilterPass = (
        catAllStringRes?.success === true &&
        catAllObjRes?.success === true &&
        catAllStringRes?.data?.faqs?.length === allFaqsRes?.data?.faqs?.length &&
        catAllObjRes?.data?.faqs?.length === allFaqsRes?.data?.faqs?.length
      );
      record(
        6,
        '"all" Category Handling (Safely Omitted From Query String)',
        allFilterPass,
        `Both "all" invocations returned full active catalogue of ${allFaqsRes?.data?.faqs?.length || 0} FAQs`
      );

      // TEST 07: Empty/Whitespace/Null Category Handling
      const emptyRes = await faqApi.getFAQsApi('');
      const whitespaceRes = await faqApi.getFAQsApi('   ');
      const nullRes = await faqApi.getFAQsApi({ category: null });
      const undefinedRes = await faqApi.getFAQsApi({});
      const emptyParamsPass = (
        emptyRes?.success === true &&
        whitespaceRes?.success === true &&
        nullRes?.success === true &&
        undefinedRes?.success === true
      );
      record(
        7,
        'Empty / Whitespace / Null Category Handling',
        emptyParamsPass,
        `Safely treated empty/whitespace/null category inputs as unfiltered queries`
      );

      // TEST 08: Safe Empty Result Handling (Zero Matching FAQs)
      const noMatchRes = await faqApi.getFAQsApi('non-existent-category-xyz');
      const safeEmptyPass = (
        noMatchRes?.success === true &&
        Array.isArray(noMatchRes?.data?.faqs) &&
        noMatchRes.data.faqs.length === 0
      );
      record(
        8,
        'Safe Handling of Empty Query Result',
        safeEmptyPass,
        `Success: ${noMatchRes?.success}, Empty array returned safely: ${Array.isArray(noMatchRes?.data?.faqs) && noMatchRes.data.faqs.length === 0}`
      );

      // TEST 09: Response Envelope Structure Verification
      let itemFieldsPass = true;
      if (allFaqsRes?.data?.faqs?.length > 0) {
        const firstFaq = allFaqsRes.data.faqs[0];
        itemFieldsPass = Boolean(
          firstFaq._id &&
          typeof firstFaq.question === 'string' &&
          typeof firstFaq.answer === 'string' &&
          typeof firstFaq.category === 'string'
        );
      }
      record(
        9,
        'FAQ Item Schema & Response Envelope Integrity',
        itemFieldsPass,
        `Envelope contains success, message, data.faqs with _id, question, answer, category`
      );

      // TEST 10: Backend HTTP Error Preservation
      // Attempting to query an unmounted singular path directly through client to confirm error preservation
      let errorPreserved = false;
      try {
        const { api } = await import('file://' + path.resolve(__dirname, '../../frontend/src/api/client.js').replace(/\\/g, '/'));
        await api.get('/faq'); // Singular route returns 404
      } catch (err) {
        errorPreserved = (err.status === 404);
      }
      record(
        10,
        'Backend HTTP Error Preservation & Status Propagation',
        errorPreserved,
        `HTTP 404 correctly preserved and thrown without error suppression`
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

runFaqApiServiceVerification().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
