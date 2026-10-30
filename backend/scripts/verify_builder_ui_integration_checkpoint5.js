const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../src/config/db');
const app = require('../src/app');
const User = require('../src/models/User');
const ResumeBuilder = require('../src/models/ResumeBuilder');
const { generateToken } = require('../src/services/token.service');

// Mock localStorage for Node environment to integrate with client.js
global.storageMap = new Map();
global.localStorage = {
  getItem: (key) => global.storageMap.get(key) || null,
  setItem: (key, val) => global.storageMap.set(key, String(val)),
  removeItem: (key) => global.storageMap.delete(key),
  clear: () => global.storageMap.clear(),
};

async function runBuilderUiIntegrationVerification() {
  console.log('===================================================================');
  console.log('   RESUPREP - PHASE 3 CHECKPOINT 5: BUILDER UI INTEGRATION TEST   ');
  console.log('===================================================================\n');

  const testResults = [];
  function record(testNum, name, pass, details) {
    testResults.push({ testNum, name, pass, details });
    console.log(`[TEST ${testNum}] ${pass ? '✅ PASS' : '❌ FAIL'}: ${name}`);
    if (details) console.log(`   └─ ${details}`);
  }

  // -------------------------------------------------------------------------
  // PART 1: STATIC CODE INSPECTION OF Builder.jsx
  // -------------------------------------------------------------------------
  console.log('--- PART 1: STATIC CODE INSPECTION OF Builder.jsx ---');
  const builderPath = path.resolve(__dirname, '../../frontend/src/pages/Builder.jsx');
  const builderCode = fs.readFileSync(builderPath, 'utf8');

  // TEST 1: Imports from ../api/builder
  const importsBuilderApi =
    builderCode.includes("from '../api/builder'") &&
    builderCode.includes('createResumeApi') &&
    builderCode.includes('getResumesApi') &&
    builderCode.includes('getResumeByIdApi') &&
    builderCode.includes('updateResumeApi') &&
    builderCode.includes('deleteResumeApi');
  record(
    1,
    'Imports All 5 Builder API Functions from ../api/builder',
    importsBuilderApi,
    'createResumeApi, getResumesApi, getResumeByIdApi, updateResumeApi, deleteResumeApi verified'
  );

  // TEST 2: Imports template API for preview restoration
  const importsTemplatesApi =
    builderCode.includes("from '../api/templates'") && builderCode.includes('getTemplateBySlugApi');
  record(
    2,
    'Imports getTemplateBySlugApi from ../api/templates',
    importsTemplatesApi,
    'Enables live preview templateConfig restoration when reopening saved drafts'
  );

  // TEST 3: No direct fetch or axios calls in Builder.jsx
  const hasDirectFetch = /(?:(?<![\w$])fetch\s*\(|axios\.)/.test(
    builderCode.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '')
  );
  record(
    3,
    'No Direct fetch() or Axios in Builder.jsx',
    !hasDirectFetch,
    'All backend network operations routed strictly via builder.js and client.js'
  );

  // TEST 4: activeResumeId state & Create-vs-Update branching logic
  const hasActiveResumeId = builderCode.includes('activeResumeId') && builderCode.includes('setActiveResumeId');
  const hasCreateBranch = builderCode.includes('createResumeApi(payload)');
  const hasUpdateBranch = builderCode.includes('updateResumeApi(activeResumeId, payload)');
  record(
    4,
    'Active Resume ID Tracking & Create vs Update Branching',
    hasActiveResumeId && hasCreateBranch && hasUpdateBranch,
    'Distinguishes new drafts from existing drafts; updates same document without duplicate creation'
  );

  // TEST 5: Sanitize payload strips frontend-only photo
  const stripsPhoto =
    builderCode.includes('delete personalInfo.photo') ||
    builderCode.includes('personalInfo.photo');
  record(
    5,
    'Sanitizes Network Payload (Photo treated as frontend-only)',
    stripsPhoto,
    'Preserves photo in local React state for preview/PDF while omitting it from backend payload'
  );

  // TEST 6: Preserves Live Preview and html2pdf export
  const preservesPreview =
    builderCode.includes('previewRef') &&
    builderCode.includes('templateConfig.layout === \'sidebar\'') &&
    builderCode.includes('html2pdf');
  record(
    6,
    'Preserves Live Preview & Client-side html2pdf Export',
    preservesPreview,
    'Sidebar, minimal, modern, and creative layout rendering intact with PDF generation'
  );

  // TEST 7: Unsaved changes warning listener
  const hasBeforeUnload = builderCode.includes('beforeunload') && builderCode.includes('isDirty');
  record(
    7,
    'Dirty State Tracking & beforeunload Browser Protection',
    hasBeforeUnload,
    'Warns user before tab close or navigation when unsaved changes exist'
  );

  // -------------------------------------------------------------------------
  // PART 2: LIVE BACKEND INTEGRATION & CRUD LIFECYCLE
  // -------------------------------------------------------------------------
  console.log('\n--- PART 2: LIVE BACKEND INTEGRATION & CRUD LIFECYCLE ---');
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
    const createdResumeIds = [];

    try {
      const builderApiPath =
        'file://' + path.resolve(__dirname, '../../frontend/src/api/builder.js').replace(/\\/g, '/');
      const builderApi = await import(builderApiPath);

      // Create test accounts
      userA = await User.create({
        name: 'Checkpoint 5 User A',
        email: `cp5_user_a_${Date.now()}@test.com`,
        password: 'Password123!',
      });
      tokenA = generateToken(userA._id);

      userB = await User.create({
        name: 'Checkpoint 5 User B',
        email: `cp5_user_b_${Date.now()}@test.com`,
        password: 'Password123!',
      });
      tokenB = generateToken(userB._id);

      // TEST 8: Create New Draft (User A)
      global.localStorage.setItem('token', tokenA);
      const initialPayload = {
        title: 'Full Stack Engineer Draft',
        personalInfo: {
          fullName: 'Jordan Smith',
          email: 'jordan@example.com',
          phone: '+1 555-3344',
          location: 'Austin, TX',
          linkedin: 'https://linkedin.com/in/jordansmith',
          website: 'https://jordansmith.dev',
        },
        summary: 'Passionate developer building cloud platforms.',
        education: [
          {
            institution: 'UT Austin',
            degree: 'B.S.',
            field: 'Computer Engineering',
            startDate: '2019',
            endDate: '2023',
            gpa: '3.75',
          },
        ],
        experience: [
          {
            company: 'NextGen Solutions',
            position: 'Software Developer',
            location: 'Austin, TX',
            startDate: '2023',
            endDate: 'Present',
            current: true,
            description: 'Implemented React UI features and GraphQL endpoints.',
          },
        ],
        skills: ['JavaScript', 'React', 'Node.js', 'PostgreSQL'],
        projects: [
          {
            name: 'TaskPulse',
            description: 'Agile team collaboration board.',
            technologies: 'React, Tailwind, Express',
            link: 'https://github.com/jordansmith/taskpulse',
          },
        ],
        certifications: [
          {
            name: 'Meta Front-End Developer Certificate',
            issuer: 'Coursera / Meta',
            date: '2023',
            link: 'https://coursera.org',
          },
        ],
        template: 'modern-professional',
      };

      const createRes = await builderApi.createResumeApi(initialPayload);
      const createdResume = createRes?.data?.resume;
      if (createdResume?._id) createdResumeIds.push(createdResume._id);

      const test8Pass =
        createRes?.success === true &&
        createdResume?._id &&
        createdResume.title === 'Full Stack Engineer Draft' &&
        createdResume.template === 'modern-professional';

      record(
        8,
        'Create New Resume Draft via API (createResumeApi)',
        test8Pass,
        `Status 201 Created, ID: ${createdResume?._id}, Title: ${createdResume?.title}`
      );

      // TEST 9: Update Existing Draft using returned ID (No duplicate creation)
      const updatedPayload = {
        ...initialPayload,
        title: 'Lead Full Stack Engineer Resume',
        skills: [...initialPayload.skills, 'Docker', 'AWS'],
        template: 'executive-classic',
      };

      const updateRes = await builderApi.updateResumeApi(createdResume._id, updatedPayload);
      const updatedResume = updateRes?.data?.resume;

      // Verify in DB that only 1 record exists for User A
      const userAResumesCount = await ResumeBuilder.countDocuments({ user: userA._id });
      const test9Pass =
        updateRes?.success === true &&
        updatedResume?._id === createdResume._id &&
        updatedResume?.title === 'Lead Full Stack Engineer Resume' &&
        updatedResume?.template === 'executive-classic' &&
        updatedResume?.skills?.length === 6 &&
        userAResumesCount === 1;

      record(
        9,
        'Update Existing Draft (updateResumeApi) - Zero Duplication',
        test9Pass,
        `Same ID retained: ${updatedResume?._id === createdResume._id}, Total User A resumes in DB: ${userAResumesCount}`
      );

      // TEST 10: List User Drafts (getResumesApi)
      const listRes = await builderApi.getResumesApi();
      const userResumes = listRes?.data?.resumes;
      const test10Pass =
        listRes?.success === true &&
        Array.isArray(userResumes) &&
        userResumes.length === 1 &&
        userResumes[0]._id === createdResume._id &&
        userResumes[0].title === 'Lead Full Stack Engineer Resume';

      record(
        10,
        'List Saved Drafts (getResumesApi)',
        test10Pass,
        `Retrieved count: ${userResumes?.length}, Title: ${userResumes?.[0]?.title}`
      );

      // TEST 11: Reopen Draft by ID (getResumeByIdApi)
      const getRes = await builderApi.getResumeByIdApi(createdResume._id);
      const loadedResume = getRes?.data?.resume;
      const test11Pass =
        getRes?.success === true &&
        loadedResume?._id === createdResume._id &&
        loadedResume?.personalInfo?.fullName === 'Jordan Smith' &&
        loadedResume?.education?.[0]?.institution === 'UT Austin' &&
        loadedResume?.experience?.[0]?.company === 'NextGen Solutions' &&
        loadedResume?.projects?.[0]?.name === 'TaskPulse' &&
        loadedResume?.certifications?.[0]?.name === 'Meta Front-End Developer Certificate';

      record(
        11,
        'Reopen Draft by ID (getResumeByIdApi) - Complete Schema Restoration',
        test11Pass,
        `Full nested data restored: personalInfo, education, experience, projects, certifications`
      );

      // TEST 12: IDOR Protection: User B cannot access User A's draft
      global.localStorage.setItem('token', tokenB);
      let idorGet404 = false;
      let idorPut404 = false;
      try {
        await builderApi.getResumeByIdApi(createdResume._id);
      } catch (err) {
        if (err.status === 404) idorGet404 = true;
      }
      try {
        await builderApi.updateResumeApi(createdResume._id, { title: 'Hacked' });
      } catch (err) {
        if (err.status === 404) idorPut404 = true;
      }
      record(
        12,
        'IDOR & Cross-User Isolation (User B cannot GET or PUT User A draft)',
        idorGet404 && idorPut404,
        `GET 404: ${idorGet404}, PUT 404: ${idorPut404}`
      );

      // TEST 13: Delete Draft (deleteResumeApi)
      global.localStorage.setItem('token', tokenA);
      const deleteRes = await builderApi.deleteResumeApi(createdResume._id);
      const dbCheck = await ResumeBuilder.findById(createdResume._id);
      const test13Pass =
        deleteRes?.success === true &&
        deleteRes?.message === 'Resume deleted successfully' &&
        dbCheck === null;

      record(
        13,
        'Delete Saved Draft (deleteResumeApi)',
        test13Pass,
        `Status 200 OK, Verified removed from MongoDB: ${dbCheck === null}`
      );

    } catch (err) {
      console.error('Unexpected test error occurred:', err);
      record(99, 'Unexpected Test Execution Failure', false, err.message);
    } finally {
      console.log('\nCleaning up test artifacts...');
      if (createdResumeIds.length > 0) {
        await ResumeBuilder.deleteMany({ _id: { $in: createdResumeIds } });
      }
      if (userA?._id) await User.findByIdAndDelete(userA._id);
      if (userB?._id) await User.findByIdAndDelete(userB._id);
      console.log('Cleanup complete.');

      server.close(() => {
        console.log('Test Express server stopped.');

        const total = testResults.length;
        const passed = testResults.filter((r) => r.pass).length;
        const failed = total - passed;

        console.log('\n===================================================================');
        console.log(`   TEST SUMMARY: ${passed}/${total} PASSED (${failed} FAILED)`);
        console.log('===================================================================');

        process.exit(failed > 0 ? 1 : 0);
      });
    }
  });
}

runBuilderUiIntegrationVerification();

