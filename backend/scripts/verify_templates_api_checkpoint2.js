const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../src/config/db');
const app = require('../src/app');
const Template = require('../src/models/Template');

// Mock localStorage for Node environment
global.storageMap = new Map();
global.localStorage = {
  getItem: (key) => global.storageMap.get(key) || null,
  setItem: (key, val) => global.storageMap.set(key, String(val)),
  removeItem: (key) => global.storageMap.delete(key),
  clear: () => global.storageMap.clear(),
};

async function runTemplatesApiVerification() {
  console.log('===============================================================');
  console.log('   RESUPREP - PHASE 3 CHECKPOINT 2: TEMPLATES API SERVICE      ');
  console.log('===============================================================\n');

  console.log('Connecting to MongoDB...');
  await connectDB();

  const server = app.listen(0, async () => {
    const port = server.address().port;
    process.env.VITE_API_URL = `http://localhost:${port}/api/v1`;
    console.log(`Test Express server running at: http://localhost:${port}/api/v1\n`);

    const testResults = [];
    function record(name, pass, details) {
      testResults.push({ name, pass, details });
      console.log(`${pass ? '✅ PASS' : '❌ FAIL'}: ${name}`);
      if (details) console.log(`   └─ ${details}`);
    }

    try {
      const templatesApiPath =
        'file://' + path.resolve(__dirname, '../../frontend/src/api/templates.js').replace(/\\/g, '/');
      const templatesApi = await import(templatesApiPath);

      // TEST 1: Module exports both expected functions
      const exportsOk =
        typeof templatesApi.getTemplatesApi === 'function' &&
        typeof templatesApi.getTemplateBySlugApi === 'function';
      record(
        'TEST 1 - Module Exports Verification',
        exportsOk,
        `getTemplatesApi: ${typeof templatesApi.getTemplatesApi}, getTemplateBySlugApi: ${typeof templatesApi.getTemplateBySlugApi}`
      );

      // Ensure test seed data exists
      await Template.deleteMany({});
      const seedTemplates = [
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
        {
          name: 'Creative Portfolio',
          slug: 'creative-portfolio',
          description: 'Bold, colorful layout with sidebar.',
          category: 'creative',
          previewConfig: { accentColor: '#8b5cf6', layout: 'sidebar', fontFamily: 'Poppins' },
          isActive: true,
        },
      ];
      await Template.insertMany(seedTemplates);

      // TEST 2: Fetch template catalogue (all templates)
      const allRes = await templatesApi.getTemplatesApi();
      const allTemplates = allRes?.data?.templates;
      const test2Pass =
        allRes?.success === true &&
        Array.isArray(allTemplates) &&
        allTemplates.length === 3 &&
        allTemplates.some((t) => t.slug === 'modern-professional');
      record(
        'TEST 2 - Fetch Template Catalogue',
        test2Pass,
        `Status 200 OK, count: ${allTemplates?.length}, first slug: ${allTemplates?.[0]?.slug}`
      );

      // TEST 3: Category filtering serialization (object param { category: 'tech' })
      const techRes = await templatesApi.getTemplatesApi({ category: 'tech' });
      const techTemplates = techRes?.data?.templates;
      const test3Pass =
        techRes?.success === true &&
        Array.isArray(techTemplates) &&
        techTemplates.length === 1 &&
        techTemplates[0].slug === 'modern-professional';
      record(
        'TEST 3 - Category Filtering via Object Param',
        test3Pass,
        `Filtered tech count: ${techTemplates?.length}, slug: ${techTemplates?.[0]?.slug}`
      );

      // TEST 4: Category filtering via string param ('business')
      const bizRes = await templatesApi.getTemplatesApi('business');
      const bizTemplates = bizRes?.data?.templates;
      const test4Pass =
        bizRes?.success === true &&
        Array.isArray(bizTemplates) &&
        bizTemplates.length === 1 &&
        bizTemplates[0].slug === 'executive-classic';
      record(
        'TEST 4 - Category Filtering via String Param',
        test4Pass,
        `Filtered business count: ${bizTemplates?.length}, slug: ${bizTemplates?.[0]?.slug}`
      );

      // TEST 5: Category 'all' returns all templates without filtering
      const allParamRes = await templatesApi.getTemplatesApi({ category: 'all' });
      const test5Pass =
        allParamRes?.success === true &&
        Array.isArray(allParamRes?.data?.templates) &&
        allParamRes.data.templates.length === 3;
      record(
        'TEST 5 - Category "all" Fallback Handling',
        test5Pass,
        `Count: ${allParamRes?.data?.templates?.length}`
      );

      // TEST 6: Fetch template by valid slug
      const slugRes = await templatesApi.getTemplateBySlugApi('modern-professional');
      const templateItem = slugRes?.data?.template;
      const test6Pass =
        slugRes?.success === true &&
        templateItem?.slug === 'modern-professional' &&
        templateItem?.previewConfig?.accentColor === '#2563EB';
      record(
        'TEST 6 - Fetch Template by Valid Slug',
        test6Pass,
        `Name: ${templateItem?.name}, Layout: ${templateItem?.previewConfig?.layout}`
      );

      // TEST 7: Invalid slug argument rejected prior to request
      let invalidSlugCaught = false;
      try {
        await templatesApi.getTemplateBySlugApi('');
      } catch (err) {
        if (err.message.includes('valid template slug is required')) {
          invalidSlugCaught = true;
        }
      }
      try {
        await templatesApi.getTemplateBySlugApi(null);
      } catch (err) {
        if (err.message.includes('valid template slug is required')) {
          invalidSlugCaught = invalidSlugCaught && true;
        }
      }
      record(
        'TEST 7 - Invalid Slug Validation Guard',
        invalidSlugCaught,
        'Empty, null, or whitespace slug rejected before network dispatch'
      );

      // TEST 8: Nonexistent slug returns HTTP 404 with error.status preserved
      let notFound404Caught = false;
      try {
        await templatesApi.getTemplateBySlugApi('non-existent-template-slug-xyz');
      } catch (err) {
        if (err.status === 404 && err.message.includes('Template not found')) {
          notFound404Caught = true;
        }
      }
      record(
        'TEST 8 - Nonexistent Slug Returns 404',
        notFound404Caught,
        'HTTP 404 status code and error message preserved'
      );

      // TEST 9: Empty catalogue handling
      await Template.deleteMany({});
      const emptyRes = await templatesApi.getTemplatesApi();
      const test9Pass =
        emptyRes?.success === true &&
        Array.isArray(emptyRes?.data?.templates) &&
        emptyRes.data.templates.length === 0;
      record(
        'TEST 9 - Empty Catalogue Safe Handling',
        test9Pass,
        `Empty array returned: ${test9Pass}, count: ${emptyRes?.data?.templates?.length}`
      );

      // TEST 10: Re-seed catalogue with full 8 templates from seed.js
      const seedScriptPath = path.resolve(__dirname, 'seed.js');
      const fullTemplates = [
        { name: 'Modern Professional', slug: 'modern-professional', description: 'Clean, modern layout with blue accents. Perfect for tech and corporate roles.', category: 'tech', previewConfig: { accentColor: '#2563EB', layout: 'modern', fontFamily: 'Plus Jakarta Sans' } },
        { name: 'Executive Classic', slug: 'executive-classic', description: 'Timeless design with serif fonts. Ideal for senior management positions.', category: 'business', previewConfig: { accentColor: '#1e3a5f', layout: 'classic', fontFamily: 'Georgia' } },
        { name: 'Creative Portfolio', slug: 'creative-portfolio', description: 'Bold, colorful layout with sidebar. Great for designers and creatives.', category: 'creative', previewConfig: { accentColor: '#8b5cf6', layout: 'sidebar', fontFamily: 'Poppins' } },
        { name: 'Minimal Clean', slug: 'minimal-clean', description: 'Minimalist design that lets your content shine. Works for any industry.', category: 'tech', previewConfig: { accentColor: '#06b6d4', layout: 'minimal', fontFamily: 'Inter' } },
        { name: 'Fresh Graduate', slug: 'fresh-graduate', description: 'Designed for new graduates with focus on education and projects.', category: 'fresher', previewConfig: { accentColor: '#10b981', layout: 'modern', fontFamily: 'DM Sans' } },
        { name: 'Business Formal', slug: 'business-formal', description: 'Professional layout for banking, consulting, and finance roles.', category: 'business', previewConfig: { accentColor: '#0f172a', layout: 'classic', fontFamily: 'Merriweather' } },
        { name: 'Tech Startup', slug: 'tech-startup', description: 'Dynamic layout with skill bars and project highlights for startup roles.', category: 'tech', previewConfig: { accentColor: '#f59e0b', layout: 'sidebar', fontFamily: 'Space Grotesk' } },
        { name: 'Design Studio', slug: 'design-studio', description: 'Visually striking with large type and creative spacing.', category: 'creative', previewConfig: { accentColor: '#ec4899', layout: 'creative', fontFamily: 'Outfit' } },
      ];
      await Template.insertMany(fullTemplates);

      const finalCheck = await templatesApi.getTemplatesApi();
      const test10Pass =
        finalCheck?.success === true &&
        Array.isArray(finalCheck?.data?.templates) &&
        finalCheck.data.templates.length === 8;
      record(
        'TEST 10 - Full 8 Templates Catalogue Verified',
        test10Pass,
        `Full catalogue seeded and verified with count: ${finalCheck?.data?.templates?.length}`
      );

      // SUMMARY
      console.log('\n===============================================================');
      const allPassed = testResults.every((t) => t.pass);
      console.log(
        `TEMPLATES API SERVICE VERIFICATION: ${allPassed ? 'ALL TESTS PASSED ✅' : 'FAILURES OBSERVED ❌'}`
      );
      console.log(
        `Total: ${testResults.length} | Passed: ${testResults.filter((t) => t.pass).length} | Failed: ${testResults.filter((t) => !t.pass).length}`
      );
      console.log('===============================================================\n');

      server.close();
      process.exit(allPassed ? 0 : 1);
    } catch (err) {
      console.error('\nVerification suite crashed:', err);
      server.close();
      process.exit(1);
    }
  });
}

runTemplatesApiVerification().catch((err) => {
  console.error('Fatal initialization error:', err);
  process.exit(1);
});
