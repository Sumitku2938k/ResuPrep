const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../src/config/db');
const app = require('../src/app');
const FAQ = require('../src/models/FAQ');
const Feedback = require('../src/models/Feedback');

async function runPhase4AuditVerification() {
  console.log('===================================================================');
  console.log('   RESUPREP - PHASE 4 CHECKPOINT 1: BACKEND CONTRACT AUDIT         ');
  console.log('   Features: Skills Gap, FAQ, Feedback                             ');
  console.log('===================================================================\n');

  console.log('Connecting to MongoDB...');
  await connectDB();

  const server = app.listen(0, async () => {
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}/api/v1`;
    console.log(`Test Express server running at: ${baseUrl}\n`);

    const testResults = [];
    function record(testNum, name, pass, details) {
      testResults.push({ testNum, name, pass, details });
      console.log(`[TEST ${testNum.toString().padStart(2, '0')}] ${pass ? '✅ PASS' : '❌ FAIL'}: ${name}`);
      if (details) console.log(`    └─ ${details}`);
    }

    const createdFeedbackIds = [];
    const createdFaqIds = [];

    try {
      // Seed a test FAQ if none exist
      const existingFaqs = await FAQ.countDocuments({ isActive: true });
      if (existingFaqs === 0) {
        const seededFaq = await FAQ.create({
          question: 'What is ResuPrep?',
          answer: 'ResuPrep is an AI-powered career preparation toolkit.',
          category: 'getting-started',
          order: 1,
          isActive: true,
        });
        createdFaqIds.push(seededFaq._id);
      }

      // ==========================================
      // SECTION 1: SKILLS TAXONOMY & GAP ANALYSIS
      // ==========================================

      // TEST 01: GET /skills/taxonomy/:role (Known role)
      const taxRes1 = await fetch(`${baseUrl}/skills/taxonomy/frontend-developer`);
      const taxData1 = await taxRes1.json();
      const tax1Ok =
        taxRes1.status === 200 &&
        taxData1.success === true &&
        taxData1.data?.taxonomy?.role === 'Frontend Developer' &&
        Array.isArray(taxData1.data?.taxonomy?.skills);
      record(
        1,
        'GET /skills/taxonomy/:role (Known role)',
        tax1Ok,
        `Status: ${taxRes1.status}, Role: "${taxData1.data?.taxonomy?.role}", Skills count: ${taxData1.data?.taxonomy?.skills?.length}`
      );

      // TEST 02: GET /skills/taxonomy/:role (Unknown role fallback)
      const taxRes2 = await fetch(`${baseUrl}/skills/taxonomy/unknown-role-xyz`);
      const taxData2 = await taxRes2.json();
      const tax2Ok =
        taxRes2.status === 200 &&
        taxData2.success === true &&
        taxData2.data?.taxonomy?.role === 'Full Stack Developer';
      record(
        2,
        'GET /skills/taxonomy/:role (Unknown role fallback)',
        tax2Ok,
        `Status: ${taxRes2.status}, Safely defaulted to: "${taxData2.data?.taxonomy?.role}"`
      );

      // TEST 03: POST /skills/gap-analysis (Missing fields -> 400 Bad Request)
      const gapResMissing = await fetch(`${baseUrl}/skills/gap-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const gapDataMissing = await gapResMissing.json();
      record(
        3,
        'POST /skills/gap-analysis (Validation: Missing required fields)',
        gapResMissing.status === 400 && gapDataMissing.success === false,
        `Status: ${gapResMissing.status}, Error message: "${gapDataMissing.message}"`
      );

      // TEST 04: POST /skills/gap-analysis (Valid input -> AI/Fallback processing)
      const gapPayload = {
        currentSkills: ['HTML', 'CSS', 'JavaScript'],
        targetRole: 'Frontend Developer',
      };
      const gapResValid = await fetch(`${baseUrl}/skills/gap-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gapPayload),
      });
      const gapDataValid = await gapResValid.json();
      const gapsList = gapDataValid.data?.gaps;
      const gapsValid =
        gapResValid.status === 200 &&
        gapDataValid.success === true &&
        Array.isArray(gapsList) &&
        gapsList.length > 0 &&
        gapsList.every((g) => g.skill && g.priority && g.resource);
      record(
        4,
        'POST /skills/gap-analysis (Valid analysis response)',
        gapsValid,
        `Status: ${gapResValid.status}, Gaps identified: ${gapsList?.length}, TargetRole: "${gapDataValid.data?.targetRole}"`
      );

      // ==========================================
      // SECTION 2: FAQ RETRIEVAL & FILTERING
      // ==========================================

      // TEST 05: GET /faqs (List all active FAQs)
      const faqResAll = await fetch(`${baseUrl}/faqs`);
      const faqDataAll = await faqResAll.json();
      const faqsList = faqDataAll.data?.faqs;
      record(
        5,
        'GET /faqs (List all active FAQs)',
        faqResAll.status === 200 && faqDataAll.success === true && Array.isArray(faqsList),
        `Status: ${faqResAll.status}, Total active FAQs returned: ${faqsList?.length}`
      );

      // TEST 06: GET /faqs?category=getting-started (Category filter)
      const faqResFilter = await fetch(`${baseUrl}/faqs?category=getting-started`);
      const faqDataFilter = await faqResFilter.json();
      const filteredFaqs = faqDataFilter.data?.faqs;
      const categoryMatch =
        Array.isArray(filteredFaqs) && filteredFaqs.every((f) => f.category === 'getting-started');
      record(
        6,
        'GET /faqs?category=getting-started (Query Category Filter)',
        faqResFilter.status === 200 && categoryMatch,
        `Status: ${faqResFilter.status}, Filtered count: ${filteredFaqs?.length}, Category matched: ${categoryMatch}`
      );

      // ==========================================
      // SECTION 3: FEEDBACK CREATION & RETRIEVAL
      // ==========================================

      // TEST 07: POST /feedback (Validation: Missing required fields)
      const fbResMissing = await fetch(`${baseUrl}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Alex' }),
      });
      const fbDataMissing = await fbResMissing.json();
      record(
        7,
        'POST /feedback (Validation: Joi rejects missing rating & message)',
        fbResMissing.status === 400 && fbDataMissing.success === false,
        `Status: ${fbResMissing.status}, Error message: "${fbDataMissing.message}"`
      );

      // TEST 08: POST /feedback (Validation: Invalid rating or feature enum)
      const fbResInvalidEnum = await fetch(`${baseUrl}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Alex Developer',
          rating: 6, // out of range 1-5
          feature: 'invalid-feature-xyz',
          message: 'This is a long enough review message.',
        }),
      });
      const fbDataInvalidEnum = await fbResInvalidEnum.json();
      record(
        8,
        'POST /feedback (Validation: Joi rejects rating > 5 & invalid feature)',
        fbResInvalidEnum.status === 400 && fbDataInvalidEnum.success === false,
        `Status: ${fbResInvalidEnum.status}, Error message: "${fbDataInvalidEnum.message}"`
      );

      // TEST 09: POST /feedback (Valid submission & MongoDB persistence)
      const validFeedback = {
        name: 'Sarah Connor',
        role: 'Senior QA Engineer',
        rating: 5,
        feature: 'resume-analyzer',
        message: 'The resume analyzer gave me exceptional keyword optimization advice!',
      };
      const fbResValid = await fetch(`${baseUrl}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validFeedback),
      });
      const fbDataValid = await fbResValid.json();
      const createdFeedback = fbDataValid.data?.feedback;
      if (createdFeedback?._id) createdFeedbackIds.push(createdFeedback._id);

      const dbCheckFeedback = createdFeedback?._id ? await Feedback.findById(createdFeedback._id) : null;
      const fbCreateOk =
        fbResValid.status === 201 &&
        fbDataValid.success === true &&
        createdFeedback?.name === validFeedback.name &&
        createdFeedback?.isPublic === true &&
        dbCheckFeedback !== null;
      record(
        9,
        'POST /feedback (Valid submission, HTTP 201, auto isPublic: true)',
        fbCreateOk,
        `Status: ${fbResValid.status}, ID: ${createdFeedback?._id}, isPublic: ${createdFeedback?.isPublic}`
      );

      // TEST 10: GET /feedback/public (Retrieve public feedback list)
      const fbResPublic = await fetch(`${baseUrl}/feedback/public`);
      const fbDataPublic = await fbResPublic.json();
      const publicList = fbDataPublic.data?.feedback;
      const publicListOk =
        fbResPublic.status === 200 &&
        fbDataPublic.success === true &&
        Array.isArray(publicList) &&
        publicList.some((item) => String(item._id) === String(createdFeedback?._id));
      record(
        10,
        'GET /feedback/public (Retrieve public reviews list)',
        publicListOk,
        `Status: ${fbResPublic.status}, Total reviews: ${publicList?.length}, Contains newly submitted review: true`
      );

      // TEST 11: Route Prefix & Pluralization Contract Integrity
      const singleFaqCheck = await fetch(`${baseUrl}/faq`);
      const singleFaq404 = singleFaqCheck.status === 404;
      record(
        11,
        'Route Pluralization Integrity (/faqs mounted, /faq returns 404)',
        singleFaq404,
        `GET /faqs is mounted; singular GET /faq correctly returns HTTP 404`
      );

      // TEST 12: Anonymous Nature of Feedback Model
      const feedbackSchemaKeys = Object.keys(Feedback.schema.paths);
      const hasUserField = feedbackSchemaKeys.includes('user');
      record(
        12,
        'Feedback Model User Association Contract',
        !hasUserField,
        `Feedback schema has no 'user' field; submissions are decoupled from user accounts by design`
      );

      console.log('\n===============================================================');
      const allPassed = testResults.every((t) => t.pass);
      console.log(`CHECKPOINT 1 AUDIT VERIFICATION OUTCOME: ${allPassed ? 'ALL TESTS PASSED ✅' : 'FAILURES DETECTED ❌'}`);
      console.log(
        `Total: ${testResults.length} | Passed: ${testResults.filter((t) => t.pass).length} | Failed: ${
          testResults.filter((t) => !t.pass).length
        }`
      );
      console.log('===============================================================\n');

      // Cleanup test documents
      if (createdFeedbackIds.length > 0) {
        await Feedback.deleteMany({ _id: { $in: createdFeedbackIds } });
      }
      if (createdFaqIds.length > 0) {
        await FAQ.deleteMany({ _id: { $in: createdFaqIds } });
      }

      server.close();
      process.exit(allPassed ? 0 : 1);
    } catch (err) {
      console.error('Fatal error during verification:', err);
      if (createdFeedbackIds.length > 0) {
        await Feedback.deleteMany({ _id: { $in: createdFeedbackIds } }).catch(() => {});
      }
      if (createdFaqIds.length > 0) {
        await FAQ.deleteMany({ _id: { $in: createdFaqIds } }).catch(() => {});
      }
      server.close();
      process.exit(1);
    }
  });
}

runPhase4AuditVerification();

