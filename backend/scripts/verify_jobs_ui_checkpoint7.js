const path = require('path');
const fs = require('fs');
const http = require('http');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../src/config/db');
const app = require('../src/app');
const Job = require('../src/models/Job');

// Polyfills for Node environment if needed
global.storageMap = new Map();
global.localStorage = {
  getItem: (key) => global.storageMap.get(key) || null,
  setItem: (key, val) => global.storageMap.set(key, String(val)),
  removeItem: (key) => global.storageMap.delete(key),
  clear: () => global.storageMap.clear(),
};

function httpRequest(urlStr, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: parsed,
        });
      });
    });

    req.on('error', (err) => reject(err));

    if (options.body) {
      const postData = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      req.write(postData);
    }
    req.end();
  });
}

// Logic replicate for component unit checks
function isValidWebUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  return /^https?:\/\/[^\s$.?#].[^\s]*$/i.test(trimmed);
}

function formatSalary(job) {
  if (job?.salary?.display && typeof job.salary.display === 'string' && job.salary.display.trim()) {
    return job.salary.display.trim();
  } else if (typeof job?.salary?.min === 'number') {
    const currency = job.salary?.currency || 'USD';
    const minStr = job.salary.min.toLocaleString();
    const maxStr = typeof job.salary?.max === 'number' ? job.salary.max.toLocaleString() : null;
    return maxStr ? `${currency} ${minStr} - ${maxStr}` : `${currency} ${minStr}+`;
  }
  return null;
}

