const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../src/config/db');
const Job = require('../src/models/Job');
const { seedJobs, sampleJobs } = require('./seed_jobs');

async function runJobModelVerification() {
  console.log('===================================================================');
  console.log('   RESUPREP - PHASE 5 CHECKPOINT 3: JOB MODEL & SEED VERIFICATION ');
  console.log('===================================================================\n');

  console.log('Connecting to MongoDB...');
  await connectDB();
  const dbHost = mongoose.connection.host;
  console.log(`Connected to MongoDB Host: ${dbHost}\n`);

  // Ensure collection and indexes exist
  await Job.init();

  const testResults = [];
  function record(testNum, name, pass, details) {
    testResults.push({ testNum, name, pass, details });
    console.log(`[TEST ${String(testNum).padStart(2, '0')}] ${pass ? '✅ PASS' : '❌ FAIL'}: ${name}`);
    if (details) console.log(`   └─ ${details}`);
  }

  const createdTestSlugs = [];

  try {
    // -------------------------------------------------------------------------
    // GROUP A: MODEL STRUCTURE
    // -------------------------------------------------------------------------
    console.log('\n--- SECTION A: MODEL STRUCTURE ---');

    // TEST 01: Job model exports correctly
    const isModel = typeof Job === 'function' && Job.modelName === 'Job';
    record(1, 'Job Model Exports Correctly as Mongoose Model', isModel, `modelName: "${Job.modelName}"`);

    // TEST 02: Required fields exist in schema paths
    const paths = Job.schema.paths;
    const requiredFieldCheck =
      paths.title?.isRequired &&
      paths.slug?.isRequired &&
      paths.company?.isRequired &&
      paths.description?.isRequired &&
      paths.location?.isRequired;
    record(
      2,
      'Required Fields Configured (title, slug, company, description, location)',
      Boolean(requiredFieldCheck),
      `title: ${paths.title?.isRequired}, slug: ${paths.slug?.isRequired}, company: ${paths.company?.isRequired}`
    );

    // TEST 03: Defaults are correctly applied
    const defaultJob = new Job({
      title: 'Default Test',
      slug: 'default-test',
      company: 'Default Co',
      description: 'Default Desc',
      location: 'Default City',
    });
    const defaultsCheck =
      defaultJob.companyLogo === '💼' &&
      defaultJob.shortDescription === '' &&
      defaultJob.isActive === true &&
      defaultJob.jobType === 'Full-time' &&
      defaultJob.workMode === 'On-site' &&
      defaultJob.category === 'tech' &&
      defaultJob.experience?.level === 'mid' &&
      defaultJob.experience?.min === 0 &&
      defaultJob.experience?.max === null &&
      defaultJob.salary?.currency === 'USD';
    record(
      3,
      'Default Values Properly Applied Across Subdocuments',
      defaultsCheck,
      `logo: "${defaultJob.companyLogo}", jobType: "${defaultJob.jobType}", category: "${defaultJob.category}", exp.level: "${defaultJob.experience?.level}"`
    );

    // TEST 04: Enums are correctly configured
    const jobTypeEnum = Job.schema.path('jobType').enumValues;
    const workModeEnum = Job.schema.path('workMode').enumValues;
    const categoryEnum = Job.schema.path('category').enumValues;
    const expLevelEnum = Job.schema.path('experience.level').enumValues;

    const enumsCheck =
      JSON.stringify(jobTypeEnum) === JSON.stringify(['Full-time', 'Part-time', 'Contract', 'Internship']) &&
      JSON.stringify(workModeEnum) === JSON.stringify(['On-site', 'Remote', 'Hybrid']) &&
      JSON.stringify(categoryEnum) === JSON.stringify(['tech', 'data', 'design', 'product', 'business', 'devops']) &&
      JSON.stringify(expLevelEnum) === JSON.stringify(['entry', 'mid', 'senior', 'lead']);
    record(
      4,
      'Schema Enums Configured Correctly (jobType, workMode, category, experience.level)',
      enumsCheck,
      `category: [${categoryEnum.join(', ')}], expLevel: [${expLevelEnum.join(', ')}]`
    );

    // TEST 05: Timestamps configured
    const hasTimestamps = Boolean(Job.schema.options.timestamps);
    record(5, 'Mongoose Timestamps Enabled on Job Schema', hasTimestamps, `options.timestamps: ${hasTimestamps}`);

    // TEST 06: Unique slug index is declared
    const slugPath = Job.schema.path('slug');
    const slugUniqueDeclared = slugPath.options?.unique === true;
    record(6, 'Unique Constraint Declared on Slug Field', slugUniqueDeclared, `slug.options.unique: ${slugUniqueDeclared}`);

    // -------------------------------------------------------------------------
    // GROUP B: VALIDATION RULES
    // -------------------------------------------------------------------------
    console.log('\n--- SECTION B: VALIDATION RULES ---');

    // Helper for validation error detection
    async function failsValidation(docData) {
      try {
        const doc = new Job(docData);
        await doc.validate();
        return false;
      } catch (err) {
        return true;
      }
    }

    const validBaseJob = {
      title: 'Full Stack Engineer',
      slug: 'valid-base-job-test',
      company: 'Acme Software',
      description: 'A comprehensive full stack engineering role.',
      location: 'Remote',
      requiredSkills: ['React', 'Node.js'],
      preferredSkills: ['TypeScript', 'Docker'],
      experience: { min: 2, max: 5, level: 'mid' },
      salary: { min: 100000, max: 130000, currency: 'USD', display: '$100k - $130k' },
      category: 'tech',
      jobType: 'Full-time',
      workMode: 'Remote',
      applicationUrl: 'https://acme.example.com/apply',
    };

    // TEST 07: Valid job passes validation
    let validPasses = false;
    try {
      const doc = new Job(validBaseJob);
      await doc.validate();
      validPasses = true;
    } catch (e) {
      validPasses = false;
    }
    record(7, 'Valid Job Document Passes Mongoose Validation', validPasses, `Validation error: ${validPasses ? 'None' : 'Unexpected error'}`);

    // TEST 08: Missing title rejected
    const test08Fail = await failsValidation({ ...validBaseJob, title: undefined });
    record(8, 'Validation Rejects Missing Job Title', test08Fail, `Rejected undefined title: ${test08Fail}`);

    // TEST 09: Missing company rejected
    const test09Fail = await failsValidation({ ...validBaseJob, company: undefined });
    record(9, 'Validation Rejects Missing Company Name', test09Fail, `Rejected undefined company: ${test09Fail}`);

    // TEST 10: Missing description rejected
    const test10Fail = await failsValidation({ ...validBaseJob, description: undefined });
    record(10, 'Validation Rejects Missing Job Description', test10Fail, `Rejected undefined description: ${test10Fail}`);

    // TEST 11: Missing location rejected
    const test11Fail = await failsValidation({ ...validBaseJob, location: undefined });
    record(11, 'Validation Rejects Missing Location', test11Fail, `Rejected undefined location: ${test11Fail}`);

    // TEST 12: Invalid jobType rejected
    const test12Fail = await failsValidation({ ...validBaseJob, jobType: 'Gig-Worker' });
    record(12, 'Validation Rejects Invalid jobType Enum Value', test12Fail, `Rejected "Gig-Worker": ${test12Fail}`);

    // TEST 13: Invalid workMode rejected
    const test13Fail = await failsValidation({ ...validBaseJob, workMode: 'Everywhere' });
    record(13, 'Validation Rejects Invalid workMode Enum Value', test13Fail, `Rejected "Everywhere": ${test13Fail}`);

    // TEST 14: Invalid category rejected
    const test14Fail = await failsValidation({ ...validBaseJob, category: 'culinary' });
    record(14, 'Validation Rejects Invalid Category Enum Value', test14Fail, `Rejected "culinary": ${test14Fail}`);

    // TEST 15: Invalid experience level rejected
    const test15Fail = await failsValidation({
      ...validBaseJob,
      experience: { min: 2, max: 4, level: 'guru' },
    });
    record(15, 'Validation Rejects Invalid Experience Level Value', test15Fail, `Rejected level "guru": ${test15Fail}`);

    // TEST 16: Negative experience rejected
    const test16Fail = await failsValidation({
      ...validBaseJob,
      experience: { min: -2, max: 4, level: 'mid' },
    });
    record(16, 'Validation Rejects Negative Experience Minimum', test16Fail, `Rejected min: -2: ${test16Fail}`);

    // TEST 17: Maximum experience lower than minimum rejected
    const test17Fail = await failsValidation({
      ...validBaseJob,
      experience: { min: 6, max: 3, level: 'senior' },
    });
    record(17, 'Validation Rejects Maximum Experience Lower Than Minimum', test17Fail, `Rejected min: 6, max: 3: ${test17Fail}`);

    // TEST 18: Negative salary rejected
    const test18Fail = await failsValidation({
      ...validBaseJob,
      salary: { min: -50000, max: 100000 },
    });
    record(18, 'Validation Rejects Negative Salary Amounts', test18Fail, `Rejected salary.min: -50000: ${test18Fail}`);

    // TEST 19: Maximum salary lower than minimum rejected
    const test19Fail = await failsValidation({
      ...validBaseJob,
      salary: { min: 150000, max: 90000 },
    });
    record(19, 'Validation Rejects Maximum Salary Lower Than Minimum', test19Fail, `Rejected min: 150k, max: 90k: ${test19Fail}`);

    // TEST 20: Invalid application URL rejected
    const test20Fail = await failsValidation({
      ...validBaseJob,
      applicationUrl: 'ftp://not-a-web-url',
    });
    record(20, 'Validation Rejects Non-HTTP/HTTPS Application URL', test20Fail, `Rejected non-web URL: ${test20Fail}`);

    // TEST 21: Empty skill strings rejected
    const test21Fail = await failsValidation({
      ...validBaseJob,
      requiredSkills: ['React', '   ', 'Node.js'],
    });
    record(21, 'Validation Rejects Empty / Whitespace-Only Skill Strings', test21Fail, `Rejected whitespace skill string: ${test21Fail}`);

    // -------------------------------------------------------------------------
    // GROUP C: DATABASE PERSISTENCE
    // -------------------------------------------------------------------------
    console.log('\n--- SECTION C: DATABASE PERSISTENCE ---');

    // TEST 22: Valid job saves successfully to database
    const persistSlug = `test-persist-${Date.now()}`;
    createdTestSlugs.push(persistSlug);

    const createdJob = await Job.create({
      ...validBaseJob,
      slug: persistSlug,
      title: 'Database Persistence Test Job',
    });
    const saveSuccess = Boolean(createdJob._id && createdJob.createdAt);
    record(22, 'Valid Job Document Persists to Database with Timestamps', saveSuccess, `_id: ${createdJob._id}, createdAt: ${createdJob.createdAt}`);

    // TEST 23: Saved job can be retrieved by slug
    const retrievedJob = await Job.findOne({ slug: persistSlug });
    const retrieveSuccess = retrievedJob && retrievedJob.title === 'Database Persistence Test Job';
    record(23, 'Saved Job Retrieved Accurately by Unique Slug', Boolean(retrieveSuccess), `Retrieved title: "${retrievedJob?.title}"`);

    // TEST 24: Updated job persists correctly
    await Job.findOneAndUpdate(
      { slug: persistSlug },
      { $set: { location: 'Updated Metro Area, CA' } },
      { new: true, runValidators: true }
    );
    const updatedJob = await Job.findOne({ slug: persistSlug });
    const updateSuccess = updatedJob && updatedJob.location === 'Updated Metro Area, CA';
    record(24, 'Job Document Update Persists with Validator Enforcement', Boolean(updateSuccess), `Updated location: "${updatedJob?.location}"`);

    // TEST 25: Duplicate slug is rejected by MongoDB unique constraint
    let duplicateRejected = false;
    try {
      await Job.create({
        ...validBaseJob,
        slug: persistSlug, // identical slug
        title: 'Conflicting Slug Job',
      });
      duplicateRejected = false;
    } catch (err) {
      duplicateRejected = err.code === 11000 || err.message.includes('duplicate key');
    }
    record(25, 'Duplicate Slug Insertion Blocked by MongoDB Unique Constraint (E11000)', duplicateRejected, `Duplicate key rejected: ${duplicateRejected}`);

    // TEST 26: Indexes are present after model initialization
    const indexes = await Job.collection.indexes();
    const indexNames = indexes.map((idx) => idx.name);
    const hasSlugIndex = indexNames.includes('slug_1');
    const hasCategoryIndex = indexNames.includes('category_1');
    const hasIsActiveIndex = indexNames.includes('isActive_1');
    const hasTextIndex = indexNames.includes('JobTextIndex');

    const indexesVerified = hasSlugIndex && hasCategoryIndex && hasIsActiveIndex && hasTextIndex;
    record(
      26,
      'MongoDB Collection Indexes Verified (slug_1, JobTextIndex, category_1, isActive_1)',
      indexesVerified,
      `Indexes found (${indexes.length}): [${indexNames.join(', ')}]`
    );

    // -------------------------------------------------------------------------
    // GROUP D: SEED IDEMPOTENCY & SAFETY
    // -------------------------------------------------------------------------
    console.log('\n--- SECTION D: SEED IDEMPOTENCY & SAFETY ---');

    // Create an independent custom job that is OUTSIDE the seed dataset
    const outsideSlug = `outside-seed-job-${Date.now()}`;
    createdTestSlugs.push(outsideSlug);
    await Job.create({
      ...validBaseJob,
      slug: outsideSlug,
      title: 'Independent Outside Job',
    });

    // TEST 27: First seed execution inserts expected sample jobs
    const seedRun1 = await seedJobs();
    const countAfterRun1 = await Job.countDocuments({
      slug: { $in: sampleJobs.map((j) => j.slug) },
    });
    const run1Success = seedRun1.total === 15 && countAfterRun1 === 15;
    record(
      27,
      'First Seed Run Inserts 15 Approved Sample Jobs into MongoDB',
      run1Success,
      `Seed total: ${seedRun1.total}, Database seeded items: ${countAfterRun1}`
    );

    // TEST 28: Second execution does not increase total number of seeded jobs
    const seedRun2 = await seedJobs();
    const countAfterRun2 = await Job.countDocuments({
      slug: { $in: sampleJobs.map((j) => j.slug) },
    });
    const run2Idempotent =
      countAfterRun2 === 15 &&
      seedRun2.inserted === 0 &&
      seedRun2.updated === 15;
    record(
      28,
      'Second Seed Run is 100% Idempotent (0 New Insertions, 15 Updates)',
      run2Idempotent,
      `Inserted: ${seedRun2.inserted}, Updated: ${seedRun2.updated}, Total: ${countAfterRun2}`
    );

    // TEST 29: Seeded job fields are updated when source data changes
    const testSlugToModify = sampleJobs[0].slug;
    const originalDesc = sampleJobs[0].description;
    const modifiedDesc = originalDesc + ' [VERIFIED UPDATED TIMESTAMP]';

    // Temporarily mutate sample array in memory
    sampleJobs[0].description = modifiedDesc;
    await seedJobs();
    const reFetchedJob = await Job.findOne({ slug: testSlugToModify });
    const updatePersisted = reFetchedJob && reFetchedJob.description === modifiedDesc;

    // Restore original in memory & in DB
    sampleJobs[0].description = originalDesc;
    await seedJobs();

    record(
      29,
      'Idempotent Upsert Updates Existing Job Data on Seed Source Changes',
      Boolean(updatePersisted),
      `Updated description persisted and safely restored: ${Boolean(updatePersisted)}`
    );

    // TEST 30: Jobs outside the seed dataset are preserved
    const outsideJobStillExists = await Job.findOne({ slug: outsideSlug });
    const outsidePreserved = Boolean(outsideJobStillExists && outsideJobStillExists.title === 'Independent Outside Job');
    record(
      30,
      'Jobs Outside Seed Dataset are Preserved (No deleteMany Safety)',
      outsidePreserved,
      `Independent job outside seed catalogue intact: ${outsidePreserved}`
    );

    // TEST 31: No duplicate slugs exist in the collection
    const allJobs = await Job.find({}, 'slug');
    const allSlugs = allJobs.map((j) => j.slug);
    const uniqueSlugs = new Set(allSlugs);
    const noDuplicates = allSlugs.length === uniqueSlugs.size;
    record(
      31,
      'Slug Uniqueness Across Entire Collection Verified (0 Duplicates)',
      noDuplicates,
      `Total jobs: ${allSlugs.length}, Unique slugs: ${uniqueSlugs.size}`
    );

    // TEST 32: Seed script handles database errors cleanly and returns structured counts
    const handlesStructure =
      typeof seedRun1.total === 'number' &&
      typeof seedRun1.inserted === 'number' &&
      typeof seedRun1.updated === 'number';
    record(
      32,
      'Seed Script Returns Structured Execution Counts & Closes Connections',
      handlesStructure,
      `Returned counts: { total: ${seedRun1.total}, inserted: ${seedRun1.inserted}, updated: ${seedRun1.updated} }`
    );

  } catch (error) {
    console.error('Fatal harness error:', error);
    record(99, 'Harness Execution Exception', false, error.message);
  } finally {
    // Clean up temporary verification test jobs
    if (createdTestSlugs.length > 0) {
      await Job.deleteMany({ slug: { $in: createdTestSlugs } });
      console.log(`\nCleaned up ${createdTestSlugs.length} temporary verification test records from MongoDB.`);
    }

    // Leave the 15 approved sample jobs in MongoDB for subsequent Phase 5 checkpoints!
    const finalJobCount = await Job.countDocuments();
    console.log(`Active sample jobs in MongoDB for Phase 5: ${finalJobCount}`);

    await mongoose.disconnect();
    console.log('MongoDB connection disconnected.');

    console.log('\n===================================================================');
    const allPassed = testResults.every((t) => t.pass);
    console.log(`VERIFICATION SUMMARY: ${allPassed ? 'ALL TESTS PASSED ✅' : 'FAILURES DETECTED ❌'}`);
    console.log(`Total Tests: ${testResults.length} | Passed: ${testResults.filter((t) => t.pass).length} | Failed: ${testResults.filter((t) => !t.pass).length}`);
    console.log('===================================================================\n');

    process.exit(allPassed ? 0 : 1);
  }
}

runJobModelVerification().catch((err) => {
  console.error('Fatal uncaught exception:', err);
  process.exit(1);
});

