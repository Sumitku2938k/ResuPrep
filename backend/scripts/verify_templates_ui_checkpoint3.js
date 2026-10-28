const path = require('path');
const fs = require('fs');
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

async function runCheckpoint3Verification() {
  console.log('===============================================================');
  console.log('   RESUPREP - PHASE 3 CHECKPOINT 3: TEMPLATES UI INTEGRATION   ');
  console.log('===============================================================\n');

  const testResults = [];
  function record(name, pass, details) {
    testResults.push({ name, pass, details });
    console.log(`${pass ? '✅ PASS' : '❌ FAIL'}: ${name}`);
    if (details) console.log(`   └─ ${details}`);
  }

  // 1. Static Code Analysis on Templates.jsx
  console.log('--- 1. Static Code Inspection of Templates.jsx ---');
  const templatesJsxPath = path.resolve(__dirname, '../../frontend/src/pages/Templates.jsx');
  const templatesContent = fs.readFileSync(templatesJsxPath, 'utf8');

  // Check import of getTemplatesApi
  const importsApi = templatesContent.includes("import { getTemplatesApi } from '../api/templates'");
  record('TEST 1 - Imports getTemplatesApi', importsApi, 'Imports API client service from ../api/templates');

  // Check removal of hardcoded template array
  const hasHardcodedArray =
    templatesContent.includes("const templates = [") ||
    templatesContent.includes("name: 'Modern Professional', slug: 'modern-professional'");
  record('TEST 2 - Hardcoded Template Array Removed', !hasHardcodedArray, 'No static template array in Templates.jsx');

  // Check state declarations: templates, loading, error, activeTab
  const hasStates =
    templatesContent.includes('const [templates, setTemplates] = useState([])') &&
    templatesContent.includes('const [loading, setLoading] = useState(true)') &&
    templatesContent.includes('const [error, setError] = useState(null)') &&
    templatesContent.includes("const [activeTab, setActiveTab] = useState('all')");
  record('TEST 3 - Lifecycle & UI States Declared', hasStates, 'templates, loading, error, activeTab states initialized');

  // Check Loading UI
  const hasLoadingUI =
    templatesContent.includes('loading &&') &&
    templatesContent.includes('animate-spin') &&
    templatesContent.includes('Loading template catalogue...');
  record('TEST 4 - Loading Indicator State', hasLoadingUI, 'Glass-card loading spinner rendered while loading: true');

  // Check Error & Retry UI
  const hasErrorUI =
    templatesContent.includes('error && !loading') &&
    templatesContent.includes('Unable to Load Templates') &&
    templatesContent.includes('onClick={fetchTemplates}') &&
    templatesContent.includes('Try Again');
  record('TEST 5 - Error & Retry Action', hasErrorUI, 'User-friendly error card with functional retry button');

  // Check Empty State UI
  const hasEmptyUI =
    templatesContent.includes('filtered.length === 0') &&
    templatesContent.includes('No Templates Found') &&
    templatesContent.includes('Show All Templates');
  record('TEST 6 - Empty State & Filter Reset', hasEmptyUI, 'Empty state card with category reset action');

  // Check Template Selection & Navigation
  const hasNavigation =
    templatesContent.includes('navigate(\'/builder\', { state: { template } })') &&
    templatesContent.includes('handleSelectTemplate');
  record('TEST 7 - Navigation Passes Real Template State', hasNavigation, 'Passes actual template object with verified slug and previewConfig to /builder');

  // 2. Static Code Inspection of Builder.jsx
  console.log('\n--- 2. Static Code Inspection of Builder.jsx ---');
  const builderJsxPath = path.resolve(__dirname, '../../frontend/src/pages/Builder.jsx');
  const builderContent = fs.readFileSync(builderJsxPath, 'utf8');

  const builderHandlesPreview = builderContent.includes('setTemplateConfig(location.state.template.previewConfig)');
  const builderHandlesSlug = builderContent.includes('location.state?.template?.slug');
  const builderInitializesTemplate = builderContent.includes("template: 'modern'");

  record(
    'TEST 8 - Builder Template State Initialization',
    builderHandlesPreview && builderHandlesSlug && builderInitializesTemplate,
    'Builder safely reads previewConfig and slug from location.state, defaulting safely to modern'
  );

  // 3. Runtime API Integration against Live Express & MongoDB
  console.log('\n--- 3. Runtime API Verification ---');
  await connectDB();

  const server = app.listen(0, async () => {
    const port = server.address().port;
    process.env.VITE_API_URL = `http://localhost:${port}/api/v1`;
    console.log(`Test Express server running at: http://localhost:${port}/api/v1\n`);

    try {
      const templatesApiPath =
        'file://' + path.resolve(__dirname, '../../frontend/src/api/templates.js').replace(/\\/g, '/');
      const { getTemplatesApi } = await import(templatesApiPath);

      // Verify catalogue from DB
      const res = await getTemplatesApi();
      const count = res?.data?.templates?.length || 0;
      const test9Pass = res?.success === true && Array.isArray(res?.data?.templates) && count >= 8;
      record(
        'TEST 9 - Backend Template Catalogue Response',
        test9Pass,
        `HTTP 200 OK, templates returned from MongoDB: ${count}`
      );

      // Verify sample template structure matches card props
      const sample = res?.data?.templates?.[0];
      const validSchema =
        sample &&
        sample._id &&
        sample.name &&
        sample.slug &&
        sample.description &&
        sample.category &&
        sample.previewConfig &&
        sample.previewConfig.accentColor &&
        sample.previewConfig.layout &&
        sample.previewConfig.fontFamily;
      record(
        'TEST 10 - Template Schema Compatibility with TemplateCard',
        Boolean(validSchema),
        `Slug: ${sample?.slug}, Layout: ${sample?.previewConfig?.layout}, Accent: ${sample?.previewConfig?.accentColor}`
      );

      // SUMMARY
      console.log('\n===============================================================');
      const allPassed = testResults.every((t) => t.pass);
      console.log(
        `CHECKPOINT 3 VERIFICATION OUTCOME: ${allPassed ? 'ALL TESTS PASSED ✅' : 'FAILURES OBSERVED ❌'}`
      );
      console.log(
        `Total: ${testResults.length} | Passed: ${testResults.filter((t) => t.pass).length} | Failed: ${testResults.filter((t) => !t.pass).length}`
      );
      console.log('===============================================================\n');

      server.close();
      process.exit(allPassed ? 0 : 1);
    } catch (err) {
      console.error('\nRuntime verification failed with error:', err);
      server.close();
      process.exit(1);
    }
  });
}

runCheckpoint3Verification().catch((err) => {
  console.error('Fatal initialization error:', err);
  process.exit(1);
});
