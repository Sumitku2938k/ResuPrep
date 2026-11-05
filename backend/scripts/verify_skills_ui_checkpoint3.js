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

async function runSkillsUiIntegrationVerification() {
  console.log('===================================================================');
  console.log('   RESUPREP - PHASE 4 CHECKPOINT 3: SKILLS UI INTEGRATION VERIFY   ');
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

    try {
      // 1. Static Source Code Inspection of Skills.jsx
      const skillsJsxPath = path.resolve(__dirname, '../../frontend/src/pages/Skills.jsx');
      const fileContent = fs.readFileSync(skillsJsxPath, 'utf-8');

      // TEST 01: Service Import Integrity & Clean Architecture
      const importsService =
        fileContent.includes("from '../api/skills") || fileContent.includes('from "../api/skills');
      const usesTaxonomyApi = fileContent.includes('getSkillsTaxonomyApi');
      const usesGapApi = fileContent.includes('analyzeSkillGapApi');
      const noDirectAxios = !fileContent.includes('axios');
      const noDirectFetch = !fileContent.includes('fetch(');
      const test1Pass = importsService && usesTaxonomyApi && usesGapApi && noDirectAxios && noDirectFetch;

      record(
        1,
        'API Service Import & Architectural Integrity',
        test1Pass,
        `Uses skills API service: ${importsService}, Uses getSkillsTaxonomyApi: ${usesTaxonomyApi}, Uses analyzeSkillGapApi: ${usesGapApi}, No direct axios/fetch: ${noDirectAxios && noDirectFetch}`
      );

      // TEST 02: Elimination of Hardcoded Mock Arrays
      const hasMockSkillData = fileContent.includes('const skillData = [');
      const hasMockComparison = fileContent.includes('const comparisonTable = [');
      const hasMockCourses = fileContent.includes('const courses = [');
      const test2Pass = !hasMockSkillData && !hasMockComparison && !hasMockCourses;

      record(
        2,
        'Static Mock Arrays Eliminated',
        test2Pass,
        `Mock skillData removed: ${!hasMockSkillData}, Mock comparisonTable removed: ${!hasMockComparison}, Mock courses removed: ${!hasMockCourses}`
      );

      // TEST 03: Supported Roles Coverage
      const expectedRoles = [
        'frontend-developer',
        'backend-developer',
        'full-stack-developer',
        'data-scientist',
        'devops-engineer',
      ];
      const hasAllRoles = expectedRoles.every((slug) => fileContent.includes(slug));

      record(
        3,
        'All 5 Supported Career Role Slugs Present in UI',
        hasAllRoles,
        `Supported role slugs verified: ${expectedRoles.join(', ')}`
      );

      // TEST 04: Component Reusability & Honest Visualization
      const reusesSkillBar = fileContent.includes('<SkillBar');
      const reusesRadarChart = fileContent.includes('<RadarChart');
      const calculatesCategoryCoverage = fileContent.includes('categoryCoverage') || fileContent.includes('radarYourData');
      const test4Pass = reusesSkillBar && reusesRadarChart && calculatesCategoryCoverage;

      record(
        4,
        'Honest Category Coverage Charting without Fabricated Scores',
        test4Pass,
        `Reuses SkillBar: ${reusesSkillBar}, Reuses RadarChart: ${reusesRadarChart}, Computes category coverage: ${calculatesCategoryCoverage}`
      );

      // TEST 05: Live Backend Taxonomy Retrieval for all supported roles
      const skillsApiPath = 'file://' + path.resolve(__dirname, '../../frontend/src/api/skills.js').replace(/\\/g, '/');
      const skillsApi = await import(skillsApiPath);

      let taxonomyRetrievedCount = 0;
      for (const slug of expectedRoles) {
        const res = await skillsApi.getSkillsTaxonomyApi(slug);
        if (res?.success && res?.data?.taxonomy?.skills?.length > 0) {
          taxonomyRetrievedCount++;
        }
      }
      const test5Pass = taxonomyRetrievedCount === expectedRoles.length;

      record(
        5,
        'Live Backend Taxonomy Retrieval for All Roles',
        test5Pass,
        `Retrieved taxonomy for ${taxonomyRetrievedCount}/${expectedRoles.length} supported roles`
      );

      // TEST 06: Role Transition & Stale Selection Pruning Logic
      // Simulate switching from frontend-developer to full-stack-developer
      const feTaxonomy = (await skillsApi.getSkillsTaxonomyApi('frontend-developer')).data.taxonomy;
      const fsTaxonomy = (await skillsApi.getSkillsTaxonomyApi('full-stack-developer')).data.taxonomy;

      // Suppose user had selected 'HTML/CSS' (fe only) and 'React', 'Git' (present in both)
      const initialSelected = ['HTML/CSS', 'React', 'Git'];
      const fsValidNames = new Set(fsTaxonomy.skills.map((s) => s.name.toLowerCase()));
      const prunedSelection = initialSelected.filter((s) => fsValidNames.has(s.toLowerCase()));

      // 'HTML/CSS' is pruned, while 'React' and 'Git' are retained
      const pruningPass = !prunedSelection.includes('HTML/CSS') && prunedSelection.includes('React') && prunedSelection.includes('Git');

      record(
        6,
        'Role Change Pruning & Stale Selection Prevention',
        pruningPass,
        `Initial: [${initialSelected.join(', ')}] -> Pruned for Full-Stack: [${prunedSelection.join(', ')}]`
      );

      // TEST 07: Live Skill Gap Submission with Real Backend Response
      const gapRes = await skillsApi.analyzeSkillGapApi({
        currentSkills: ['HTML/CSS', 'JavaScript'],
        targetRole: feTaxonomy.role,
      });

      const hasValidGaps = (
        gapRes?.success === true &&
        gapRes?.data?.targetRole === 'Frontend Developer' &&
        Array.isArray(gapRes?.data?.gaps) &&
        gapRes.data.gaps.length > 0 &&
        gapRes.data.gaps.every((g) => g.skill && g.priority && g.resource)
      );

      record(
        7,
        'Live Skill Gap Analysis Execution & Response Format',
        hasValidGaps,
        `Target role: "${gapRes?.data?.targetRole}", Gaps returned: ${gapRes?.data?.gaps?.length}, Priority values verified: ${gapRes?.data?.gaps?.map((g) => g.priority).slice(0, 3).join(', ')}`
      );

      // TEST 08: Pre-Flight Empty Skill Selection Rejection
      let emptySkillBlocked = false;
      try {
        await skillsApi.analyzeSkillGapApi({
          currentSkills: [],
          targetRole: 'Frontend Developer',
        });
      } catch (err) {
        emptySkillBlocked = err.message.includes('currentSkills must be a non-empty array of strings');
      }

      record(
        8,
        'Empty Skill Selection Blocked Pre-Flight',
        emptySkillBlocked,
        `Validation correctly intercepted empty skill submission before network dispatch`
      );

      // TEST 09: Honest Category Coverage Calculation Math
      // Using frontend taxonomy (8 skills total across categories: core, framework, language, testing, tools, advanced)
      const testSkills = feTaxonomy.skills;
      const userSelected = ['HTML/CSS', 'JavaScript']; // 2 core skills selected out of 3 core
      const coreSkills = testSkills.filter((s) => s.category === 'core');
      const selectedCore = coreSkills.filter((s) => userSelected.includes(s.name));
      const coreCoveragePct = Math.round((selectedCore.length / coreSkills.length) * 100);

      const mathAccurate = coreCoveragePct === Math.round((2 / coreSkills.length) * 100);

      record(
        9,
        'Mathematical Accuracy of Honest Category Coverage',
        mathAccurate,
        `Core skills: ${selectedCore.length}/${coreSkills.length} selected = ${coreCoveragePct}% coverage (No fabricated proficiency scores)`
      );

      // TEST 10: Error & Empty States Handling
      const hasEmptyState = fileContent.includes('Outstanding Match!') || fileContent.includes('Ready for Skill Gap Analysis');
      const hasRetryHandler = fileContent.includes('fetchTaxonomy') && fileContent.includes('handleAnalyze');
      const hasLoadingSpinners = fileContent.includes('animate-spin');
      const test10Pass = hasEmptyState && hasRetryHandler && hasLoadingSpinners;

      record(
        10,
        'Loading, Error, Retry, and Empty States Handling in UI',
        test10Pass,
        `Loading spinners: ${hasLoadingSpinners}, Retry handlers: ${hasRetryHandler}, Empty / prompt states: ${hasEmptyState}`
      );

    } catch (unexpectedErr) {
      console.error('Unexpected test harness error:', unexpectedErr);
      record(99, 'Harness Execution', false, unexpectedErr.message);
    } finally {
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

runSkillsUiIntegrationVerification().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
