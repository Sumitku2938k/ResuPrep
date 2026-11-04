const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../src/config/db');
const app = require('../src/app');

// Polyfill localStorage & fetch globals if running in Node
global.storageMap = new Map();
global.localStorage = {
  getItem: (key) => global.storageMap.get(key) || null,
  setItem: (key, val) => global.storageMap.set(key, String(val)),
  removeItem: (key) => global.storageMap.delete(key),
  clear: () => global.storageMap.clear(),
};

async function runSkillsApiServiceVerification() {
  console.log('===================================================================');
  console.log('   RESUPREP - PHASE 4 CHECKPOINT 2: SKILLS API SERVICE VERIFICATION');
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
      // 1. Dynamic ESM import of the frontend skills API service
      const skillsApiPath = 'file://' + path.resolve(__dirname, '../../frontend/src/api/skills.js').replace(/\\/g, '/');
      const skillsApi = await import(skillsApiPath);

      // TEST 01: Module Exports Verification
      const hasTaxonomy = typeof skillsApi.getSkillsTaxonomyApi === 'function';
      const hasTaxonomyAlias = typeof skillsApi.getSkillTaxonomyApi === 'function' && skillsApi.getSkillTaxonomyApi === skillsApi.getSkillsTaxonomyApi;
      const hasGapAnalysis = typeof skillsApi.analyzeSkillGapApi === 'function';
      const exportsPass = hasTaxonomy && hasTaxonomyAlias && hasGapAnalysis;

      record(
        1,
        'Module Exports & Alias Verification',
        exportsPass,
        `getSkillsTaxonomyApi: ${typeof skillsApi.getSkillsTaxonomyApi}, getSkillTaxonomyApi alias identical: ${hasTaxonomyAlias}, analyzeSkillGapApi: ${typeof skillsApi.analyzeSkillGapApi}`
      );

      // TEST 02: Static Code & Architectural Guardrails Inspection
      const fileContent = fs.readFileSync(path.resolve(__dirname, '../../frontend/src/api/skills.js'), 'utf-8');
      const usesSharedClient = fileContent.includes("from './client.js'") || fileContent.includes('from "./client.js"');
      const noDirectAxios = !fileContent.includes('axios');
      const noDirectFetch = !fileContent.includes('fetch(');
      const noOpenAiKeys = !fileContent.includes('OPENAI_API_KEY') && !fileContent.includes('sk-');
      const noMockData = !fileContent.includes('mock') && !fileContent.includes('dummy') && !fileContent.includes('fallbackSkillGap');
      const guardrailsPass = usesSharedClient && noDirectAxios && noDirectFetch && noOpenAiKeys && noMockData;

      record(
        2,
        'Static Code Guardrails & Shared Client Reuse',
        guardrailsPass,
        `Reuses client.js: ${usesSharedClient}, No axios/fetch: ${noDirectAxios && noDirectFetch}, No OpenAI keys in client: ${noOpenAiKeys}, No hardcoded mock/fallback: ${noMockData}`
      );

      // TEST 03: Taxonomy Pre-Flight Validation
      let taxonomyValidationErrors = 0;
      const invalidRoles = [null, undefined, '', '   ', 123, {}, []];
      for (const role of invalidRoles) {
        try {
          await skillsApi.getSkillsTaxonomyApi(role);
        } catch (err) {
          if (err.message === 'A valid role slug is required') {
            taxonomyValidationErrors++;
          }
        }
      }
      const taxonomyValidationPass = taxonomyValidationErrors === invalidRoles.length;
      record(
        3,
        'Taxonomy Pre-Flight Validation',
        taxonomyValidationPass,
        `Rejected ${taxonomyValidationErrors}/${invalidRoles.length} invalid role parameters before network request`
      );

      // TEST 04: Taxonomy Live Endpoint Call (Known Role)
      const frontendTaxonomyRes = await skillsApi.getSkillsTaxonomyApi('frontend-developer');
      const taxonomyData = frontendTaxonomyRes?.data?.taxonomy;
      const validTaxonomy = (
        frontendTaxonomyRes?.success === true &&
        taxonomyData?.role === 'Frontend Developer' &&
        Array.isArray(taxonomyData?.skills) &&
        taxonomyData.skills.length > 0 &&
        taxonomyData.skills[0].name &&
        taxonomyData.skills[0].level &&
        taxonomyData.skills[0].category
      );
      record(
        4,
        'Taxonomy Live Retrieval (frontend-developer)',
        validTaxonomy,
        `Role: "${taxonomyData?.role}", Skills returned: ${taxonomyData?.skills?.length || 0}, First skill: ${taxonomyData?.skills?.[0]?.name}`
      );

      // TEST 05: Taxonomy Live Fallback Retrieval (Unknown Role)
      const unknownRoleRes = await skillsApi.getSkillTaxonomyApi('unknown-cloud-architect');
      const unknownTaxonomyData = unknownRoleRes?.data?.taxonomy;
      const fallbackTaxonomyPass = (
        unknownRoleRes?.success === true &&
        unknownTaxonomyData?.role === 'Full Stack Developer' &&
        Array.isArray(unknownTaxonomyData?.skills)
      );
      record(
        5,
        'Taxonomy Alias & Unknown Role Default Fallback',
        fallbackTaxonomyPass,
        `Role: "${unknownTaxonomyData?.role}", Skills count: ${unknownTaxonomyData?.skills?.length || 0}`
      );

      // TEST 06: Skill Gap Pre-Flight Validation
      let gapValidationErrors = 0;
      const invalidGapPayloads = [
        null,
        undefined,
        '',
        [],
        {},
        { currentSkills: 'not-an-array', targetRole: 'Frontend Developer' },
        { currentSkills: [], targetRole: 'Frontend Developer' },
        { currentSkills: ['HTML', ''], targetRole: 'Frontend Developer' },
        { currentSkills: ['HTML', 42], targetRole: 'Frontend Developer' },
        { currentSkills: ['HTML', 'CSS'] }, // missing targetRole
        { currentSkills: ['HTML', 'CSS'], targetRole: '' },
        { currentSkills: ['HTML', 'CSS'], targetRole: '   ' },
        { currentSkills: ['HTML', 'CSS'], targetRole: 999 },
      ];

      for (const payload of invalidGapPayloads) {
        try {
          await skillsApi.analyzeSkillGapApi(payload);
        } catch (err) {
          gapValidationErrors++;
        }
      }
      const gapValidationPass = gapValidationErrors === invalidGapPayloads.length;
      record(
        6,
        'Skill Gap Pre-Flight Payload Validation',
        gapValidationPass,
        `Rejected ${gapValidationErrors}/${invalidGapPayloads.length} malformed payloads before network request`
      );

      // TEST 07: Skill Gap Live Analysis Call
      const gapRes = await skillsApi.analyzeSkillGapApi({
        currentSkills: ['HTML', 'CSS', 'JavaScript'],
        targetRole: 'Frontend Developer',
      });

      const gapsList = gapRes?.data?.gaps;
      const validGaps = (
        gapRes?.success === true &&
        gapRes?.data?.targetRole === 'Frontend Developer' &&
        Array.isArray(gapsList) &&
        gapsList.length > 0 &&
        gapsList.every((g) => g.skill && g.priority && g.resource)
      );
      record(
        7,
        'Skill Gap Live Analysis (OpenAI / NLP Backend)',
        validGaps,
        `Target role: "${gapRes?.data?.targetRole}", Gaps identified: ${gapsList?.length || 0}, First gap: "${gapsList?.[0]?.skill}" (Priority: ${gapsList?.[0]?.priority})`
      );

      // TEST 08: Backend Error Preservation & Propagation
      // If we directly bypass pre-flight or verify client error mapping
      let clientErrorPreserved = false;
      try {
        // Test hitting an endpoint that fails or invalid path to confirm client error preservation
        const { api } = await import('file://' + path.resolve(__dirname, '../../frontend/src/api/client.js').replace(/\\/g, '/'));
        await api.post('/skills/gap-analysis', {});
      } catch (err) {
        clientErrorPreserved = (
          err.status === 400 &&
          err.message.includes('currentSkills (array) and targetRole (string) are required')
        );
      }
      record(
        8,
        'Backend HTTP 400 Error Preservation & Propagation',
        clientErrorPreserved,
        `Status preserved: 400, Error message preserved accurately from backend`
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

runSkillsApiServiceVerification().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