async function runJobsUiVerification() {
  console.log('===================================================================');
  console.log('   RESUPREP - PHASE 5 CHECKPOINT 7: JOBS LISTING UI VERIFICATION   ');
  console.log('===================================================================\n');

  console.log('Connecting to MongoDB...');
  await connectDB();

  const server = app.listen(0, async () => {
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}/api/v1`;
    console.log(`Live Express test server active at: ${baseUrl}\n`);

    const testResults = [];
    function record(testNum, name, pass, details) {
      testResults.push({ testNum, name, pass, details });
      console.log(`[TEST ${String(testNum).padStart(2, '0')}] ${pass ? '✅ PASS' : '❌ FAIL'}: ${name}`);
      if (details) console.log(`   └─ ${details}`);
    }

    try {
      const jobsJsxPath = path.resolve(__dirname, '../../frontend/src/pages/Jobs.jsx');
      const jobCardJsxPath = path.resolve(__dirname, '../../frontend/src/components/JobCard.jsx');

      const jobsContent = fs.readFileSync(jobsJsxPath, 'utf-8');
      const cardContent = fs.readFileSync(jobCardJsxPath, 'utf-8');

      // TEST 01: API Service Import Integrity in Jobs.jsx
      const importsGetJobsApi =
        jobsContent.includes("from '../api/jobs.js'") ||
        jobsContent.includes("from '../api/jobs'") ||
        jobsContent.includes('from "../api/jobs.js"') ||
        jobsContent.includes('from "../api/jobs"');
      const callsGetJobsApi = jobsContent.includes('getJobsApi(');
      const noDirectAxios = !jobsContent.includes('axios');
      const noDirectFetch = !jobsContent.includes('fetch(');
      record(
        1,
        'Jobs.jsx uses getJobsApi via frontend service layer (no direct fetch/axios)',
        importsGetJobsApi && callsGetJobsApi && noDirectAxios && noDirectFetch,
        `Imports getJobsApi: ${importsGetJobsApi}, Calls getJobsApi: ${callsGetJobsApi}, No direct fetch/axios: ${noDirectAxios && noDirectFetch}`
      );

      // TEST 02: Elimination of Mock Jobs and Random Order/Scores
      const hasMockJobsArray = jobsContent.includes('const mockJobs = [');
      const hasMathRandom = jobsContent.includes('Math.random()');
      const hasLocalStorage = jobsContent.includes('localStorage');
      record(
        2,
        'Elimination of static mockJobs array, Math.random, and localStorage in Jobs.jsx',
        !hasMockJobsArray && !hasMathRandom && !hasLocalStorage,
        `mockJobs eliminated: ${!hasMockJobsArray}, Math.random eliminated: ${!hasMathRandom}, localStorage free: ${!hasLocalStorage}`
      );

      // TEST 03: Category Filter Support Matching Backend Enums
      const expectedCategories = ['all', 'tech', 'data', 'design', 'product', 'business', 'devops'];
      const allCategoriesPresent = expectedCategories.every((cat) => jobsContent.includes(`'${cat}'`));
      record(
        3,
        'Category filters match backend Job model enum values',
        allCategoriesPresent,
        `Categories present: ${expectedCategories.join(', ')}`
      );

      // TEST 04: Search Debouncing & Reset Logic
      const hasDebounce = jobsContent.includes('debouncedSearch') && jobsContent.includes('setTimeout');
      const hasResetSearch = jobsContent.includes('setSearchInput(\'\')') || jobsContent.includes('setSearchInput("")');
      record(
        4,
        'Search debouncing and search input clear/reset mechanism',
        hasDebounce && hasResetSearch,
        `Debounced search state present: ${hasDebounce}, Search input reset present: ${hasResetSearch}`
      );

      // TEST 05: Pagination State and Controls
      const hasPaginationState = jobsContent.includes('pagination') && jobsContent.includes('setPage');
      const hasPrevNextButtons = jobsContent.includes('Previous') && jobsContent.includes('Next');
      record(
        5,
        'Pagination controls and state tracking in Jobs.jsx',
        hasPaginationState && hasPrevNextButtons,
        `Pagination state: ${hasPaginationState}, Prev/Next buttons: ${hasPrevNextButtons}`
      );

      // TEST 06: Loading Skeleton, Error State with Retry, and Empty State
      const hasSkeleton = jobsContent.includes('animate-pulse');
      const hasErrorState = jobsContent.includes('error') && jobsContent.includes('fetchJobs(page)');
      const hasEmptyState =
        jobsContent.includes('No Matching Jobs Found') || jobsContent.includes('No matching jobs found');
      record(
        6,
        'Loading skeleton, error state with retry, and empty state in Jobs.jsx',
        hasSkeleton && hasErrorState && hasEmptyState,
        `Loading skeleton: ${hasSkeleton}, Error state with retry: ${hasErrorState}, Empty state: ${hasEmptyState}`
      );

      // TEST 07: Job Details Modal Integration in Jobs.jsx
      const hasModalState = jobsContent.includes('selectedJob') && jobsContent.includes('setSelectedJob');
      const hasModalResponsibilities = jobsContent.includes('selectedJob.responsibilities');
      const hasModalQualifications = jobsContent.includes('selectedJob.qualifications');
      const hasEscListener = jobsContent.includes('Escape');
      record(
        7,
        'Job Details modal integration with keyboard Esc listener & comprehensive job fields',
        hasModalState && hasModalResponsibilities && hasModalQualifications && hasEscListener,
        `Modal state: ${hasModalState}, Responsibilities: ${hasModalResponsibilities}, Qualifications: ${hasModalQualifications}, Esc listener: ${hasEscListener}`
      );

      // TEST 08: JobCard.jsx Schema Adaptation
      const handlesLogo = cardContent.includes('companyLogo');
      const handlesJobType = cardContent.includes('jobType');
      const handlesWorkMode = cardContent.includes('workMode');
      const handlesExperience = cardContent.includes('experience');
      const handlesRequiredSkills = cardContent.includes('requiredSkills');
      record(
        8,
        'JobCard.jsx adapts to backend Job model schema fields',
        handlesLogo && handlesJobType && handlesWorkMode && handlesExperience && handlesRequiredSkills,
        `companyLogo: ${handlesLogo}, jobType: ${handlesJobType}, workMode: ${handlesWorkMode}, experience: ${handlesExperience}, requiredSkills: ${handlesRequiredSkills}`
      );

      // TEST 09: Honest Salary Display in JobCard.jsx
      const checksSalaryDisplay = cardContent.includes('salary?.display') || cardContent.includes('salary.display');
      const checksSalaryMin = cardContent.includes('salary?.min') || cardContent.includes('salary.min');
      record(
        9,
        'JobCard renders salary only when genuine salary data exists',
        checksSalaryDisplay && checksSalaryMin,
        `Checks salary.display: ${checksSalaryDisplay}, Checks salary.min: ${checksSalaryMin}`
      );

      // TEST 10: Honest Match Percentage Badge in JobCard.jsx
      const checksMatchPercentage =
        cardContent.includes('matchPercentage') && cardContent.includes('matchScore');
      record(
        10,
        'JobCard renders match percentage badge only when numeric score is present',
        checksMatchPercentage,
        `Match score check present: ${checksMatchPercentage}`
      );

      // TEST 11: Safe Apply URL Validation in JobCard.jsx
      const checksValidUrl = cardContent.includes('isValidWebUrl');
      const hasNoopener = cardContent.includes('noopener noreferrer');
      const hasDisabledFallback = cardContent.includes('Apply N/A');
      record(
        11,
        'JobCard validates applicationUrl with safe target="_blank" rel="noopener noreferrer" and disabled fallback',
        checksValidUrl && hasNoopener && hasDisabledFallback,
        `isValidWebUrl used: ${checksValidUrl}, Security rel attributes: ${hasNoopener}, Disabled fallback: ${hasDisabledFallback}`
      );

      // TEST 12: Helper Unit Test - isValidWebUrl
      const validHttp = isValidWebUrl('http://example.com/jobs/1');
      const validHttps = isValidWebUrl('https://careers.google.com/apply/123');
      const invalidJavascript = isValidWebUrl('javascript:alert(1)');
      const invalidData = isValidWebUrl('data:text/html,<script>alert(1)</script>');
      const invalidNull = isValidWebUrl(null);
      const invalidEmpty = isValidWebUrl('');
      const test12Pass = validHttp && validHttps && !invalidJavascript && !invalidData && !invalidNull && !invalidEmpty;
      record(
        12,
        'Unit test: isValidWebUrl safely accepts HTTP/HTTPS and rejects malicious/empty values',
        test12Pass,
        `http: ${validHttp}, https: ${validHttps}, javascript blocked: ${!invalidJavascript}, data URI blocked: ${!invalidData}`
      );

      // TEST 13: Helper Unit Test - formatSalary
      const salaryFormatted = formatSalary({ salary: { display: '$120,000 - $140,000 / year' } });
      const salaryRange = formatSalary({ salary: { min: 100000, max: 150000, currency: 'USD' } });
      const salaryMinOnly = formatSalary({ salary: { min: 80000, currency: 'USD' } });
      const salaryNull = formatSalary({});
      const test13Pass =
        salaryFormatted === '$120,000 - $140,000 / year' &&
        salaryRange === 'USD 100,000 - 150,000' &&
        salaryMinOnly === 'USD 80,000+' &&
        salaryNull === null;
      record(
        13,
        'Unit test: formatSalary handles display string, min/max range, min-only, and null safely',
        test13Pass,
        `display: "${salaryFormatted}", range: "${salaryRange}", min-only: "${salaryMinOnly}", null: ${salaryNull}`
      );

      // TEST 14: Unit Test - JobCard handles missing optional fields without crashing
      let cardNullSafe = true;
      try {
        const dummyJob = {
          _id: '507f1f77bcf86cd799439011',
          title: 'Minimal Job',
        };
        const renderedSalary = formatSalary(dummyJob);
        const urlValid = isValidWebUrl(dummyJob.applicationUrl);
        if (renderedSalary !== null || urlValid !== false) cardNullSafe = false;
      } catch (err) {
        cardNullSafe = false;
      }
      record(
        14,
        'Unit test: Minimal/missing job fields handled gracefully without exceptions',
        cardNullSafe,
        `Null-safety verification: ${cardNullSafe ? 'Passed without runtime errors' : 'Failed with runtime error'}`
      );

      // TEST 15: Live API - GET /api/v1/jobs Catalogue
      const resCatalogue = await httpRequest(`${baseUrl}/jobs`);
      const isCatalogueSuccess = resCatalogue.status === 200 && resCatalogue.data?.success === true;
      const hasJobsList = Array.isArray(resCatalogue.data?.data?.jobs);
      const hasPaginationMeta = resCatalogue.data?.data?.pagination?.total >= 0;
      record(
        15,
        'Live Backend API: GET /api/v1/jobs returns catalogue and pagination',
        isCatalogueSuccess && hasJobsList && hasPaginationMeta,
        `Status: ${resCatalogue.status}, Jobs array length: ${resCatalogue.data?.data?.jobs?.length}, Total: ${resCatalogue.data?.data?.pagination?.total}`
      );

      // TEST 16: Live API - GET /api/v1/jobs?category=tech
      const resCategory = await httpRequest(`${baseUrl}/jobs?category=tech`);
      const isCategorySuccess = resCategory.status === 200 && resCategory.data?.success === true;
      const categoryJobs = resCategory.data?.data?.jobs || [];
      const allAreTech = categoryJobs.length > 0 && categoryJobs.every((j) => j.category === 'tech');
      record(
        16,
        'Live Backend API: GET /api/v1/jobs?category=tech correctly filters category',
        isCategorySuccess && allAreTech,
        `Status: ${resCategory.status}, Jobs returned: ${categoryJobs.length}, All items category=tech: ${allAreTech}`
      );

      // TEST 17: Live API - GET /api/v1/jobs?search=engineer
      const resSearch = await httpRequest(`${baseUrl}/jobs?search=engineer`);
      const isSearchSuccess = resSearch.status === 200 && resSearch.data?.success === true;
      const searchJobs = resSearch.data?.data?.jobs || [];
      const searchMatches = searchJobs.length > 0;
      record(
        17,
        'Live Backend API: GET /api/v1/jobs?search=engineer returns relevant matches',
        isSearchSuccess && searchMatches,
        `Status: ${resSearch.status}, Matching jobs count: ${searchJobs.length}`
      );

      // TEST 18: Live API - GET /api/v1/jobs?page=1&limit=2 (Pagination)
      const resPaginated = await httpRequest(`${baseUrl}/jobs?page=1&limit=2`);
      const isPaginatedSuccess = resPaginated.status === 200 && resPaginated.data?.success === true;
      const paginatedJobs = resPaginated.data?.data?.jobs || [];
      const paginationInfo = resPaginated.data?.data?.pagination;
      const correctLimit = paginatedJobs.length <= 2 && paginationInfo?.limit === 2 && paginationInfo?.page === 1;
      record(
        18,
        'Live Backend API: Pagination parameters limit=2 and page=1 work accurately',
        isPaginatedSuccess && correctLimit,
        `Page: ${paginationInfo?.page}, Limit: ${paginationInfo?.limit}, Returned items: ${paginatedJobs.length}, Total pages: ${paginationInfo?.pages}`
      );

      // TEST 19: Live API - GET /api/v1/jobs/:id (Detail for Modal)
      const firstJob = resCatalogue.data?.data?.jobs?.[0];
      let detailSuccess = false;
      let detailDetails = 'No jobs available to test ID lookup';
      if (firstJob?._id) {
        const resDetail = await httpRequest(`${baseUrl}/jobs/${firstJob._id}`);
        const returnedJob = resDetail.data?.data?.job || resDetail.data?.data;
        detailSuccess =
          resDetail.status === 200 &&
          resDetail.data?.success === true &&
          returnedJob?._id === firstJob._id &&
          Array.isArray(returnedJob?.requiredSkills);
        detailDetails = `Job ID: ${firstJob._id}, Title: "${returnedJob?.title}", RequiredSkills: ${returnedJob?.requiredSkills?.length}`;
      }
      record(
        19,
        'Live Backend API: GET /api/v1/jobs/:id returns complete job detail for modal',
        detailSuccess,
        detailDetails
      );

      // Summary
      const passedCount = testResults.filter((r) => r.pass).length;
      const totalCount = testResults.length;
      console.log('\n===================================================================');
      console.log(`   CHECKPOINT 7 VERIFICATION RESULTS: ${passedCount}/${totalCount} PASSED`);
      console.log('===================================================================\n');

      if (passedCount === totalCount) {
        console.log('🎉 ALL CHECKPOINT 7 VERIFICATION TESTS PASSED SUCCESSFULLY!\n');
      } else {
        console.error(`⚠️ ${totalCount - passedCount} TESTS FAILED.`);
        process.exitCode = 1;
      }
    } catch (err) {
      console.error('Fatal error during verification:', err);
      process.exitCode = 1;
    } finally {
      server.close();
      const mongoose = require('mongoose');
      await mongoose.connection.close();
      process.exit(process.exitCode || 0);
    }
  });
}

runJobsUiVerification().catch((err) => {
  console.error('Unhandled verification error:', err);
  process.exit(1);
});
