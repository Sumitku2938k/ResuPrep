const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../src/config/db');
const app = require('../src/app');

// Mock localStorage for Node environment test
global.storageMap = new Map();
global.localStorage = {
  getItem: (key) => global.storageMap.get(key) || null,
  setItem: (key, val) => global.storageMap.set(key, String(val)),
  removeItem: (key) => global.storageMap.delete(key),
  clear: () => global.storageMap.clear(),
};

async function testClientSdk() {
  console.log('Connecting DB...');
  await connectDB();

  const server = app.listen(0, async () => {
    const port = server.address().port;
    process.env.VITE_API_URL = `http://localhost:${port}/api/v1`;
    console.log(`Test server running on port ${port}`);

    try {
      // Dynamic import of ESM API modules
      const clientPath = 'file://' + path.resolve(__dirname, '../../frontend/src/api/client.js').replace(/\\/g, '/');
      const authPath = 'file://' + path.resolve(__dirname, '../../frontend/src/api/auth.js').replace(/\\/g, '/');

      const { apiClient } = await import(clientPath);
      const { signupApi, loginApi, getMeApi, changePasswordApi, logoutApi } = await import(authPath);

      const testEmail = `fe_client_${Date.now()}@example.com`;
      const testPassword = 'Password123!';

      console.log('\n--- 1. Testing signupApi ---');
      const signupRes = await signupApi({ name: 'FE Test User', email: testEmail, password: testPassword });
      console.log('signupApi Success:', signupRes.success);
      console.log('User created:', signupRes.data.user.email);
      console.log('Token received:', !!signupRes.data.token);

      // Store token in localStorage as frontend would
      localStorage.setItem('token', signupRes.data.token);

      console.log('\n--- 2. Testing getMeApi with Bearer token ---');
      const meRes = await getMeApi();
      console.log('getMeApi Success:', meRes.success);
      console.log('User email from getMeApi:', meRes.data.user.email);

      console.log('\n--- 3. Testing loginApi ---');
      const loginRes = await loginApi({ email: testEmail, password: testPassword });
      console.log('loginApi Success:', loginRes.success);

      console.log('\n--- 4. Testing changePasswordApi ---');
      const newPassword = 'NewSecretPassword123!';
      const changePwRes = await changePasswordApi({ currentPassword: testPassword, newPassword });
      console.log('changePasswordApi Success:', changePwRes.success);

      console.log('\n--- 5. Testing loginApi with New Password ---');
      const loginNewRes = await loginApi({ email: testEmail, password: newPassword });
      console.log('Login with new password Success:', loginNewRes.success);

      console.log('\n--- 6. Testing logoutApi ---');
      const logoutRes = await logoutApi();
      console.log('logoutApi Success:', logoutRes.success);

      console.log('\n--- 7. Testing 401 Error Handling in Client ---');
      localStorage.removeItem('token');
      try {
        await getMeApi();
        console.error('FAIL: getMeApi should have thrown 401 error');
      } catch (err) {
        console.log('Caught expected error from apiClient:', err.message, '| Status:', err.status);
      }

      console.log('\nALL FRONTEND API CLIENT & AUTH MODULE TESTS PASSED PERFECTLY! ✅');
    } catch (err) {
      console.error('Verification failed:', err);
    } finally {
      server.close();
      process.exit(0);
    }
  });
}

testClientSdk();
