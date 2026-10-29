const path = require('path');
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

async function runBuilderApiServiceVerification() {
  console.log('===================================================================');
  console.log('   RESUPREP - PHASE 3 CHECKPOINT 4: RESUME BUILDER API SERVICE     ');
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
    const createdResumeIds = [];

    try {
      // Import the frontend builder API module dynamically via ESM
      const builderApiPath =
        'file://' + path.resolve(__dirname, '../../frontend/src/api/builder.js').replace(/\\/g, '/');
      const builderApi = await import(builderApiPath);

      // TEST 1: Module exports verification
      const exportsOk =
        typeof builderApi.createResumeApi === 'function' &&
        typeof builderApi.getResumesApi === 'function' &&
        typeof builderApi.getResumeByIdApi === 'function' &&
        typeof builderApi.updateResumeApi === 'function' &&
        typeof builderApi.deleteResumeApi === 'function';

      record(
        1,
        'Module Exports Verification',
        exportsOk,
        `createResumeApi: ${typeof builderApi.createResumeApi}, getResumesApi: ${typeof builderApi.getResumesApi}, getResumeByIdApi: ${typeof builderApi.getResumeByIdApi}, updateResumeApi: ${typeof builderApi.updateResumeApi}, deleteResumeApi: ${typeof builderApi.deleteResumeApi}`
      );

      // TEST 2: Pre-network validation guards for getResumeByIdApi
      let getInvalidCaught = 0;
      const invalidIds = [null, undefined, '', '   ', 123, {}];
      for (const inv of invalidIds) {
        try {
          await builderApi.getResumeByIdApi(inv);
        } catch (err) {
          if (err.message.includes('valid resume ID is required')) {
            getInvalidCaught++;
          }
        }
      }
      record(
        2,
        'Pre-network ID Validation Guard (getResumeByIdApi)',
        getInvalidCaught === invalidIds.length,
        `Rejected ${getInvalidCaught}/${invalidIds.length} invalid ID types before dispatch`
      );

      // TEST 3: Pre-network validation guards for updateResumeApi and deleteResumeApi
      let updateDeleteInvalidCaught = 0;
      for (const inv of [null, '', '   ']) {
        try {
          await builderApi.updateResumeApi(inv, {});
        } catch (err) {
          if (err.message.includes('valid resume ID is required')) updateDeleteInvalidCaught++;
        }
        try {
          await builderApi.deleteResumeApi(inv);
        } catch (err) {
          if (err.message.includes('valid resume ID is required')) updateDeleteInvalidCaught++;
        }
      }
      record(
        3,
        'Pre-network ID Validation Guards (updateResumeApi & deleteResumeApi)',
        updateDeleteInvalidCaught === 6,
        `Rejected ${updateDeleteInvalidCaught}/6 invalid ID invocations before dispatch`
      );

      // Create isolated test users
      userA = await User.create({
        name: 'Checkpoint 4 User A',
        email: `cp4_user_a_${Date.now()}@test.com`,
        password: 'Password123!',
      });
      tokenA = generateToken(userA._id);

      userB = await User.create({
        name: 'Checkpoint 4 User B',
        email: `cp4_user_b_${Date.now()}@test.com`,
        password: 'Password123!',
      });
      tokenB = generateToken(userB._id);

      // TEST 4: Anonymous resume creation (optionalAuth -> user: null)
      global.localStorage.removeItem('token');
      const anonPayload = {
        title: 'Anonymous Test Resume',
        personalInfo: {
          fullName: 'Jane Doe',
          email: 'jane@example.com',
          phone: '+1 555-0100',
          location: 'New York, NY',
          linkedin: 'https://linkedin.com/in/janedoe',
          website: 'https://janedoe.me',
        },
        summary: 'Experienced Full-Stack Developer with passion for clean code.',
        education: [
          {
            institution: 'NYU',
            degree: 'B.S.',
            field: 'Computer Science',
            startDate: '2018',
            endDate: '2022',
            gpa: '3.8',
          },
        ],
        experience: [
          {
            company: 'Tech Corp',
            position: 'Software Engineer',
            location: 'New York, NY',
            startDate: '2022',
            endDate: '2024',
            current: false,
            description: 'Built scalable backend microservices.',
          },
        ],
        skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
        projects: [
          {
            name: 'CloudSync',
            description: 'Real-time synchronization platform.',
            technologies: 'Node.js, WebSockets, Redis',
            link: 'https://github.com/janedoe/cloudsync',
          },
        ],
        certifications: [
          {
            name: 'AWS Solutions Architect Associate',
            issuer: 'Amazon Web Services',
            date: '2023',
            link: 'https://aws.amazon.com',
          },
        ],
        template: 'modern-professional',
      };

      const anonRes = await builderApi.createResumeApi(anonPayload);
      const anonResume = anonRes?.data?.resume;
      if (anonResume?._id) createdResumeIds.push(anonResume._id);

      const dbAnonResume = anonResume?._id ? await ResumeBuilder.findById(anonResume._id) : null;
      const test4Pass =
        anonRes?.success === true &&
        anonResume?.title === 'Anonymous Test Resume' &&
        anonResume?.template === 'modern-professional' &&
        dbAnonResume !== null &&
        dbAnonResume.user === null;

      record(
        4,
        'Anonymous Resume Creation (optionalAuth, user: null)',
        test4Pass,
        `Status 201 Created, ID: ${anonResume?._id}, DB User: ${dbAnonResume?.user}`
      );

      // TEST 5: Authenticated resume creation (associated with User A)
      global.localStorage.setItem('token', tokenA);
      const userAPayload = {
        title: 'User A Principal Engineer Resume',
        personalInfo: {
          fullName: 'Alice Walker',
          email: 'alice@example.com',
          phone: '+1 555-0200',
          location: 'San Francisco, CA',
          linkedin: 'https://linkedin.com/in/alicewalker',
          website: 'https://alicewalker.dev',
        },
        summary: 'Staff Software Architect leading high-throughput cloud infrastructure.',
        education: [
          {
            institution: 'Stanford University',
            degree: 'M.S.',
            field: 'Computer Systems',
            startDate: '2016',
            endDate: '2018',
            gpa: '3.9',
          },
        ],
        experience: [
          {
            company: 'Pinnacle Systems',
            position: 'Lead Architect',
            location: 'San Francisco, CA',
            startDate: '2020',
            endDate: 'Present',
            current: true,
            description: 'Designed distributed database cluster with 99.999% uptime.',
          },
        ],
        skills: ['TypeScript', 'Node.js', 'Kubernetes', 'Go', 'GraphQL', 'AWS'],
        projects: [
          {
            name: 'MeshProxy',
            description: 'High performance edge reverse proxy in Go.',
            technologies: 'Go, eBPF, Envoy',
            link: 'https://github.com/alicewalker/meshproxy',
          },
        ],
        certifications: [
          {
            name: 'Certified Kubernetes Administrator (CKA)',
            issuer: 'Linux Foundation',
            date: '2022',
            link: 'https://cncf.io',
          },
        ],
        template: 'executive-classic',
      };

      const userARes = await builderApi.createResumeApi(userAPayload);
      const userAResume = userARes?.data?.resume;
      if (userAResume?._id) createdResumeIds.push(userAResume._id);

      const dbUserAResume = userAResume?._id ? await ResumeBuilder.findById(userAResume._id) : null;
      const test5Pass =
        userARes?.success === true &&
        userAResume?.title === 'User A Principal Engineer Resume' &&
        userAResume?.template === 'executive-classic' &&
        dbUserAResume !== null &&
        dbUserAResume.user.toString() === userA._id.toString();

      record(
        5,
        'Authenticated Resume Creation (Linked to User A)',
        test5Pass,
        `Status 201 Created, ID: ${userAResume?._id}, DB Owner: ${dbUserAResume?.user}`
      );

      // TEST 6: List authenticated user's resumes
      const listRes = await builderApi.getResumesApi();
      const userResumes = listRes?.data?.resumes;
      const test6Pass =
        listRes?.success === true &&
        Array.isArray(userResumes) &&
        userResumes.length === 1 &&
        userResumes[0]._id === userAResume._id &&
        userResumes[0].title === 'User A Principal Engineer Resume';

      record(
        6,
        'List Authenticated User Resumes (getResumesApi)',
        test6Pass,
        `Retrieved count: ${userResumes?.length}, Title: ${userResumes?.[0]?.title}`
      );

      // TEST 7: Get single resume by ID (getResumeByIdApi)
      const singleRes = await builderApi.getResumeByIdApi(userAResume._id);
      const singleResume = singleRes?.data?.resume;
      const test7Pass =
        singleRes?.success === true &&
        singleResume?._id === userAResume._id &&
        singleResume?.personalInfo?.fullName === 'Alice Walker' &&
        singleResume?.skills?.length === 6 &&
        singleResume?.template === 'executive-classic';

      record(
        7,
        'Get Single Resume by Valid ID (getResumeByIdApi)',
        test7Pass,
        `Status 200 OK, Name: ${singleResume?.personalInfo?.fullName}, Skills: ${singleResume?.skills?.length}`
      );

      // TEST 8: Update resume by ID (updateResumeApi)
      const updatedPayload = {
        ...userAPayload,
        title: 'Alice Walker - Chief Technology Officer Resume',
        template: 'modern-professional',
        skills: [...userAPayload.skills, 'Terraform'],
      };

      const updateRes = await builderApi.updateResumeApi(userAResume._id, updatedPayload);
      const updatedResume = updateRes?.data?.resume;
      const test8Pass =
        updateRes?.success === true &&
        updatedResume?._id === userAResume._id &&
        updatedResume?.title === 'Alice Walker - Chief Technology Officer Resume' &&
        updatedResume?.template === 'modern-professional' &&
        updatedResume?.skills?.includes('Terraform');

      record(
        8,
        'Update Resume by ID (updateResumeApi)',
        test8Pass,
        `Status 200 OK, Updated Title: ${updatedResume?.title}, Template: ${updatedResume?.template}`
      );

      // TEST 9: IDOR Isolation - User B cannot read User A resume (404 expected)
      global.localStorage.setItem('token', tokenB);
      let idorReadCaught = false;
      try {
        await builderApi.getResumeByIdApi(userAResume._id);
      } catch (err) {
        if (err.status === 404 && err.message.includes('Resume not found')) {
          idorReadCaught = true;
        }
      }
      record(
        9,
        'IDOR Isolation: Cross-User Read Blocked (HTTP 404)',
        idorReadCaught,
        'User B cannot access User A resume; returns HTTP 404 Not Found'
      );

      // TEST 10: IDOR Isolation - User B cannot update User A resume (404 expected)
      let idorUpdateCaught = false;
      try {
        await builderApi.updateResumeApi(userAResume._id, { title: 'Malicious Overwrite' });
      } catch (err) {
        if (err.status === 404 && err.message.includes('Resume not found')) {
          idorUpdateCaught = true;
        }
      }
      record(
        10,
        'IDOR Isolation: Cross-User Update Blocked (HTTP 404)',
        idorUpdateCaught,
        'User B cannot modify User A resume; returns HTTP 404 Not Found'
      );

      // TEST 11: IDOR Isolation - User B cannot delete User A resume (404 expected)
      let idorDeleteCaught = false;
      try {
        await builderApi.deleteResumeApi(userAResume._id);
      } catch (err) {
        if (err.status === 404 && err.message.includes('Resume not found')) {
          idorDeleteCaught = true;
        }
      }
      // Verify User A resume was NOT deleted
      const checkStillExists = await ResumeBuilder.findById(userAResume._id);
      const test11Pass = idorDeleteCaught && checkStillExists !== null;
      record(
        11,
        'IDOR Isolation: Cross-User Deletion Blocked (HTTP 404)',
        test11Pass,
        'User B cannot delete User A resume; record remains safe in DB'
      );

      // TEST 12: Unauthenticated protection (HTTP 401 on protected endpoints)
      global.localStorage.removeItem('token');
      let unauthList401 = false;
      let unauthGet401 = false;
      let unauthPut401 = false;
      let unauthDelete401 = false;

      try {
        await builderApi.getResumesApi();
      } catch (err) {
        if (err.status === 401) unauthList401 = true;
      }

      try {
        await builderApi.getResumeByIdApi(userAResume._id);
      } catch (err) {
        if (err.status === 401) unauthGet401 = true;
      }

      try {
        await builderApi.updateResumeApi(userAResume._id, { title: 'Unauth' });
      } catch (err) {
        if (err.status === 401) unauthPut401 = true;
      }

      try {
        await builderApi.deleteResumeApi(userAResume._id);
      } catch (err) {
        if (err.status === 401) unauthDelete401 = true;
      }

      const all401Pass = unauthList401 && unauthGet401 && unauthPut401 && unauthDelete401;
      record(
        12,
        'Unauthenticated Route Protection (HTTP 401 Enforced)',
        all401Pass,
        `GET: ${unauthList401}, GET/:id: ${unauthGet401}, PUT/:id: ${unauthPut401}, DELETE/:id: ${unauthDelete401}`
      );

      // TEST 13: Joi validation error propagation (HTTP 400)
      global.localStorage.setItem('token', tokenA);
      let validationCaught = false;
      let validationErrorMsg = '';
      try {
        await builderApi.updateResumeApi(userAResume._id, {
          skills: 'invalid-string-instead-of-array',
        });
      } catch (err) {
        if (err.status === 400) {
          validationCaught = true;
          validationErrorMsg = err.message || JSON.stringify(err.data);
        }
      }
      record(
        13,
        'Validation Error Propagation (HTTP 400)',
        validationCaught,
        `HTTP 400 Bad Request preserved: "${validationErrorMsg}"`
      );

      // TEST 14: Delete resume by ID (deleteResumeApi)
      const deleteRes = await builderApi.deleteResumeApi(userAResume._id);
      const test14Pass =
        deleteRes?.success === true &&
        deleteRes?.message === 'Resume deleted successfully' &&
        deleteRes?.data === null;

      const verifyDeletedDb = await ResumeBuilder.findById(userAResume._id);
      record(
        14,
        'Delete Resume by ID (deleteResumeApi)',
        test14Pass && verifyDeletedDb === null,
        `Status 200 OK, Deletion confirmed in MongoDB: ${verifyDeletedDb === null}`
      );

      // TEST 15: Post-delete single get returns 404
      let postDelete404Caught = false;
      try {
        await builderApi.getResumeByIdApi(userAResume._id);
      } catch (err) {
        if (err.status === 404) postDelete404Caught = true;
      }
      record(
        15,
        'Post-Deletion Single Fetch Returns 404',
        postDelete404Caught,
        'Deleted record accurately returns HTTP 404'
      );

    } catch (unexpectedErr) {
      console.error('Unexpected test error occurred:', unexpectedErr);
      record(99, 'Unexpected Test Execution Failure', false, unexpectedErr.message);
    } finally {
      // Clean up test records
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

runBuilderApiServiceVerification();

