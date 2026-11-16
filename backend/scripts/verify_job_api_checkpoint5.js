/**
 * ResuPrep - Phase 5 Checkpoint 5: Job API Integration Verification Suite
 * Tests actual HTTP routes, middleware, controllers, Joi validation, auth guards,
 * and deterministic matching through the Express application.
 */

const path = require('path');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../src/config/db');
const app = require('../src/app');
const User = require('../src/models/User');
const Job = require('../src/models/Job');
const ResumeBuilder = require('../src/models/ResumeBuilder');
const { calculateJobMatch } = require('../src/services/jobMatcher.service');

async function runCheckpoint5Verification() {
  console.log('===================================================================');
  console.log('   RESUPREP - PHASE 5 CHECKPOINT 5: JOB API INTEGRATION SUITE     ');
  console.log('   Testing HTTP Endpoints, Middleware, Joi Validation & Matcher   ');
  console.log('===================================================================\n');

  console.log('Connecting to MongoDB...');
  await connectDB();

  // Start Express on ephemeral port
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api/v1/jobs`;
  console.log(`Test Express server running at: ${baseUrl}\n`);

  const results = [];
  function record(id, title, passed, details) {
    results.push({ id, title, passed, details });
    const tag = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`[TEST ${String(id).padStart(2, '0')}] ${tag}: ${title}`);
    if (details) console.log(`   └─ ${details}`);
  }

  // Setup test entities
  const cleanupUserIds = [];
  const cleanupJobIds = [];
  const cleanupResumeIds = [];

  try {
    // 1. Create User A & User B
    const userA = await User.findOneAndUpdate(
      { email: 'chk5_usera@test.resuprep.internal' },
      {
        name: 'User Alpha',
        email: 'chk5_usera@test.resuprep.internal',
        password: 'Password123!',
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    cleanupUserIds.push(userA._id);

    const userB = await User.findOneAndUpdate(
      { email: 'chk5_userb@test.resuprep.internal' },
      {
        name: 'User Beta',
        email: 'chk5_userb@test.resuprep.internal',
        password: 'Password123!',
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    cleanupUserIds.push(userB._id);

    const tokenA = jwt.sign({ id: userA._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const tokenB = jwt.sign({ id: userB._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // 2. Create User A's Resume
    const resumeA = await ResumeBuilder.create({
      user: userA._id,
      title: 'Senior Full Stack Resume',
      personalInfo: {
        fullName: 'Alpha Candidate',
        email: 'alpha.private@confidential.com',
        phone: '+1-555-0199',
        location: 'San Francisco, CA',
      },
      summary: 'Experienced developer building enterprise web platforms.',
      skills: ['JavaScript', 'React', 'Docker'],
      projects: [
        {
          name: 'Microservice Gateway',
          description: 'High throughput API service',
          technologies: 'Node.js, Express',
        },
      ],
      experience: [
        {
          company: 'Acme Corp',
          position: 'Software Engineer',
          startDate: '2020',
          endDate: '2024',
          current: false,
          description: 'Worked on modern applications',
        },
      ],
    });
    cleanupResumeIds.push(resumeA._id);

    // 3. Create test jobs
    // Active controlled job
    const controlledJob = await Job.findOneAndUpdate(
      { slug: 'chk5-controlled-senior-engineer' },
      {
        title: 'Senior Platform Engineer (Test)',
        slug: 'chk5-controlled-senior-engineer',
        company: 'CloudScale Testing Corp',
        description: 'Design and build resilient distributed systems and APIs with modern web technologies.',
        requiredSkills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
        preferredSkills: ['Docker', 'AWS'],
        location: 'San Francisco, CA',
        category: 'tech',
        jobType: 'Full-time',
        workMode: 'Hybrid',
        experience: { min: 3, max: 7, level: 'senior' },
        isActive: true,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    cleanupJobIds.push(controlledJob._id);

    // Inactive job
    const inactiveJob = await Job.findOneAndUpdate(
      { slug: 'chk5-inactive-role-test' },
      {
        title: 'Archived Developer Role (Inactive)',
        slug: 'chk5-inactive-role-test',
        company: 'Legacy Corp',
        description: 'Old role that should never be visible or matchable.',
        requiredSkills: ['Java', 'Spring'],
        location: 'Remote',
        category: 'tech',
        isActive: false,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    cleanupJobIds.push(inactiveJob._id);

    // Zero-skills job
    const zeroSkillsJob = await Job.findOneAndUpdate(
      { slug: 'chk5-zero-skills-role' },
      {
        title: 'General Office Coordinator',
        slug: 'chk5-zero-skills-role',
        company: 'Admin Group',
        description: 'Answering phone lines, managing calendar, organizing physical filing.',
        requiredSkills: [],
        preferredSkills: [],
        location: 'New York, NY',
        category: 'business',
        isActive: true,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    cleanupJobIds.push(zeroSkillsJob._id);

    // =========================================================================
    // GROUP A: JOB CATALOGUE
    // =========================================================================
    console.log('\n--- GROUP A: JOB CATALOGUE ---');

    // TEST 01: GET /api/v1/jobs returns active jobs
    const res01 = await fetch(baseUrl);
    const data01 = await res01.json();
    const pass01 =
      res01.status === 200 &&
      data01.success === true &&
      Array.isArray(data01.data.jobs) &&
      data01.data.jobs.length > 0 &&
      data01.data.jobs.every((j) => j.isActive === true);
    record(1, 'GET /api/v1/jobs Returns Only Active Jobs', pass01, `Status: ${res01.status}, Jobs returned: ${data01.data?.jobs?.length}`);

    // TEST 02: Pagination defaults to page 1 and limit 10
    const pass02 =
      data01.data.pagination.page === 1 &&
      data01.data.pagination.limit === 10;
    record(2, 'Pagination Defaults to Page 1 and Limit 10', pass02, `Page: ${data01.data?.pagination?.page}, Limit: ${data01.data?.pagination?.limit}`);

    // TEST 03: Pagination metadata is accurate
    const pass03 =
      typeof data01.data.pagination.total === 'number' &&
      typeof data01.data.pagination.pages === 'number' &&
      data01.data.pagination.pages === Math.ceil(data01.data.pagination.total / data01.data.pagination.limit);
    record(3, 'Pagination Metadata (total, page, limit, pages) Calculated Accurately', pass03, `Total: ${data01.data?.pagination?.total}, Pages: ${data01.data?.pagination?.pages}`);

    // TEST 04: Category filtering works
    const res04 = await fetch(`${baseUrl}?category=tech`);
    const data04 = await res04.json();
    const pass04 =
      res04.status === 200 &&
      data04.data.jobs.length > 0 &&
      data04.data.jobs.every((j) => j.category === 'tech');
    record(4, 'Category Filter Accurately Constrains Query (?category=tech)', pass04, `Tech jobs returned: ${data04.data?.jobs?.length}`);

    // TEST 05: Job type filtering works
    const res05 = await fetch(`${baseUrl}?jobType=Full-time`);
    const data05 = await res05.json();
    const pass05 =
      res05.status === 200 &&
      data05.data.jobs.length > 0 &&
      data05.data.jobs.every((j) => j.jobType === 'Full-time');
    record(5, 'Job Type Filter Accurately Constrains Query (?jobType=Full-time)', pass05, `Full-time jobs: ${data05.data?.jobs?.length}`);

    // TEST 06: Work mode filtering works
    const res06 = await fetch(`${baseUrl}?workMode=Hybrid`);
    const data06 = await res06.json();
    const pass06 =
      res06.status === 200 &&
      data06.data.jobs.length > 0 &&
      data06.data.jobs.every((j) => j.workMode === 'Hybrid');
    record(6, 'Work Mode Filter Accurately Constrains Query (?workMode=Hybrid)', pass06, `Hybrid jobs: ${data06.data?.jobs?.length}`);

    // TEST 07: Experience level filtering works
    const res07 = await fetch(`${baseUrl}?experienceLevel=senior`);
    const data07 = await res07.json();
    const pass07 =
      res07.status === 200 &&
      data07.data.jobs.length > 0 &&
      data07.data.jobs.every((j) => j.experience?.level === 'senior');
    record(7, 'Experience Level Filter Accurately Constrains Query (?experienceLevel=senior)', pass07, `Senior jobs: ${data07.data?.jobs?.length}`);

    // TEST 08: Location filtering works
    const res08 = await fetch(`${baseUrl}?location=San%20Francisco`);
    const data08 = await res08.json();
    const pass08 =
      res08.status === 200 &&
      data08.data.jobs.length > 0 &&
      data08.data.jobs.every((j) => /san francisco/i.test(j.location));
    record(8, 'Location Filter Matches Geographic Location (?location=San Francisco)', pass08, `Matching jobs: ${data08.data?.jobs?.length}`);

    // TEST 09: Search matches title, company, or description
    const res09 = await fetch(`${baseUrl}?search=CloudScale`);
    const data09 = await res09.json();
    const pass09 =
      res09.status === 200 &&
      data09.data.jobs.length > 0 &&
      data09.data.jobs.some((j) => j.company === 'CloudScale Testing Corp');
    record(9, 'Search Query Matches Title/Company/Description Case-Insensitively', pass09, `Found matching company: ${data09.data?.jobs?.[0]?.company}`);

    // TEST 10: Multiple filters work together
    const res10 = await fetch(`${baseUrl}?category=tech&workMode=Hybrid&experienceLevel=senior`);
    const data10 = await res10.json();
    const pass10 =
      res10.status === 200 &&
      data10.data.jobs.length > 0 &&
      data10.data.jobs.every(
        (j) => j.category === 'tech' && j.workMode === 'Hybrid' && j.experience?.level === 'senior'
      );
    record(10, 'Multiple Filters Combine via Intersection (Category + WorkMode + ExpLevel)', pass10, `Combined filtered count: ${data10.data?.jobs?.length}`);

    // TEST 11: Malicious regex input is handled safely without crashing
    const maliciousRegex = encodeURIComponent('(*+?[\\[\\\\^$|#');
    const res11 = await fetch(`${baseUrl}?search=${maliciousRegex}`);
    const data11 = await res11.json();
    const pass11 = res11.status === 200 && Array.isArray(data11.data?.jobs);
    record(11, 'Malicious Regex Search Terms Escaped Safely (No ReDoS / Unhandled Rejection)', pass11, `Status: ${res11.status}, Returned valid array: ${Array.isArray(data11.data?.jobs)}`);

    // TEST 12: Invalid pagination values rejected with 400
    const res12 = await fetch(`${baseUrl}?page=0`);
    const data12 = await res12.json();
    const pass12 = res12.status === 400 && data12.success === false;
    record(12, 'Invalid Pagination Rejected with HTTP 400 (?page=0)', pass12, `Status: ${res12.status}, Success: ${data12.success}`);

    // TEST 13: Limit above 50 rejected with 400
    const res13 = await fetch(`${baseUrl}?limit=51`);
    const data13 = await res13.json();
    const pass13 = res13.status === 400 && data13.success === false;
    record(13, 'Excessive Page Limit Rejected with HTTP 400 (?limit=51 > 50)', pass13, `Status: ${res13.status}, Success: ${data13.success}`);

    // TEST 14: Empty catalogue query returns 200 with empty array
    const res14 = await fetch(`${baseUrl}?search=NonExistentJobStringZ999XQ`);
    const data14 = await res14.json();
    const pass14 =
      res14.status === 200 &&
      data14.success === true &&
      Array.isArray(data14.data.jobs) &&
      data14.data.jobs.length === 0 &&
      data14.data.pagination.total === 0;
    record(14, 'Zero Matching Records Returns HTTP 200 with Empty Array & Total 0', pass14, `Status: ${res14.status}, Total: ${data14.data?.pagination?.total}`);

    // =========================================================================
    // GROUP B: JOB DETAILS
    // =========================================================================
    console.log('\n--- GROUP B: JOB DETAILS ---');

    // TEST 15: Valid job ID returns job details
    const res15 = await fetch(`${baseUrl}/${controlledJob._id}`);
    const data15 = await res15.json();
    const pass15 =
      res15.status === 200 &&
      data15.success === true &&
      data15.data.job._id === controlledJob._id.toString() &&
      data15.data.job.title === controlledJob.title;
    record(15, 'GET /api/v1/jobs/:id Returns Complete Active Job Details', pass15, `Status: ${res15.status}, Job Title: "${data15.data?.job?.title}"`);

    // TEST 16: Invalid ObjectId returns 400
    const res16 = await fetch(`${baseUrl}/not-a-valid-mongo-id`);
    const data16 = await res16.json();
    const pass16 = res16.status === 400 && data16.success === false;
    record(16, 'Malformed Job ObjectId Returns HTTP 400 Bad Request', pass16, `Status: ${res16.status}, Message: "${data16.message}"`);

    // TEST 17: Unknown job returns 404
    const unknownId = new mongoose.Types.ObjectId();
    const res17 = await fetch(`${baseUrl}/${unknownId}`);
    const data17 = await res17.json();
    const pass17 = res17.status === 404 && data17.success === false;
    record(17, 'Non-Existent Valid ObjectId Returns HTTP 404 Not Found', pass17, `Status: ${res17.status}, Message: "${data17.message}"`);

    // TEST 18: Inactive job returns 404
    const res18 = await fetch(`${baseUrl}/${inactiveJob._id}`);
    const data18 = await res18.json();
    const pass18 = res18.status === 404 && data18.success === false;
    record(18, 'Inactive Job Listing Returns HTTP 404 (Hidden from Public)', pass18, `Status: ${res18.status}, Message: "${data18.message}"`);

    // =========================================================================
    // GROUP C: AUTHENTICATION AND OWNERSHIP
    // =========================================================================
    console.log('\n--- GROUP C: AUTHENTICATION AND OWNERSHIP ---');

    // TEST 19: Unauthenticated match request returns 401
    const res19 = await fetch(`${baseUrl}/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeId: resumeA._id, jobId: controlledJob._id }),
    });
    const data19 = await res19.json();
    const pass19 = res19.status === 401 && data19.success === false;
    record(19, 'Unauthenticated POST /match Returns HTTP 401 Unauthorized', pass19, `Status: ${res19.status}`);

    // TEST 20: User A can match against their own resume
    const res20 = await fetch(`${baseUrl}/match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ resumeId: resumeA._id, jobId: controlledJob._id }),
    });
    const data20 = await res20.json();
    const pass20 = res20.status === 200 && data20.success === true && typeof data20.data.matchPercentage === 'number';
    record(20, 'Authorized User Can Match Own Saved Resume (HTTP 200)', pass20, `Status: ${res20.status}, Score: ${data20.data?.matchPercentage}%`);

    // TEST 21: User B cannot match against User A's resume (Returns 404 IDOR Protection)
    const res21 = await fetch(`${baseUrl}/match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({ resumeId: resumeA._id, jobId: controlledJob._id }),
    });
    const data21 = await res21.json();
    const pass21 = res21.status === 404 && data21.success === false;
    record(21, 'IDOR Defense: User B Cannot Match Against User A\'s Resume (HTTP 404)', pass21, `Status: ${res21.status}, Message: "${data21.message}"`);

    // TEST 22: Missing resume returns 404
    const res22 = await fetch(`${baseUrl}/match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ resumeId: new mongoose.Types.ObjectId(), jobId: controlledJob._id }),
    });
    const data22 = await res22.json();
    const pass22 = res22.status === 404 && data22.success === false;
    record(22, 'Non-Existent Resume ID Returns HTTP 404 Not Found', pass22, `Status: ${res22.status}`);

    // TEST 23: Missing job returns 404
    const res23 = await fetch(`${baseUrl}/match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ resumeId: resumeA._id, jobId: new mongoose.Types.ObjectId() }),
    });
    const data23 = await res23.json();
    const pass23 = res23.status === 404 && data23.success === false;
    record(23, 'Non-Existent Job ID Returns HTTP 404 Not Found', pass23, `Status: ${res23.status}`);

    // TEST 24: Inactive job cannot be matched (Returns 404)
    const res24 = await fetch(`${baseUrl}/match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ resumeId: resumeA._id, jobId: inactiveJob._id }),
    });
    const data24 = await res24.json();
    const pass24 = res24.status === 404 && data24.success === false;
    record(24, 'Inactive Job Cannot Be Matched (Returns HTTP 404)', pass24, `Status: ${res24.status}`);

    // TEST 25: Request-supplied userId cannot override authenticated identity
    const res25 = await fetch(`${baseUrl}/match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({
        resumeId: resumeA._id,
        jobId: controlledJob._id,
        userId: userA._id.toString(), // Attacker attempt to forge identity
      }),
    });
    const data25 = await res25.json();
    const pass25 = res25.status === 404; // Blocked because req.user._id is User B!
    record(25, 'Request-Body "userId" Ignored; Authentication Token Identity Enforced', pass25, `Status: ${res25.status}`);

    // TEST 26: Full resume contact information is not exposed in match responses
    const pass26 =
      data20.data.personalInfo === undefined &&
      data20.data.email === undefined &&
      data20.data.phone === undefined &&
      data20.data.education === undefined &&
      data20.data.resumeTitle === 'Senior Full Stack Resume';
    record(26, 'Privacy Enforcement: PII & Full Resume Document Not Exposed in Response', pass26, `Only safe fields returned: [resumeId, resumeTitle, jobId, matchPercentage, ...]`);

    // =========================================================================
    // GROUP D: SAVED RESUME MATCHING
    // =========================================================================
    console.log('\n--- GROUP D: SAVED RESUME MATCHING ---');

    // Calculate reference match using service directly:
    // Resume skills: ['JavaScript', 'React', 'Docker'] + ['Node.js', 'Express']
    // Job required: ['JavaScript', 'React', 'Node.js', 'MongoDB'] -> 3 of 4 = 75%
    // Job preferred: ['Docker', 'AWS'] -> 1 of 2 = 50%
    // Score: 0.85 * 75 + 0.15 * 50 = 63.75 + 7.5 = 71.25 -> 71%
    const expectedMatch = calculateJobMatch(resumeA.toObject(), controlledJob.toObject());

    // TEST 27: Valid resume and job return 200 with match data
    const pass27 =
      res20.status === 200 &&
      data20.success === true &&
      data20.data.status === 'success';
    record(27, 'POST /match Returns HTTP 200 with Standardized ApiResponse Envelope', pass27, `Status: "${data20.data?.status}"`);

    // TEST 28: Match percentage matches Checkpoint 4 service output
    const pass28 = data20.data.matchPercentage === expectedMatch.matchPercentage;
    record(28, 'Match Percentage Matches Pure Service Output Exactly (71%)', pass28, `API Score: ${data20.data?.matchPercentage}%, Expected: ${expectedMatch.matchPercentage}%`);

    // TEST 29: Matched and missing skills are returned correctly
    const pass29 =
      data20.data.matchedRequiredSkills.includes('JavaScript') &&
      data20.data.matchedRequiredSkills.includes('React') &&
      data20.data.matchedRequiredSkills.includes('Node.js') &&
      data20.data.missingRequiredSkills.includes('MongoDB') &&
      data20.data.matchedPreferredSkills.includes('Docker') &&
      data20.data.missingPreferredSkills.includes('AWS');
    record(29, 'Matched & Missing Skills Accurately Partitioned Between Req & Pref', pass29, `Matched Req: [${data20.data?.matchedRequiredSkills.join(', ')}], Missing Req: [${data20.data?.missingRequiredSkills.join(', ')}]`);

    // TEST 30: Breakdown structure is preserved
    const pass30 =
      data20.data.breakdown &&
      data20.data.breakdown.requiredWeight === expectedMatch.breakdown.requiredWeight &&
      data20.data.breakdown.preferredWeight === expectedMatch.breakdown.preferredWeight &&
      data20.data.breakdown.totalRequiredCount === expectedMatch.breakdown.totalRequiredCount &&
      data20.data.breakdown.matchedRequiredCount === expectedMatch.breakdown.matchedRequiredCount &&
      data20.data.breakdown.totalPreferredCount === expectedMatch.breakdown.totalPreferredCount &&
      data20.data.breakdown.matchedPreferredCount === expectedMatch.breakdown.matchedPreferredCount;
    record(30, 'Breakdown Object Contains Detailed Scoring Ratios & Counters', pass30, `ReqScore: ${data20.data?.breakdown?.requiredScore}%, PrefScore: ${data20.data?.breakdown?.preferredScore}%`);

    // TEST 31: Experience compatibility is preserved
    const pass31 =
      data20.data.experienceCompatibility &&
      data20.data.experienceCompatibility.requiredLevel === 'senior' &&
      data20.data.experienceCompatibility.requiredMinYears === 3;
    record(31, 'Experience Compatibility Assessment Evaluated & Returned Safely', pass31, `Exp status: "${data20.data?.experienceCompatibility?.status}", Req min: ${data20.data?.experienceCompatibility?.requiredMinYears} yrs`);

    // TEST 32: Insufficient job skills return valid zero-score result (HTTP 200)
    const res32 = await fetch(`${baseUrl}/match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ resumeId: resumeA._id, jobId: zeroSkillsJob._id }),
    });
    const data32 = await res32.json();
    const pass32 =
      res32.status === 200 &&
      data32.data.matchPercentage === 0 &&
      data32.data.status === 'insufficient-job-skills';
    record(32, 'Job with Zero Skills Returns HTTP 200 with "insufficient-job-skills"', pass32, `Status: "${data32.data?.status}", Score: ${data32.data?.matchPercentage}%`);

    // TEST 33: Repeated requests return identical match results
    const res33 = await fetch(`${baseUrl}/match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ resumeId: resumeA._id, jobId: controlledJob._id }),
    });
    const data33 = await res33.json();
    const pass33 = JSON.stringify(data20.data) === JSON.stringify(data33.data);
    record(33, 'Repeated Match Requests Produce 100% Identical Output (Zero Drift)', pass33, `Identical JSON output verified`);

    // =========================================================================
    // GROUP E: PASTED JD MATCHING
    // =========================================================================
    console.log('\n--- GROUP E: PASTED JD MATCHING ---');

    const sampleJd = `
      About the Role:
      We need a Senior Engineer to build scalable cloud backends.

      Requirements:
      - Hands-on experience with JavaScript, React, and Node.js.
      - Strong knowledge of MongoDB.

      Preferred Skills:
      - Docker containerization and AWS infrastructure.
    `;

    // TEST 34: Valid JD returns extracted and matched skills
    const res34 = await fetch(`${baseUrl}/match-pasted`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        resumeId: resumeA._id,
        jobDescription: sampleJd,
        jobTitle: 'Senior Cloud Engineer',
      }),
    });
    const data34 = await res34.json();
    const pass34 =
      res34.status === 200 &&
      data34.success === true &&
      data34.data.jobTitle === 'Senior Cloud Engineer' &&
      data34.data.extractedSkills.extractedSkillsCount > 0 &&
      data34.data.matchPercentage === 71; // Same 3 req + 1 pref matched
    record(34, 'POST /match-pasted Extracts Skills & Computes Match (HTTP 200)', pass34, `Extracted count: ${data34.data?.extractedSkills?.extractedSkillsCount}, Score: ${data34.data?.matchPercentage}%`);

    // TEST 35: Preferred skills classified correctly
    const pass35 =
      data34.data.extractedSkills.requiredSkills.includes('JavaScript') &&
      data34.data.extractedSkills.requiredSkills.includes('React') &&
      data34.data.extractedSkills.preferredSkills.includes('Docker') &&
      data34.data.extractedSkills.preferredSkills.includes('AWS');
    record(35, 'Section Headings in Pasted JD Partition Skills into Required & Preferred', pass35, `Extracted Pref: [${data34.data?.extractedSkills?.preferredSkills.join(', ')}]`);

    // TEST 36: Missing resume returns 404
    const res36 = await fetch(`${baseUrl}/match-pasted`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        resumeId: new mongoose.Types.ObjectId(),
        jobDescription: sampleJd,
      }),
    });
    const data36 = await res36.json();
    const pass36 = res36.status === 404 && data36.success === false;
    record(36, 'Non-Existent Resume on Pasted Match Returns HTTP 404 Not Found', pass36, `Status: ${res36.status}`);

    // TEST 37: JD shorter than 20 characters returns 400
    const res37 = await fetch(`${baseUrl}/match-pasted`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        resumeId: resumeA._id,
        jobDescription: 'Short JD text.',
      }),
    });
    const data37 = await res37.json();
    const pass37 = res37.status === 400 && data37.success === false;
    record(37, 'Job Description < 20 Characters Rejected with HTTP 400', pass37, `Status: ${res37.status}, Errors: ${JSON.stringify(data37.errors)}`);

    // TEST 38: JD longer than 10,000 characters returns 400
    const longJd = 'A'.repeat(10001);
    const res38 = await fetch(`${baseUrl}/match-pasted`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        resumeId: resumeA._id,
        jobDescription: longJd,
      }),
    });
    const data38 = await res38.json();
    const pass38 = res38.status === 400 && data38.success === false;
    record(38, 'Job Description > 10,000 Characters Rejected with HTTP 400', pass38, `Status: ${res38.status}`);

    // TEST 39: Empty / whitespace JD returns 400
    const res39 = await fetch(`${baseUrl}/match-pasted`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        resumeId: resumeA._id,
        jobDescription: '                       ',
      }),
    });
    const data39 = await res39.json();
    const pass39 = res39.status === 400 && data39.success === false;
    record(39, 'Empty / Whitespace-Only Job Description Rejected with HTTP 400', pass39, `Status: ${res39.status}`);

    // TEST 40: Invalid resume ObjectId returns 400
    const res40 = await fetch(`${baseUrl}/match-pasted`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        resumeId: 'not-a-mongo-id',
        jobDescription: sampleJd,
      }),
    });
    const data40 = await res40.json();
    const pass40 = res40.status === 400 && data40.success === false;
    record(40, 'Malformed Resume ID on Pasted Match Rejected with HTTP 400', pass40, `Status: ${res40.status}`);

    // TEST 41: Unknown JD technologies do not create fabricated matches
    const nonTechJd = `
      Looking for a receptionist to manage front desk, welcome clients, and answer phone calls during business hours.
    `;
    const res41 = await fetch(`${baseUrl}/match-pasted`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        resumeId: resumeA._id,
        jobDescription: nonTechJd,
      }),
    });
    const data41 = await res41.json();
    const pass41 =
      res41.status === 200 &&
      data41.data.extractedSkills.extractedSkillsCount === 0 &&
      data41.data.matchedRequiredSkills.length === 0;
    record(41, 'Unknown Non-Technical Terms Do Not Produce Fabricated Matches', pass41, `Extracted: ${data41.data?.extractedSkills?.extractedSkillsCount}, Matched: ${data41.data?.matchedRequiredSkills?.length}`);

    // TEST 42: JD without recognizable skills returns HTTP 200 with correct extraction status
    const pass42 =
      res41.status === 200 &&
      data41.data.extractedSkills.status === 'no-skills-found' &&
      data41.data.matchPercentage === 0 &&
      data41.data.status === 'insufficient-job-skills';
    record(42, 'JD Without Known Skills Returns HTTP 200 ("no-skills-found", 0% Score)', pass42, `Extraction status: "${data41.data?.extractedSkills?.status}", Score: ${data41.data?.matchPercentage}%`);

    // TEST 43: Repeated identical pasted JD requests produce identical matching results
    const res43 = await fetch(`${baseUrl}/match-pasted`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        resumeId: resumeA._id,
        jobDescription: sampleJd,
        jobTitle: 'Senior Cloud Engineer',
      }),
    });
    const data43 = await res43.json();
    const pass43 = JSON.stringify(data34.data) === JSON.stringify(data43.data);
    record(43, 'Repeated Pasted JD Matching Yields 100% Identical Output', pass43, `Identical JSON response verified`);

  } finally {
    // Cleanup temporary test records
    if (cleanupResumeIds.length > 0) {
      await ResumeBuilder.deleteMany({ _id: { $in: cleanupResumeIds } });
    }
    if (cleanupJobIds.length > 0) {
      await Job.deleteMany({ _id: { $in: cleanupJobIds } });
    }
    if (cleanupUserIds.length > 0) {
      await User.deleteMany({ _id: { $in: cleanupUserIds } });
    }

    server.close();
    await mongoose.disconnect();
    console.log('\nCleaned up verification test records & closed server.');
  }

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  console.log('\n===================================================================');
  if (failedCount === 0) {
    console.log(`VERIFICATION SUMMARY: ALL TESTS PASSED ✅`);
  } else {
    console.log(`VERIFICATION SUMMARY: FAILURES DETECTED ❌`);
  }
  console.log(`Total Tests: ${results.length} | Passed: ${passedCount} | Failed: ${failedCount}`);
  console.log('===================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runCheckpoint5Verification().catch((err) => {
  console.error('Fatal Verification Error ❌', err);
  process.exit(1);
});
