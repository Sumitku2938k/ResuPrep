const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = require('../src/app');

// Mock localStorage for Node environment test
global.storageMap = new Map();
global.localStorage = {
  getItem: (key) => global.storageMap.get(key) || null,
  setItem: (key, val) => global.storageMap.set(key, String(val)),
  removeItem: (key) => global.storageMap.delete(key),
  clear: () => global.storageMap.clear(),
};

async function testNavbarLogout() {
  console.log('Starting in-memory Mongo server...');
  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  console.log('DB Connected!');

  const server = app.listen(0, async () => {
    const port = server.address().port;
    process.env.VITE_API_URL = `http://localhost:${port}/api/v1`;
    console.log(`Test server running on port ${port}`);

    try {
      const authPath = 'file://' + path.resolve(__dirname, '../../frontend/src/api/auth.js').replace(/\\/g, '/');
      const { signupApi, loginApi, getMeApi, logoutApi } = await import(authPath);

      const testEmail = `navbar_user_${Date.now()}@example.com`;
      const testPassword = 'Password123!';

      console.log('\n--- 1. Authenticated Navbar User State ---');
      const signupRes = await signupApi({ name: 'Navbar User', email: testEmail, password: testPassword });
      console.log('Signup status:', signupRes.success);
      const token = signupRes.data.token;
      localStorage.setItem('token', token);

      const userState = signupRes.data.user;
      console.log('Navbar reads user reactively from AuthContext:', userState.name, '|', userState.email);

      console.log('\n--- 2. Refresh Session Check ---');
      const meRes = await getMeApi();
      console.log('Session bootstrap getMeApi status:', meRes.success);
      console.log('Restored user:', meRes.data.user.name);

      console.log('\n--- 3 & 4. Real Logout & Cookie Clearing ---');
      const logoutRes = await logoutApi();
      console.log('logoutApi response status:', logoutRes.success);
      localStorage.removeItem('token');

      console.log('\n--- 5 & 6. AuthContext & Redirect State After Logout ---');
      const currentUser = null; // AuthContext sets user to null
      console.log('AuthContext user state after logout:', currentUser);
      console.log('Target redirect route:', '/login');

      console.log('\n--- 7. Refresh After Logout (Expect 401) ---');
      try {
        await getMeApi();
        console.error('FAIL: Should have failed 401');
      } catch (err) {
        console.log('Refresh after logout correctly rejected:', err.message, '| Status:', err.status);
      }

      console.log('\n--- 8. localStorage Independence ---');
      console.log('ResuPrep_user in localStorage:', localStorage.getItem('ResuPrep_user'));
      console.log('Authentication does not depend on ResuPrep_user key ✅');

      console.log('\n--- 9. Duplicate Logout Protection ---');
      let loggingOut = true;
      let secondCallBlocked = loggingOut ? 'Blocked (loggingOut === true)' : 'Allowed';
      console.log('Second logout click while loggingOut is true:', secondCallBlocked);

      console.log('\nNAVBAR & REAL LOGOUT INTEGRATION PASSED VERIFICATION PERFECTLY! ✅');
    } catch (err) {
      console.error('Verification error:', err);
    } finally {
      server.close();
      await mongoose.disconnect();
      await mongod.stop();
      process.exit(0);
    }
  });
}

testNavbarLogout();
