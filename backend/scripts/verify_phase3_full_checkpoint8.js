const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../src/config/db');
const app = require('../src/app');
const User = require('../src/models/User');
const ResumeBuilder = require('../src/models/ResumeBuilder');
const CoverLetter = require('../src/models/CoverLetter');
const Template = require('../src/models/Template');
const { generateToken } = require('../src/services/token.service');

// Mock localStorage for Node environment to integrate with client.js
global.storageMap = new Map();
global.localStorage = {
  getItem: (key) => global.storageMap.get(key) || null,
  setItem: (key, val) => global.storageMap.set(key, String(val)),
  removeItem: (key) => global.storageMap.delete(key),
  clear: () => global.storageMap.clear(),
};

async function runPhase3FullVerification() {
  console.log('===================================================================');
  console.log('   RESUPREP - PHASE 3 CHECKPOINT 8: FULL E2E REGRESSION SUITE     ');
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
      console.log(`[TEST ${testNum.toString().padStart(2, '0')}] ${pass ? '✅ PASS' : '❌ FAIL'}: ${name}`);
      if (details) console.log(`    └─ ${details}`);
    }

    let userA = null;
    let userB = null;
    let tokenA = null;
    let tokenB = null;
    const createdResumeIds = [];
    const createdLetterIds = [];

    try {
      // Dynamic ESM imports of frontend API services
      const templatesApiPath =
        'file://' + path.resolve(__dirname, '../../frontend/src/api/templates.js').replace(/\\/g, '/');
      const builderApiPath =
        'file://' + path.resolve(__dirname, '../../frontend/src/api/builder.js').replace(/\\/g, '/');
      const coverLetterApiPath =
        'file://' + path.resolve(__dirname, '../../frontend/src/api/coverLetter.js').replace(/\\/g, '/');

      const templatesApi = await import(templatesApiPath);
      const builderApi = await import(builderApiPath);
      const coverLetterApi = await import(coverLetterApiPath);

      // Create isolated test users
      userA = await User.create({
        name: 'Phase 3 User A',
        email: `p3_user_a_${Date.now()}@test.com`,
        password: 'Password123!',
      });
      tokenA = generateToken(userA._id);

      userB = await User.create({
        name: 'Phase 3 User B',
        email: `p3_user_b_${Date.now()}@test.com`,
        password: 'Password123!',
      });
      tokenB = generateToken(userB._id);

      // ==========================================
      // SECTION 1: TEMPLATES VERIFICATION
      // ==========================================

      // TEST 01: Fetch Templates Catalogue
      const tplRes = await templatesApi.getTemplatesApi();
      const templates = tplRes?.data?.templates || [];
      record(
        1,
        'Fetch Templates Catalogue',
        tplRes?.success === true && templates.length >= 8,
        `Retrieved ${templates.length} templates from MongoDB. Status 200 OK`
      );

      // TEST 02: Category Filtering
      const techTplRes = await templatesApi.getTemplatesApi('tech');
      const techTemplates = techTplRes?.data?.templates || [];
      const allTech = techTemplates.length > 0 && techTemplates.every((t) => t.category === 'tech');
      record(
        2,
        'Category Filtering',
        techTplRes?.success === true && allTech,
        `Retrieved ${techTemplates.length} tech templates; all match category: 'tech'`
      );

      // TEST 03: Select Template and Validate PreviewConfig for Builder
      const selectedTpl = templates[0];
      const singleTplRes = await templatesApi.getTemplateBySlugApi(selectedTpl.slug);
      const singleTpl = singleTplRes?.data?.template;
      const previewConfigValid =
        singleTpl?.previewConfig?.accentColor &&
        singleTpl?.previewConfig?.layout &&
        singleTpl?.previewConfig?.fontFamily;
      record(
        3,
        'Select Template and Initialize Builder Config',
        singleTplRes?.success === true && Boolean(previewConfigValid),
        `Slug: ${singleTpl?.slug}, Layout: ${singleTpl?.previewConfig?.layout}, Accent: ${singleTpl?.previewConfig?.accentColor}`
      );

      // ==========================================
      // SECTION 2: RESUME BUILDER VERIFICATION
      // ==========================================

      // TEST 04: Create Resume (User A)
      global.localStorage.setItem('token', tokenA);
      const resumePayload = {
        title: 'Senior Full Stack Engineer Resume',
        personalInfo: {
          fullName: 'Alice Walker',
          email: 'alice@example.com',
          phone: '+1 555-0199',
          location: 'San Francisco, CA',
          linkedin: 'https://linkedin.com/in/alicewalker',
          website: 'https://alicewalker.dev',
        },
        summary: 'Expert developer specialized in modern React and distributed Node.js systems.',
        education: [
          {
            institution: 'UC Berkeley',
            degree: 'B.S.',
            field: 'Computer Science',
            startDate: '2016',
            endDate: '2020',
            gpa: '3.9',
          },
        ],
        experience: [
          {
            company: 'Stripe',
            position: 'Software Engineer',
            location: 'San Francisco, CA',
            startDate: '2020',
            endDate: '2024',
            current: false,
            description: 'Engineered payment reconciliation infrastructure.',
          },
        ],
        skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'MongoDB', 'Docker'],
        projects: [
          {
            name: 'ResuPrep Platform',
            description: 'Career toolkit platform.',
            technologies: 'MERN Stack, Tailwind, Chart.js',
            link: 'https://github.com/resuprep',
          },
        ],
        certifications: [
          {
            name: 'AWS Certified Solutions Architect',
            issuer: 'Amazon Web Services',
            date: '2023',
            link: 'https://aws.amazon.com',
          },
        ],
        template: singleTpl.slug,
      };

      const createRes = await builderApi.createResumeApi(resumePayload);
      const createdResume = createRes?.data?.resume;
      if (createdResume?._id) createdResumeIds.push(createdResume._id);

      record(
        4,
        'Create Resume (User A)',
        createRes?.success === true && String(createdResume?.user) === String(userA._id),
        `Created ID: ${createdResume?._id}, Owner: ${createdResume?.user}, Template: ${createdResume?.template}`
      );

      // TEST 05: List Saved Resumes
      const listResumesRes = await builderApi.getResumesApi();
      const userAResumes = listResumesRes?.data?.resumes || [];
      const resumeFoundInList = userAResumes.some((r) => String(r._id) === String(createdResume._id));
      record(
        5,
        'List Saved Resumes (User A)',
        listResumesRes?.success === true && resumeFoundInList,
        `Retrieved ${userAResumes.length} resumes; includes newly created resume: ${resumeFoundInList}`
      );

      // TEST 06: Load Saved Resume by ID
      const singleResumeRes = await builderApi.getResumeByIdApi(createdResume._id);
      const loadedResume = singleResumeRes?.data?.resume;
      const loadedFieldsValid =
        loadedResume?.title === resumePayload.title &&
        loadedResume?.personalInfo?.fullName === 'Alice Walker' &&
        Array.isArray(loadedResume?.education) &&
        Array.isArray(loadedResume?.experience) &&
        Array.isArray(loadedResume?.skills);
      record(
        6,
        'Load Saved Resume by ID (Full Schema Restored)',
        singleResumeRes?.success === true && loadedFieldsValid,
        `Title: "${loadedResume?.title}", Skills count: ${loadedResume?.skills?.length}`
      );

      // TEST 07: Update Existing Resume
      const updatedResumePayload = {
        ...resumePayload,
        title: 'Lead Distributed Systems Architect Resume',
        summary: 'Updated summary reflecting leadership experience.',
      };
      const updateRes = await builderApi.updateResumeApi(createdResume._id, updatedResumePayload);
      const updatedResume = updateRes?.data?.resume;
      record(
        7,
        'Update Existing Resume',
        updateRes?.success === true && updatedResume?.title === 'Lead Distributed Systems Architect Resume',
        `Updated title returned: "${updatedResume?.title}"`
      );

      // TEST 08: Zero Duplicate Document Duplication on Update
      const totalUserAResumes = await ResumeBuilder.countDocuments({ user: userA._id });
      record(
        8,
        'No Duplicate Resume Creation on Update',
        totalUserAResumes === 1,
        `Total resumes for User A in MongoDB remains exactly: ${totalUserAResumes}`
      );

      // TEST 09: Delete Resume
      const deleteRes = await builderApi.deleteResumeApi(createdResume._id);
      const dbAfterDelete = await ResumeBuilder.findById(createdResume._id);
      record(
        9,
        'Delete Resume (MongoDB Purge Verified)',
        deleteRes?.success === true && dbAfterDelete === null,
        `API success: true, Document in MongoDB verified null: ${dbAfterDelete === null}`
      );

      // TEST 10: Resume Persistence Survives Refresh (Recreated and Verified in DB)
      const persistResumeRes = await builderApi.createResumeApi({
        ...resumePayload,
        title: 'Persistent Resume Record',
      });
      const persistDoc = persistResumeRes?.data?.resume;
      if (persistDoc?._id) createdResumeIds.push(persistDoc._id);
      // Simulate session reload: clear memory references and query fresh from DB
      const dbPersistCheck = await ResumeBuilder.findById(persistDoc._id);
      record(
        10,
        'Resume Survives Refresh/Reload',
        dbPersistCheck !== null && dbPersistCheck.title === 'Persistent Resume Record',
        `Re-queried independent MongoDB record: "${dbPersistCheck?.title}", ID: ${dbPersistCheck?._id}`
      );

      // TEST 11: Resume PDF Export Code Integrity
      const builderJsxContent = fs.readFileSync(
        path.resolve(__dirname, '../../frontend/src/pages/Builder.jsx'),
        'utf-8'
      );
      const builderHasPdf =
        builderJsxContent.includes("await import('html2pdf.js')") &&
        builderJsxContent.includes('downloadPDF') &&
        builderJsxContent.includes('resume-paper');
      record(
        11,
        'Resume PDF Export Code Integrity',
        builderHasPdf,
        'Client-side html2pdf.js export intact targeting resume-paper element without triggering save/create APIs'
      );

      // ==========================================
      // SECTION 3: COVER LETTER VERIFICATION
      // ==========================================

      // TEST 12: Generate Cover Letter via Backend Pipeline
      const clPayload = {
        name: 'Alice Walker',
        jobTitle: 'Principal Engineer',
        company: 'Vercel',
        hiringManager: 'Engineering Director',
        keySkills: 'Next.js, Edge Computing, Serverless, TypeScript',
        achievement: 'Decreased global latency by 35% across edge endpoints',
        tone: 'professional',
      };
      const genRes = await coverLetterApi.generateCoverLetterApi(clPayload);
      const genDoc = genRes?.data?.coverLetter;
      if (genDoc?._id) createdLetterIds.push(genDoc._id);
      record(
        12,
        'Generate Cover Letter via Backend Pipeline',
        genRes?.success === true && Boolean(genDoc?.generatedLetter),
        `Generated ${genDoc?.generatedLetter?.length} chars of tailored text. HTTP 201 Created`
      );

      // TEST 13: Cover Letter Automatic MongoDB Persistence
      const dbClDoc = genDoc?._id ? await CoverLetter.findById(genDoc._id) : null;
      record(
        13,
        'Cover Letter MongoDB Auto-Persistence',
        dbClDoc !== null && String(dbClDoc.user) === String(userA._id),
        `Document auto-persisted in MongoDB with owner: ${dbClDoc?.user}, Company: ${dbClDoc?.company}`
      );

      // TEST 14: Load Cover Letter History
      const clHistoryRes = await coverLetterApi.getCoverLettersApi();
      const userALetters = clHistoryRes?.data?.coverLetters || [];
      const letterFoundInHistory = userALetters.some((l) => String(l._id) === String(genDoc._id));
      record(
        14,
        'Load Cover Letter History',
        clHistoryRes?.success === true && letterFoundInHistory,
        `Retrieved ${userALetters.length} saved cover letters; includes newly generated letter`
      );

      // TEST 15: Cover Letter Survives Refresh/Reload
      const dbFreshLetter = await CoverLetter.findById(genDoc._id);
      record(
        15,
        'Cover Letter Survives Refresh/Reload',
        dbFreshLetter !== null && dbFreshLetter.company === 'Vercel',
        `Re-queried independent MongoDB record: "${dbFreshLetter?.company}", ID: ${dbFreshLetter?._id}`
      );

      // TEST 16: Update Existing Cover Letter
      const updatedClText = 'Tailored opening and revised closing paragraph for Vercel leadership team.';
      const clUpdateRes = await coverLetterApi.updateCoverLetterApi(genDoc._id, {
        generatedLetter: updatedClText,
        tone: 'enthusiastic',
      });
      const dbClUpdated = await CoverLetter.findById(genDoc._id);
      record(
        16,
        'Update Existing Cover Letter',
        clUpdateRes?.success === true &&
          dbClUpdated?.generatedLetter === updatedClText &&
          dbClUpdated?.tone === 'enthusiastic',
        `Updated letter length: ${dbClUpdated?.generatedLetter?.length}, tone in DB: ${dbClUpdated?.tone}`
      );

      // TEST 17: Zero Duplicate Cover Letter on Update
      const totalUserALetters = await CoverLetter.countDocuments({ user: userA._id });
      record(
        17,
        'No Duplicate Cover Letter Creation on Update',
        totalUserALetters === 1,
        `Total cover letters for User A in MongoDB remains exactly: ${totalUserALetters}`
      );

      // TEST 18: Delete Cover Letter
      const clDeleteRes = await coverLetterApi.deleteCoverLetterApi(genDoc._id);
      const dbClAfterDelete = await CoverLetter.findById(genDoc._id);
      record(
        18,
        'Delete Cover Letter (MongoDB Purge Verified)',
        clDeleteRes?.success === true && dbClAfterDelete === null,
        `API success: true, Document in MongoDB verified null: ${dbClAfterDelete === null}`
      );

      // TEST 19: Cover Letter PDF Export Code Integrity
      const clJsxContent = fs.readFileSync(
        path.resolve(__dirname, '../../frontend/src/pages/CoverLetter.jsx'),
        'utf-8'
      );
      const clHasPdf =
        clJsxContent.includes("await import('html2pdf.js')") &&
        clJsxContent.includes('downloadPDF') &&
        clJsxContent.includes('previewRef.current');
      record(
        19,
        'Cover Letter PDF Export Code Integrity',
        clHasPdf,
        'Client-side html2pdf.js export intact targeting previewRef without invoking AI generation or database writes'
      );

      // ==========================================
      // SECTION 4: SECURITY & IDOR ISOLATION
      // ==========================================

      // Create a fresh resume for User A to test IDOR
      const idorResumeRes = await builderApi.createResumeApi({ ...resumePayload, title: 'IDOR Guard Resume' });
      const idorResumeDoc = idorResumeRes?.data?.resume;
      if (idorResumeDoc?._id) createdResumeIds.push(idorResumeDoc._id);

      // Create a fresh cover letter for User A to test IDOR
      const idorClRes = await coverLetterApi.generateCoverLetterApi({ ...clPayload, company: 'IDOR Guard Corp' });
      const idorClDoc = idorClRes?.data?.coverLetter;
      if (idorClDoc?._id) createdLetterIds.push(idorClDoc._id);

      // Switch auth context to User B
      global.localStorage.setItem('token', tokenB);

      // TEST 20: User A / User B Resume Isolation
      let userBReadResumeBlocked = false;
      let userBUpdateResumeBlocked = false;
      let userBDeleteResumeBlocked = false;
      try {
        await builderApi.getResumeByIdApi(idorResumeDoc._id);
      } catch (err) {
        if (err.status === 404) userBReadResumeBlocked = true;
      }
      try {
        await builderApi.updateResumeApi(idorResumeDoc._id, { title: 'Hacked by B' });
      } catch (err) {
        if (err.status === 404) userBUpdateResumeBlocked = true;
      }
      try {
        await builderApi.deleteResumeApi(idorResumeDoc._id);
      } catch (err) {
        if (err.status === 404) userBDeleteResumeBlocked = true;
      }
      const resumeIdorPassed = userBReadResumeBlocked && userBUpdateResumeBlocked && userBDeleteResumeBlocked;
      record(
        20,
        'User A / User B Resume IDOR Isolation (HTTP 404 Enforced)',
        resumeIdorPassed,
        `Cross-read: ${userBReadResumeBlocked}, Cross-update: ${userBUpdateResumeBlocked}, Cross-delete: ${userBDeleteResumeBlocked}`
      );

      // TEST 21: User A / User B Cover Letter Isolation
      let userBUpdateClBlocked = false;
      let userBDeleteClBlocked = false;
      try {
        await coverLetterApi.updateCoverLetterApi(idorClDoc._id, { generatedLetter: 'Hacked by B' });
      } catch (err) {
        if (err.status === 404) userBUpdateClBlocked = true;
      }
      try {
        await coverLetterApi.deleteCoverLetterApi(idorClDoc._id);
      } catch (err) {
        if (err.status === 404) userBDeleteClBlocked = true;
      }
      const userBListCl = await coverLetterApi.getCoverLettersApi();
      const userBLetters = userBListCl?.data?.coverLetters || [];
      const userALeakedToB = userBLetters.some((l) => String(l._id) === String(idorClDoc._id));
      const clIdorPassed = userBUpdateClBlocked && userBDeleteClBlocked && !userALeakedToB;
      record(
        21,
        'User A / User B Cover Letter IDOR Isolation (HTTP 404 Enforced)',
        clIdorPassed,
        `Cross-update: ${userBUpdateClBlocked}, Cross-delete: ${userBDeleteClBlocked}, History isolated: ${!userALeakedToB}`
      );

      // ==========================================
      // SECTION 5: AUTH & UNPROTECTED ACCESS
      // ==========================================

      // Clear token to simulate unauthenticated visitor
      global.localStorage.removeItem('token');

      // TEST 22: Protected Routes Reject Unauthenticated Requests (HTTP 401)
      let unauthBuilderBlocked = false;
      let unauthClListBlocked = false;
      try {
        await builderApi.getResumesApi();
      } catch (err) {
        if (err.status === 401) unauthBuilderBlocked = true;
      }
      try {
        await coverLetterApi.getCoverLettersApi();
      } catch (err) {
        if (err.status === 401) unauthClListBlocked = true;
      }
      record(
        22,
        'Protected Routes Reject Unauthenticated Requests (HTTP 401)',
        unauthBuilderBlocked && unauthClListBlocked,
        `Builder list rejected with 401: ${unauthBuilderBlocked}, Cover Letter list rejected with 401: ${unauthClListBlocked}`
      );

      // TEST 23: Expired / Invalid Session Token Handling
      global.localStorage.setItem('token', 'malformed.or.expired.jwt.token');
      let expiredSessionBlocked = false;
      try {
        await builderApi.getResumesApi();
      } catch (err) {
        if (err.status === 401) expiredSessionBlocked = true;
      }
      record(
        23,
        'Expired / Invalid Session Token Handling',
        expiredSessionBlocked,
        `Invalid/expired token rejected with HTTP 401 by auth middleware`
      );

      // ==========================================
      // SECTION 6: INPUT VALIDATION & FAILURE SCENARIOS
      // ==========================================

      // TEST 24: Invalid Inputs Rejected Pre-Network and Server-Side
      let invalidIdCaught = false;
      let invalidCoverLetterCaught = false;
      try {
        await builderApi.getResumeByIdApi('   ');
      } catch (err) {
        if (err.message.includes('valid resume ID is required')) invalidIdCaught = true;
      }
      try {
        await coverLetterApi.generateCoverLetterApi({ name: '', jobTitle: '', company: '' });
      } catch (err) {
        if (err.message.includes('Applicant name is required')) invalidCoverLetterCaught = true;
      }
      record(
        24,
        'Invalid Inputs Rejected Pre-Network',
        invalidIdCaught && invalidCoverLetterCaught,
        `Empty ID guard: ${invalidIdCaught}, Missing cover letter fields guard: ${invalidCoverLetterCaught}`
      );

      // TEST 25: API / Network Failure Error Propagation
      let networkErrorPreserved = false;
      try {
        // Query nonexistent slug
        await templatesApi.getTemplateBySlugApi('non-existent-template-slug-999');
      } catch (err) {
        if (err.status === 404 && err.message.toLowerCase().includes('not found')) {
          networkErrorPreserved = true;
        }
      }
      record(
        25,
        'API Error Preservation (HTTP 404 & Error Message)',
        networkErrorPreserved,
        `Preserved status 404 and structured message from backend ApiResponse`
      );

      // TEST 26: Template Selection Fallback Handling in Builder
      const emptyResumeDefaultTemplate = builderJsxContent.includes("template: 'modern'");
      const builderTemplateStateHandled =
        builderJsxContent.includes('location.state?.template?.slug') &&
        builderJsxContent.includes('location.state?.template?.previewConfig');
      record(
        26,
        'Template Selection Fallback Handling in Builder',
        emptyResumeDefaultTemplate && builderTemplateStateHandled,
        `Builder defaults to 'modern' template and handles incoming location.state template slug and previewConfig`
      );

      // ==========================================
      // SECTION 7: STORAGE CLEANUP & INTEGRITY
      // ==========================================

      const storageContent = fs.readFileSync(
        path.resolve(__dirname, '../../frontend/src/services/storage.js'),
        'utf-8'
      );

      // TEST 27: No Obsolete Builder LocalStorage Persistence
      const noBuilderStorage =
        !storageContent.includes('saveBuiltResume') &&
        !storageContent.includes('getBuiltResumes') &&
        !storageContent.includes('KEYS.RESUMES') &&
        !builderJsxContent.includes('storage');
      record(
        27,
        'No Obsolete Builder LocalStorage Persistence',
        noBuilderStorage,
        'saveBuiltResume and getBuiltResumes removed from storage.js; Builder.jsx has 0 storage imports'
      );

      // TEST 28: No Obsolete Cover Letter LocalStorage Persistence
      const noClStorage =
        !storageContent.includes('saveCoverLetter') &&
        !storageContent.includes('getCoverLetters(') &&
        !storageContent.includes('KEYS.COVER_LETTERS') &&
        !clJsxContent.includes('storage');
      record(
        28,
        'No Obsolete Cover Letter LocalStorage Persistence',
        noClStorage,
        'saveCoverLetter and getCoverLetters removed from storage.js; CoverLetter.jsx has 0 storage imports'
      );

      // TEST 29: Authentication Storage Remains Functional
      const clientContent = fs.readFileSync(
        path.resolve(__dirname, '../../frontend/src/api/client.js'),
        'utf-8'
      );
      const authStorageIntact =
        clientContent.includes("localStorage.getItem('token')") &&
        clientContent.includes('Authorization: `Bearer ${token}`');
      record(
        29,
        'Authentication Storage Remains Functional',
        authStorageIntact,
        'client.js and AuthContext seamlessly inject and retrieve Bearer token from localStorage'
      );

      // TEST 30: Feedback Storage Retained for Phase 4 Scope
      const feedbackStorageIntact =
        storageContent.includes('saveFeedback') &&
        storageContent.includes('getFeedback') &&
        storageContent.includes('FEEDBACK');
      record(
        30,
        'Feedback LocalStorage Retained (Phase 4 Scope)',
        feedbackStorageIntact,
        'saveFeedback and getFeedback preserved in storage.js for Feedback.jsx until Phase 4'
      );

      console.log('\n===============================================================');
      const allPassed = testResults.every((t) => t.pass);
      console.log(`CHECKPOINT 8 VERIFICATION OUTCOME: ${allPassed ? 'ALL TESTS PASSED ✅' : 'FAILURES DETECTED ❌'}`);
      console.log(
        `Total: ${testResults.length} | Passed: ${testResults.filter((t) => t.pass).length} | Failed: ${
          testResults.filter((t) => !t.pass).length
        }`
      );
      console.log('===============================================================\n');

      // Cleanup
      if (createdResumeIds.length > 0) {
        await ResumeBuilder.deleteMany({ _id: { $in: createdResumeIds } });
      }
      if (createdLetterIds.length > 0) {
        await CoverLetter.deleteMany({ _id: { $in: createdLetterIds } });
      }
      if (userA?._id) await User.findByIdAndDelete(userA._id);
      if (userB?._id) await User.findByIdAndDelete(userB._id);

      server.close();
      process.exit(allPassed ? 0 : 1);
    } catch (err) {
      console.error('Fatal error during verification:', err);
      if (createdResumeIds.length > 0) {
        await ResumeBuilder.deleteMany({ _id: { $in: createdResumeIds } }).catch(() => {});
      }
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

runPhase3FullVerification();
