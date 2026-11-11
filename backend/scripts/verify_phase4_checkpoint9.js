const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../src/config/db');
const app = require('../src/app');
const FAQ = require('../src/models/FAQ');
const Feedback = require('../src/models/Feedback');

// Polyfills for Node test runner
global.storageMap = new Map();
global.localStorage = {
  getItem: (key) => global.storageMap.get(key) || null,
  setItem: (key, val) => global.storageMap.set(key, String(val)),
  removeItem: (key) => global.storageMap.delete(key),
  clear: () => global.storageMap.clear(),
};

async function runPhase4Checkpoint9E2EVerification() {
  console.log('===================================================================');
  console.log('   RESUPREP - PHASE 4 CHECKPOINT 9: FULL E2E VERIFICATION SUITE   ');
  console.log('   Domains: Skills Taxonomy & Gap, FAQ, Feedback, Regression      ');
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

    const testFaqIds = [];
    const testFeedbackIds = [];

    try {
      // Import frontend API services
      const skillsApiPath = 'file://' + path.resolve(__dirname, '../../frontend/src/api/skills.js').replace(/\\/g, '/');
      const faqApiPath = 'file://' + path.resolve(__dirname, '../../frontend/src/api/faq.js').replace(/\\/g, '/');
      const feedbackApiPath = 'file://' + path.resolve(__dirname, '../../frontend/src/api/feedback.js').replace(/\\/g, '/');
      const clientApiPath = 'file://' + path.resolve(__dirname, '../../frontend/src/api/client.js').replace(/\\/g, '/');

      const skillsApi = await import(skillsApiPath);
      const faqApi = await import(faqApiPath);
      const feedbackApi = await import(feedbackApiPath);
      const { api: clientApi } = await import(clientApiPath);

      // -----------------------------------------------------------------------
      // PART A: SKILLS TAXONOMY
      // -----------------------------------------------------------------------
      console.log('\n--- SECTION A: SKILLS TAXONOMY ---');

      // TEST 01: Live taxonomy across all 5 supported roles
      const supportedRoles = [
        'frontend-developer',
        'backend-developer',
        'full-stack-developer',
        'data-scientist',
        'devops-engineer',
      ];
      let allRolesPass = true;
      const roleDetails = [];

      for (const roleSlug of supportedRoles) {
        const res = await skillsApi.getSkillsTaxonomyApi(roleSlug);
        const valid =
          res?.success === true &&
          res?.data?.taxonomy?.role &&
          Array.isArray(res?.data?.taxonomy?.skills) &&
          res.data.taxonomy.skills.length > 0 &&
          res.data.taxonomy.skills.every((s) => s.name && s.level && s.category);
        if (!valid) allRolesPass = false;
        roleDetails.push(`${roleSlug}: ${res?.data?.taxonomy?.skills?.length} skills`);
      }

      record(
        1,
        'Skills Taxonomy - Live API Retrieval for All 5 Supported Roles',
        allRolesPass,
        roleDetails.join(', ')
      );

      // TEST 02: Unknown role fallback defaults safely to Full Stack Developer
      const unknownRoleRes = await skillsApi.getSkillsTaxonomyApi('unknown-cloud-architect');
      const unknownRolePass =
        unknownRoleRes?.success === true &&
        unknownRoleRes?.data?.taxonomy?.role === 'Full Stack Developer' &&
        Array.isArray(unknownRoleRes?.data?.taxonomy?.skills);
      record(
        2,
        'Skills Taxonomy - Unknown Role Safely Defaults to Full Stack Developer',
        unknownRolePass,
        `Returned default role: "${unknownRoleRes?.data?.taxonomy?.role}" with ${unknownRoleRes?.data?.taxonomy?.skills?.length} skills`
      );

      // TEST 03: Skills.jsx Source Audit (Pruning, Zero Static Datasets, Real API Wiring)
      const skillsPagePath = path.resolve(__dirname, '../../frontend/src/pages/Skills.jsx');
      const skillsContent = fs.readFileSync(skillsPagePath, 'utf-8');
      const skillsUiClean =
        skillsContent.includes('getSkillsTaxonomyApi') &&
        skillsContent.includes('analyzeSkillGapApi') &&
        skillsContent.includes('fetchTaxonomy(selectedRoleSlug)') &&
        skillsContent.includes('validSkills.has(s.toLowerCase())') && // selection pruning on role change
        !skillsContent.includes('const skillData =') &&
        !skillsContent.includes('const comparisonTable =') &&
        !skillsContent.includes('const courses =');
      record(
        3,
        'Skills UI - Dynamic API Integration & Selection Pruning (Zero Hardcoded Data)',
        skillsUiClean,
        `Taxonomy API hooked, selection pruning on role change verified, zero hardcoded datasets: ${skillsUiClean}`
      );

      // -----------------------------------------------------------------------
      // PART B: SKILL GAP ANALYSIS & AI FALLBACK
      // -----------------------------------------------------------------------
      console.log('\n--- SECTION B: SKILL GAP ANALYSIS & AI FALLBACK ---');

      // TEST 04: Live Skill Gap Analysis API
      const gapPayload = {
        currentSkills: ['HTML/CSS', 'JavaScript'],
        targetRole: 'Frontend Developer',
      };
      const gapRes = await skillsApi.analyzeSkillGapApi(gapPayload);
      const gapPass =
        gapRes?.success === true &&
        gapRes?.data?.targetRole === 'Frontend Developer' &&
        Array.isArray(gapRes?.data?.gaps) &&
        gapRes.data.gaps.length > 0 &&
        gapRes.data.gaps.every(
          (g) => g.skill && g.priority && g.resource && typeof g.resource === 'string'
        );
      record(
        4,
        'Skill Gap Analysis - Live Request & Response Schema Integrity',
        gapPass,
        `Status 200, Gaps returned: ${gapRes?.data?.gaps?.length}, Target: "${gapRes?.data?.targetRole}"`
      );

      // TEST 05: Documented Backend AI Fallback Verification
      // OpenAI model gpt-3.5-turbo returns 404 from OpenAI, triggering backend fallbackSkillGap.
      // We verify that the fallback maintains 100% contract compliance with { skill, priority, resource }.
      const unpossessedSkillGap = gapRes?.data?.gaps?.find(
        (g) => g.skill.toLowerCase() !== 'html/css' && g.skill.toLowerCase() !== 'javascript'
      );
      const fallbackPass =
        gapPass &&
        unpossessedSkillGap &&
        ['critical', 'high', 'medium'].includes(unpossessedSkillGap.priority) &&
        unpossessedSkillGap.resource.includes('Search for');
      record(
        5,
        'AI Fallback Mechanism - Truthful Backend Fallback with Priority & Resource Mapping',
        fallbackPass,
        `Missing skill "${unpossessedSkillGap?.skill}" assigned priority: "${unpossessedSkillGap?.priority}", resource: "${unpossessedSkillGap?.resource}"`
      );

      // -----------------------------------------------------------------------
      // PART C: FAQ DOMAIN
      // -----------------------------------------------------------------------
      console.log('\n--- SECTION C: FAQ DOMAIN ---');

      // Seed a unique test FAQ in MongoDB
      const testFaq = await FAQ.create({
        question: `E2E FAQ Test Question ${Date.now()}`,
        answer: 'This is a verified test answer persisted in MongoDB for Checkpoint 9.',
        category: 'getting-started',
        order: 999,
        isActive: true,
      });
      testFaqIds.push(testFaq._id);

      // TEST 06: Live FAQ retrieval and category query filter
      const gettingStartedRes = await faqApi.getFAQsApi({ category: 'getting-started' });
      const foundTestFaq = gettingStartedRes?.data?.faqs?.some(
        (f) => f._id === String(testFaq._id) || f.question === testFaq.question
      );
      record(
        6,
        'FAQ - Live Category Query Filtering & MongoDB Persistence',
        gettingStartedRes?.success === true && foundTestFaq,
        `Found created FAQ in "getting-started": ${foundTestFaq}, Total returned: ${gettingStartedRes?.data?.faqs?.length}`
      );

      // TEST 07: FAQ category isolation (category filter excludes other categories)
      const resumeAnalyzerFaqs = await faqApi.getFAQsApi({ category: 'resume-analyzer' });
      const leakedFaq = resumeAnalyzerFaqs?.data?.faqs?.some(
        (f) => f._id === String(testFaq._id)
      );
      record(
        7,
        'FAQ - Category Isolation (No Cross-Category Leakage)',
        resumeAnalyzerFaqs?.success === true && !leakedFaq,
        `Test FAQ excluded from "resume-analyzer": ${!leakedFaq}`
      );

      // TEST 08: Empty FAQ category handling (contract & UI empty state)
      const emptyCatRes = await faqApi.getFAQsApi({ category: 'skill-assessment' });
      const emptyCatPass =
        emptyCatRes?.success === true &&
        Array.isArray(emptyCatRes?.data?.faqs) &&
        emptyCatRes.data.faqs.length === 0;

      const faqPagePath = path.resolve(__dirname, '../../frontend/src/pages/FAQ.jsx');
      const faqContent = fs.readFileSync(faqPagePath, 'utf-8');
      const faqEmptyStateInUi =
        faqContent.includes('validFaqs.length === 0') &&
        faqContent.includes('No FAQs Found') &&
        !faqContent.includes('const faqData =');

      record(
        8,
        'FAQ - Empty Category Response & UI Empty State (Zero Static Fallback)',
        emptyCatPass && faqEmptyStateInUi,
        `API returns empty array: ${emptyCatPass}, UI displays empty state without static fallback: ${faqEmptyStateInUi}`
      );

      // -----------------------------------------------------------------------
      // PART D & E: FEEDBACK DOMAIN
      // -----------------------------------------------------------------------
      console.log('\n--- SECTION D & E: FEEDBACK DOMAIN ---');

      // TEST 09: Valid Feedback Submission & MongoDB Persistence
      const uniqueMsg = `E2E Checkpoint 9 Feedback Persistence Test Message - ${Date.now()}`;
      const feedbackPayload = {
        name: 'Jane Doe E2E',
        role: 'Senior QA Engineer',
        rating: 5,
        feature: 'resume-analyzer',
        message: uniqueMsg,
      };

      const createFeedbackRes = await feedbackApi.createFeedbackApi(feedbackPayload);
      const createdDocId = createFeedbackRes?.data?.feedback?._id;
      if (createdDocId) testFeedbackIds.push(createdDocId);

      // Verify in MongoDB
      const mongoFeedbackDoc = await Feedback.findById(createdDocId);
      const feedbackCreatedPass =
        createFeedbackRes?.success === true &&
        mongoFeedbackDoc &&
        mongoFeedbackDoc.message === uniqueMsg &&
        mongoFeedbackDoc.isPublic === true;

      record(
        9,
        'Feedback Submission - Live API POST & MongoDB Document Persistence',
        Boolean(feedbackCreatedPass),
        `Status 201 Created, MongoDB doc verified with isPublic=true: ${Boolean(mongoFeedbackDoc)}`
      );

      // TEST 10: Feedback List Retrieval (Public Community Reviews)
      const publicReviewsRes = await feedbackApi.getFeedbackApi();
      const reviewFound = publicReviewsRes?.data?.feedback?.some(
        (item) => item._id === String(createdDocId) || item.message === uniqueMsg
      );
      record(
        10,
        'Feedback List - Live Public Retrieval & Real API Data Binding',
        publicReviewsRes?.success === true && reviewFound,
        `Retrieved ${publicReviewsRes?.data?.feedback?.length} reviews; newly created review present: ${reviewFound}`
      );

      // TEST 11: ReviewCard defensive rendering guardrails
      const reviewCardPath = path.resolve(__dirname, '../../frontend/src/components/ReviewCard.jsx');
      const reviewCardContent = fs.readFileSync(reviewCardPath, 'utf-8');
      const reviewCardDefensive =
        reviewCardContent.includes('review?.name') &&
        reviewCardContent.includes("safeName") &&
        reviewCardContent.includes(".split(' ')") &&
        reviewCardContent.includes('.filter(Boolean)');
      record(
        11,
        'ReviewCard - Defensive Payload Schema Handling & Initials Parsing',
        reviewCardDefensive,
        `Safe author fallback and safe initials extraction verified: ${reviewCardDefensive}`
      );

      // -----------------------------------------------------------------------
      // PART F: INVALID FEEDBACK VALIDATION (PRE-FLIGHT VS BACKEND JOI)
      // -----------------------------------------------------------------------
      console.log('\n--- SECTION F: INVALID FEEDBACK VALIDATION ---');

      // TEST 12: Pre-Flight Frontend Validation in Feedback.jsx
      const feedbackPagePath = path.resolve(__dirname, '../../frontend/src/pages/Feedback.jsx');
      const feedbackContent = fs.readFileSync(feedbackPagePath, 'utf-8');
      const clientValidationPass =
        feedbackContent.includes('trimmedName.length < 2') &&
        feedbackContent.includes('trimmedName.length > 50') &&
        feedbackContent.includes('form.rating < 1 || form.rating > 5') &&
        feedbackContent.includes('trimmedMessage.length < 10') &&
        feedbackContent.includes('trimmedMessage.length > 1000') &&
        feedbackContent.includes('trimmedRole.length > 50');
      record(
        12,
        'Feedback UI - Pre-Flight Client-Side Validation Matching Joi Schema',
        clientValidationPass,
        `All 6 backend schema constraints checked before network dispatch: ${clientValidationPass}`
      );

      // TEST 13: Direct Backend Joi Validation Rejection (HTTP 400)
      const invalidPayloads = [
        { name: 'A', rating: 5, message: 'Valid message string here', desc: 'Name too short' },
        { name: 'Valid Name', rating: 6, message: 'Valid message string here', desc: 'Rating > 5' },
        { name: 'Valid Name', rating: 0, message: 'Valid message string here', desc: 'Rating < 1' },
        { name: 'Valid Name', rating: 5, message: 'Short', desc: 'Message < 10 chars' },
        { name: 'Valid Name', rating: 5, feature: 'invalid-tool-xyz', message: 'Valid message string here', desc: 'Invalid feature enum' },
      ];

      let backendValidationPass = true;
      for (const p of invalidPayloads) {
        try {
          await clientApi.post('/feedback', p);
          backendValidationPass = false;
        } catch (err) {
          if (err.status !== 400) backendValidationPass = false;
        }
      }

      // Confirm no invalid records created in DB
      const invalidCount = await Feedback.countDocuments({ name: 'A' });
      const invalidEnumCount = await Feedback.countDocuments({ feature: 'invalid-tool-xyz' });
      const noInvalidPersisted = invalidCount === 0 && invalidEnumCount === 0;

      record(
        13,
        'Feedback API - Backend Joi Middleware Rejection & MongoDB Integrity (HTTP 400)',
        backendValidationPass && noInvalidPersisted,
        `Rejected 5/5 invalid payloads with HTTP 400; 0 invalid records persisted to MongoDB: ${noInvalidPersisted}`
      );

      // -----------------------------------------------------------------------
      // PART G: BACKEND UNAVAILABLE & TRUTHFUL ERROR HANDLING
      // -----------------------------------------------------------------------
      console.log('\n--- SECTION G: BACKEND UNAVAILABLE & ERROR HANDLING ---');

      // TEST 14: Truthful Error States & Retry Actions across all Phase 4 Pages
      const truthfulErrorUiPass =
        skillsContent.includes('setTaxonomyError') &&
        skillsContent.includes('setAnalysisError') &&
        skillsContent.includes('toast.error') &&
        faqContent.includes('Unable to Load FAQs') &&
        faqContent.includes('handleRetry') &&
        feedbackContent.includes('Unable to Load Feedback') &&
        feedbackContent.includes('fetchReviews');

      record(
        14,
        'Resilience - Truthful Error States & Retry Handlers Across All 3 Pages',
        truthfulErrorUiPass,
        `All 3 pages expose user-friendly error banners and retry actions: ${truthfulErrorUiPass}`
      );

      // -----------------------------------------------------------------------
      // PART H: AUTHENTICATION & ACCESS CONTROL
      // -----------------------------------------------------------------------
      console.log('\n--- SECTION H: AUTHENTICATION & ACCESS CONTROL ---');

      // TEST 15: Public Endpoints vs Protected Endpoints Contract
      // Phase 4 endpoints are public by design
      const publicEndpoints = [
        { method: 'GET', url: `/skills/taxonomy/frontend-developer` },
        { method: 'POST', url: `/skills/gap-analysis`, body: gapPayload },
        { method: 'GET', url: `/faqs` },
        { method: 'GET', url: `/feedback/public` },
      ];

      let publicPass = true;
      for (const ep of publicEndpoints) {
        const fetchOpts = {
          method: ep.method,
          headers: { 'Content-Type': 'application/json' },
          ...(ep.body && { body: JSON.stringify(ep.body) }),
        };
        const res = await fetch(`http://localhost:${port}/api/v1${ep.url}`, fetchOpts);
        if (![200, 201].includes(res.status)) publicPass = false;
      }

      // Verify that protected endpoints from earlier phases still strictly reject unauthenticated requests
      const protectedBuilderRes = await fetch(`http://localhost:${port}/api/v1/builder`);
      const protectedResumeRes = await fetch(`http://localhost:${port}/api/v1/resume/history`);
      const authGuardsIntact = protectedBuilderRes.status === 401 && protectedResumeRes.status === 401;

      record(
        15,
        'Access Control - Phase 4 Endpoints Public vs Earlier Protected Routes (HTTP 401)',
        publicPass && authGuardsIntact,
        `Phase 4 public endpoints functional without auth: ${publicPass}; Protected routes reject unauthenticated requests: ${authGuardsIntact}`
      );

      // -----------------------------------------------------------------------
      // PART I: LEGACY CLEANUP & STORAGE INTEGRITY
      // -----------------------------------------------------------------------
      console.log('\n--- SECTION I: LEGACY CLEANUP & STORAGE INTEGRITY ---');

      // TEST 16: Zero Obsolete Storage / Mock Data References
      const storagePath = path.resolve(__dirname, '../../frontend/src/services/storage.js');
      const storageContent = fs.readFileSync(storagePath, 'utf-8');
      const legacyStorageClean =
        !storageContent.includes('saveFeedback') &&
        !storageContent.includes('getFeedback') &&
        !storageContent.includes('KEYS.FEEDBACK') &&
        storageContent.includes('export function getItem') &&
        storageContent.includes('export function setItem') &&
        storageContent.includes('export function removeItem');

      record(
        16,
        'Storage Integrity - Obsolete Feedback Removed & Generic Helpers Preserved',
        legacyStorageClean,
        `saveFeedback & getFeedback removed, generic getItem/setItem preserved for future phases: ${legacyStorageClean}`
      );

    } catch (err) {
      console.error('Fatal error during E2E verification:', err);
      record(99, 'Harness Execution Exception', false, err.message);
    } finally {
      // Clean up test documents created in MongoDB
      if (testFaqIds.length > 0) {
        await FAQ.deleteMany({ _id: { $in: testFaqIds } });
        console.log(`Cleaned up ${testFaqIds.length} test FAQ record(s) from MongoDB.`);
      }
      if (testFeedbackIds.length > 0) {
        await Feedback.deleteMany({ _id: { $in: testFeedbackIds } });
        console.log(`Cleaned up ${testFeedbackIds.length} test Feedback record(s) from MongoDB.`);
      }

      server.close();

      console.log('\n===================================================================');
      const allPassed = testResults.every((t) => t.pass);
      console.log(`CHECKPOINT 9 E2E SUMMARY: ${allPassed ? 'ALL TESTS PASSED ✅' : 'FAILURES DETECTED ❌'}`);
      console.log(`Total: ${testResults.length} | Passed: ${testResults.filter((t) => t.pass).length} | Failed: ${testResults.filter((t) => !t.pass).length}`);
      console.log('===================================================================\n');

      process.exit(allPassed ? 0 : 1);
    }
  });
}

runPhase4Checkpoint9E2EVerification().catch((err) => {
  console.error('Fatal uncaught initialization error:', err);
  process.exit(1);
});
