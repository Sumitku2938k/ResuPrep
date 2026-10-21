const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../src/config/db');
const app = require('../src/app');
const User = require('../src/models/User');
const Template = require('../src/models/Template');
const ResumeBuilder = require('../src/models/ResumeBuilder');
const CoverLetter = require('../src/models/CoverLetter');
const { generateToken } = require('../src/services/token.service');

async function runPhase3AuditVerification() {
  console.log('===============================================================');
  console.log('   RESUPREP - PHASE 3 CHECKPOINT 1 BACKEND CONTRACT AUDIT     ');
  console.log('===============================================================\n');

  console.log('Connecting to MongoDB...');
  await connectDB();

  const server = app.listen(0, async () => {
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}/api/v1`;
    console.log(`Audit Test Express server running at: ${baseUrl}\n`);

    const auditResults = [];
    function record(feature, name, pass, status, details) {
      auditResults.push({ feature, name, pass, status, details });
      console.log(`[${feature}] ${pass ? '✅ PASS' : '❌ FAIL'}: ${name} (Status: ${status})`);
      if (details) console.log(`   └─ ${details}`);
    }

    try {
      // Create test accounts
      const userA = await User.create({
        name: 'Phase 3 User A',
        email: `phase3_user_a_${Date.now()}@test.com`,
        password: 'Password123!',
      });
      const tokenA = generateToken(userA._id);

      const userB = await User.create({
        name: 'Phase 3 User B',
        email: `phase3_user_b_${Date.now()}@test.com`,
        password: 'Password123!',
      });
      const tokenB = generateToken(userB._id);

      // =========================================================================
      // 1. TEMPLATES API AUDIT
      // =========================================================================
      console.log('\n--- 1. AUDITING TEMPLATES API ---');

      // Check seed data or seed a template if none exist
      let templateCount = await Template.countDocuments();
      if (templateCount === 0) {
        console.log('No templates in DB. Seeding sample templates for audit test...');
        await Template.create([
          {
            name: 'Modern Professional',
            slug: 'modern-professional',
            description: 'Clean, modern layout with blue accents.',
            category: 'tech',
            previewConfig: { accentColor: '#2563EB', layout: 'modern', fontFamily: 'Plus Jakarta Sans' },
            isActive: true,
          },
          {
            name: 'Executive Classic',
            slug: 'executive-classic',
            description: 'Timeless design with serif fonts.',
            category: 'business',
            previewConfig: { accentColor: '#1e3a5f', layout: 'classic', fontFamily: 'Georgia' },
            isActive: true,
          },
        ]);
      }

      // Test 1.1: List templates (Public)
      const listTplRes = await fetch(`${baseUrl}/templates`);
      const listTplData = await listTplRes.json();
      const listTplOk = listTplRes.status === 200 && listTplData.success === true && Array.isArray(listTplData.data?.templates);
      record(
        'Templates',
        'GET /templates (List all)',
        listTplOk,
        listTplRes.status,
        `Count: ${listTplData.data?.templates?.length}, First: ${listTplData.data?.templates?.[0]?.slug}`
      );

      // Test 1.2: Filter templates by category
      const filterTplRes = await fetch(`${baseUrl}/templates?category=tech`);
      const filterTplData = await filterTplRes.json();
      const filterTplOk =
        filterTplRes.status === 200 &&
        filterTplData.success === true &&
        filterTplData.data?.templates?.every((t) => t.category === 'tech');
      record(
        'Templates',
        'GET /templates?category=tech (Filtered)',
        filterTplOk,
        filterTplRes.status,
        `Filtered count: ${filterTplData.data?.templates?.length}`
      );

      // Test 1.3: Get template by valid slug
      const validSlug = listTplData.data?.templates?.[0]?.slug || 'modern-professional';
      const getTplRes = await fetch(`${baseUrl}/templates/${validSlug}`);
      const getTplData = await getTplRes.json();
      const getTplOk =
        getTplRes.status === 200 &&
        getTplData.success === true &&
        getTplData.data?.template?.slug === validSlug &&
        getTplData.data?.template?.previewConfig?.accentColor !== undefined;
      record(
        'Templates',
        `GET /templates/${validSlug} (Valid slug)`,
        getTplOk,
        getTplRes.status,
        `Name: ${getTplData.data?.template?.name}, Layout: ${getTplData.data?.template?.previewConfig?.layout}`
      );

      // Test 1.4: Get template by nonexistent slug
      const nonExistentTplRes = await fetch(`${baseUrl}/templates/non-existent-template-slug`);
      const nonExistentTplData = await nonExistentTplRes.json();
      const nonExistentTplOk = nonExistentTplRes.status === 404 && nonExistentTplData.success === false;
      record(
        'Templates',
        'GET /templates/non-existent-slug (404 expected)',
        nonExistentTplOk,
        nonExistentTplRes.status,
        `Message: ${nonExistentTplData.message}`
      );

      // =========================================================================
      // 2. RESUME BUILDER API AUDIT
      // =========================================================================
      console.log('\n--- 2. AUDITING RESUME BUILDER API ---');

      // Test 2.1: Unauthenticated access to protected endpoints
      const unauthListRes = await fetch(`${baseUrl}/builder`);
      const unauthListOk = unauthListRes.status === 401;
      record(
        'Builder',
        'GET /builder (Unauthenticated -> 401)',
        unauthListOk,
        unauthListRes.status,
        'Blocked as expected'
      );

      // Test 2.2: Anonymous creation (optionalAuth)
      const sampleResumePayload = {
        title: 'Full Stack Engineer Resume',
        personalInfo: {
          fullName: 'Alice Developer',
          email: 'alice@example.com',
          phone: '+1 555-0199',
          location: 'San Francisco, CA',
          linkedin: 'https://linkedin.com/in/alicedev',
          website: 'https://alicedev.com',
        },
        summary: 'Experienced web developer with React and Node.js expertise.',
        education: [
          {
            institution: 'UC Berkeley',
            degree: 'BS Computer Science',
            field: 'Engineering',
            startDate: '2018',
            endDate: '2022',
            gpa: '3.8',
          },
        ],
        experience: [
          {
            company: 'Tech Innovators',
            position: 'Senior Engineer',
            location: 'San Francisco, CA',
            startDate: '2022-01',
            endDate: '',
            current: true,
            description: 'Building microservices and frontend dashboards.',
          },
        ],
        skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Docker'],
        projects: [
          {
            name: 'DevPortal',
            description: 'API developer portal',
            technologies: 'React, Express',
            link: 'https://github.com/alice/devportal',
          },
        ],
        certifications: [
          {
            name: 'AWS Solutions Architect',
            issuer: 'Amazon Web Services',
            date: '2023',
            link: '',
          },
        ],
        template: 'modern',
      };

      const anonCreateRes = await fetch(`${baseUrl}/builder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sampleResumePayload),
      });
      const anonCreateData = await anonCreateRes.json();
      const anonCreateOk =
        anonCreateRes.status === 201 &&
        anonCreateData.success === true &&
        anonCreateData.data?.resume?.user === null;
      record(
        'Builder',
        'POST /builder (Anonymous creation with user: null)',
        anonCreateOk,
        anonCreateRes.status,
        `Created ID: ${anonCreateData.data?.resume?._id}, user: ${anonCreateData.data?.resume?.user}`
      );

      // Test 2.3: Authenticated creation (User A)
      const authCreateRes = await fetch(`${baseUrl}/builder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify(sampleResumePayload),
      });
      const authCreateData = await authCreateRes.json();
      const resumeIdA = authCreateData.data?.resume?._id;
      const authCreateOk =
        authCreateRes.status === 201 &&
        authCreateData.success === true &&
        authCreateData.data?.resume?.user === userA._id.toString();
      record(
        'Builder',
        'POST /builder (Authenticated User A)',
        authCreateOk,
        authCreateRes.status,
        `Created ID: ${resumeIdA}, user: ${authCreateData.data?.resume?.user}`
      );

      // Test 2.4: List user's resumes (User A)
      const listResumesRes = await fetch(`${baseUrl}/builder`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      const listResumesData = await listResumesRes.json();
      const listResumesOk =
        listResumesRes.status === 200 &&
        listResumesData.success === true &&
        Array.isArray(listResumesData.data?.resumes) &&
        listResumesData.data.resumes.length >= 1 &&
        listResumesData.data.resumes.some((r) => r._id === resumeIdA);
      record(
        'Builder',
        'GET /builder (List User A resumes)',
        listResumesOk,
        listResumesRes.status,
        `Total resumes for User A: ${listResumesData.data?.resumes?.length}`
      );

      // Test 2.5: Get single resume by ID (User A)
      const getResumeRes = await fetch(`${baseUrl}/builder/${resumeIdA}`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      const getResumeData = await getResumeRes.json();
      const getResumeOk =
        getResumeRes.status === 200 &&
        getResumeData.success === true &&
        getResumeData.data?.resume?._id === resumeIdA &&
        getResumeData.data?.resume?.personalInfo?.fullName === 'Alice Developer';
      record(
        'Builder',
        `GET /builder/${resumeIdA} (Get by ID User A)`,
        getResumeOk,
        getResumeRes.status,
        `Title: ${getResumeData.data?.resume?.title}, Skills count: ${getResumeData.data?.resume?.skills?.length}`
      );

      // Test 2.6: Update resume (User A)
      const updatePayload = {
        ...sampleResumePayload,
        title: 'Lead Full Stack Architect Resume',
        skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Docker', 'Kubernetes', 'GraphQL'],
      };
      const updateResumeRes = await fetch(`${baseUrl}/builder/${resumeIdA}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify(updatePayload),
      });
      const updateResumeData = await updateResumeRes.json();
      const updateResumeOk =
        updateResumeRes.status === 200 &&
        updateResumeData.success === true &&
        updateResumeData.data?.resume?.title === 'Lead Full Stack Architect Resume' &&
        updateResumeData.data?.resume?.skills?.length === 7;
      record(
        'Builder',
        `PUT /builder/${resumeIdA} (Update User A)`,
        updateResumeOk,
        updateResumeRes.status,
        `Updated title: ${updateResumeData.data?.resume?.title}, Skills: ${updateResumeData.data?.resume?.skills?.length}`
      );

      // Test 2.7: Security & IDOR Verification: User B attempts to read User A's resume
      const crossReadRes = await fetch(`${baseUrl}/builder/${resumeIdA}`, {
        headers: { Authorization: `Bearer ${tokenB}` },
      });
      const crossReadOk = crossReadRes.status === 404;
      record(
        'Builder',
        `GET /builder/${resumeIdA} (User B cross-read blocked)`,
        crossReadOk,
        crossReadRes.status,
        'Returns 404 Not Found, preventing data leak'
      );

      // Test 2.8: Security & IDOR Verification: User B attempts to update User A's resume
      const crossUpdateRes = await fetch(`${baseUrl}/builder/${resumeIdA}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenB}`,
        },
        body: JSON.stringify({ title: 'Hacked Title' }),
      });
      const crossUpdateOk = crossUpdateRes.status === 404;
      record(
        'Builder',
        `PUT /builder/${resumeIdA} (User B cross-update blocked)`,
        crossUpdateOk,
        crossUpdateRes.status,
        'Returns 404 Not Found, preventing unauthorized modification'
      );

      // Test 2.9: Security & IDOR Verification: User B attempts to delete User A's resume
      const crossDeleteRes = await fetch(`${baseUrl}/builder/${resumeIdA}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenB}` },
      });
      const crossDeleteOk = crossDeleteRes.status === 404;
      record(
        'Builder',
        `DELETE /builder/${resumeIdA} (User B cross-delete blocked)`,
        crossDeleteOk,
        crossDeleteRes.status,
        'Returns 404 Not Found, preventing unauthorized deletion'
      );

      // Test 2.10: Delete resume (User A)
      const deleteResumeRes = await fetch(`${baseUrl}/builder/${resumeIdA}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      const deleteResumeData = await deleteResumeRes.json();
      const deleteResumeOk =
        deleteResumeRes.status === 200 &&
        deleteResumeData.success === true &&
        (await ResumeBuilder.findById(resumeIdA)) === null;
      record(
        'Builder',
        `DELETE /builder/${resumeIdA} (Delete User A)`,
        deleteResumeOk,
        deleteResumeRes.status,
        'Successfully deleted from database'
      );

      // =========================================================================
      // 3. COVER LETTER API AUDIT
      // =========================================================================
      console.log('\n--- 3. AUDITING COVER LETTER API ---');

      // Test 3.1: Request validation: missing required fields
      const invalidClRes = await fetch(`${baseUrl}/cover-letter/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Bob' }), // missing jobTitle, company
      });
      const invalidClData = await invalidClRes.json();
      const invalidClOk = invalidClRes.status === 400 && invalidClData.success === false;
      record(
        'CoverLetter',
        'POST /cover-letter/generate (Missing required fields -> 400)',
        invalidClOk,
        invalidClRes.status,
        `Validation error: ${invalidClData.message}`
      );

      // Test 3.2: Generation (Authenticated User A)
      const validClPayload = {
        name: 'Sarah Connor',
        jobTitle: 'Senior DevOps Engineer',
        company: 'Cyberdyne Systems',
        hiringManager: 'Mr. Miles Dyson',
        keySkills: 'Kubernetes, Terraform, AWS, CI/CD, Docker',
        achievement: 'Reduced production deployment downtime by 85%',
        tone: 'professional',
      };

      const generateClRes = await fetch(`${baseUrl}/cover-letter/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify(validClPayload),
      });
      const generateClData = await generateClRes.json();
      const clIdA = generateClData.data?.coverLetter?._id;
      const generatedText = generateClData.data?.coverLetter?.generatedLetter;
      const generateClOk =
        generateClRes.status === 201 &&
        generateClData.success === true &&
        clIdA !== undefined &&
        typeof generatedText === 'string' &&
        generatedText.length > 50 &&
        generateClData.data?.coverLetter?.user === userA._id.toString();

      record(
        'CoverLetter',
        'POST /cover-letter/generate (Authenticated generation & auto-persistence)',
        generateClOk,
        generateClRes.status,
        `ID: ${clIdA}, Text len: ${generatedText?.length}, Tone: ${generateClData.data?.coverLetter?.tone}`
      );

      // Test 3.3: Anonymous generation
      const anonClRes = await fetch(`${baseUrl}/cover-letter/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validClPayload,
          name: 'Anonymous Candidate',
          company: 'Acme Corp',
        }),
      });
      const anonClData = await anonClRes.json();
      const anonClOk =
        anonClRes.status === 201 &&
        anonClData.success === true &&
        anonClData.data?.coverLetter?.user === null;
      record(
        'CoverLetter',
        'POST /cover-letter/generate (Anonymous generation with user: null)',
        anonClOk,
        anonClRes.status,
        `user: ${anonClData.data?.coverLetter?.user}`
      );

      // Test 3.4: List Cover Letters (User A)
      const listClRes = await fetch(`${baseUrl}/cover-letter`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      const listClData = await listClRes.json();
      const listClOk =
        listClRes.status === 200 &&
        listClData.success === true &&
        Array.isArray(listClData.data?.coverLetters) &&
        listClData.data.coverLetters.some((l) => l._id === clIdA);
      record(
        'CoverLetter',
        'GET /cover-letter (List User A letters)',
        listClOk,
        listClRes.status,
        `Envelope key: 'coverLetters', Count: ${listClData.data?.coverLetters?.length}`
      );

      // Test 3.5: Unauthenticated List Cover Letters
      const unauthClRes = await fetch(`${baseUrl}/cover-letter`);
      const unauthClOk = unauthClRes.status === 401;
      record(
        'CoverLetter',
        'GET /cover-letter (Unauthenticated -> 401)',
        unauthClOk,
        unauthClRes.status,
        'Blocked as expected'
      );

      // Test 3.6: Update Cover Letter (User A)
      const updatedLetterText = generatedText + '\n\nP.S. I look forward to your response.';
      const updateClRes = await fetch(`${baseUrl}/cover-letter/${clIdA}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({ generatedLetter: updatedLetterText }),
      });
      const updateClData = await updateClRes.json();
      const updateClOk =
        updateClRes.status === 200 &&
        updateClData.success === true &&
        updateClData.data?.coverLetter?.generatedLetter === updatedLetterText;
      record(
        'CoverLetter',
        `PUT /cover-letter/${clIdA} (Update User A letter)`,
        updateClOk,
        updateClRes.status,
        `Updated letter len: ${updateClData.data?.coverLetter?.generatedLetter?.length}`
      );

      // Test 3.7: Security & IDOR Verification: User B attempts to update User A's letter
      const crossUpdateClRes = await fetch(`${baseUrl}/cover-letter/${clIdA}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenB}`,
        },
        body: JSON.stringify({ generatedLetter: 'Malicious modification' }),
      });
      const crossUpdateClOk = crossUpdateClRes.status === 404;
      record(
        'CoverLetter',
        `PUT /cover-letter/${clIdA} (User B cross-update blocked)`,
        crossUpdateClOk,
        crossUpdateClRes.status,
        'Returns 404 Not Found, preventing unauthorized modification'
      );

      // Test 3.8: Security & IDOR Verification: User B attempts to delete User A's letter
      const crossDeleteClRes = await fetch(`${baseUrl}/cover-letter/${clIdA}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenB}` },
      });
      const crossDeleteClOk = crossDeleteClRes.status === 404;
      record(
        'CoverLetter',
        `DELETE /cover-letter/${clIdA} (User B cross-delete blocked)`,
        crossDeleteClOk,
        crossDeleteClRes.status,
        'Returns 404 Not Found, preventing unauthorized deletion'
      );

      // Test 3.9: Delete Cover Letter (User A)
      const deleteClRes = await fetch(`${baseUrl}/cover-letter/${clIdA}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      const deleteClData = await deleteClRes.json();
      const deleteClOk =
        deleteClRes.status === 200 &&
        deleteClData.success === true &&
        (await CoverLetter.findById(clIdA)) === null;
      record(
        'CoverLetter',
        `DELETE /cover-letter/${clIdA} (Delete User A letter)`,
        deleteClOk,
        deleteClRes.status,
        'Successfully deleted from database'
      );

      // Check if GET /cover-letter/:id exists
      const getSingleClRes = await fetch(`${baseUrl}/cover-letter/${clIdA}`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      // In app routing, GET /cover-letter/:id is not mounted; will return 404
      console.log(
        `[CoverLetter] Note on GET /cover-letter/:id endpoint: HTTP ${getSingleClRes.status} (Route is NOT mounted in coverLetter.routes.js)`
      );

      // =========================================================================
      // SUMMARY
      // =========================================================================
      console.log('\n===============================================================');
      const allPassed = auditResults.every((t) => t.pass);
      console.log(
        `PHASE 3 CHECKPOINT 1 AUDIT OUTCOME: ${allPassed ? 'ALL VERIFICATIONS PASSED ✅' : 'FAILURES OBSERVED ❌'}`
      );
      console.log(
        `Total: ${auditResults.length} | Passed: ${auditResults.filter((t) => t.pass).length} | Failed: ${auditResults.filter((t) => !t.pass).length}`
      );
      console.log('===============================================================\n');

      server.close();
      process.exit(allPassed ? 0 : 1);
    } catch (err) {
      console.error('\nAudit verification suite error:', err);
      server.close();
      process.exit(1);
    }
  });
}

runPhase3AuditVerification().catch((err) => {
  console.error('Fatal initialization error:', err);
  process.exit(1);
});
