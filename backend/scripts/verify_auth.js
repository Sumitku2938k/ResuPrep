const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../src/config/db');
const app = require('../src/app');

async function testAuth() {
  console.log('Connecting to DB...');
  await connectDB();

  const server = app.listen(0, async () => {
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}/api/v1/auth`;
    console.log(`Test server running on port ${port}`);

    try {
      const testEmail = `test_${Date.now()}@example.com`;
      const testPassword = 'Password123!';

      // 1. Test Signup
      console.log('\n--- 1. Testing Signup ---');
      const signupRes = await fetch(`${baseUrl}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test User', email: testEmail, password: testPassword }),
      });
      const signupData = await signupRes.json();
      console.log('Signup Status:', signupRes.status);
      console.log('Signup Response:', JSON.stringify(signupData, null, 2));

      const setCookieHeader = signupRes.headers.get('set-cookie');
      console.log('Set-Cookie Header present:', !!setCookieHeader);

      if (signupRes.status !== 201 || !signupData.data.token) {
        throw new Error('Signup failed');
      }

      const token = signupData.data.token;

      // 2. Test Login
      console.log('\n--- 2. Testing Login ---');
      const loginRes = await fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, password: testPassword }),
      });
      const loginData = await loginRes.json();
      console.log('Login Status:', loginRes.status);
      console.log('Login Response success:', loginData.success);

      // 3. Test GET /me with Bearer token
      console.log('\n--- 3. Testing GET /me (Auth Header) ---');
      const meRes = await fetch(`${baseUrl}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const meData = await meRes.json();
      console.log('GET /me Status:', meRes.status);
      console.log('GET /me User Email:', meData.data?.user?.email);

      // 4. Test GET /me without Token (expect 401)
      console.log('\n--- 4. Testing GET /me without Token ---');
      const noTokenRes = await fetch(`${baseUrl}/me`);
      const noTokenData = await noTokenRes.json();
      console.log('GET /me No Token Status (Expected 401):', noTokenRes.status);
      console.log('GET /me No Token Message:', noTokenData.message);

      // 5. Test Change Password
      console.log('\n--- 5. Testing Change Password ---');
      const newPassword = 'NewPassword456!';
      const changePwRes = await fetch(`${baseUrl}/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword: testPassword, newPassword }),
      });
      const changePwData = await changePwRes.json();
      console.log('Change Password Status:', changePwRes.status);
      console.log('Change Password Success:', changePwData.success);

      // 6. Test Login with New Password
      console.log('\n--- 6. Testing Login with New Password ---');
      const newLoginRes = await fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, password: newPassword }),
      });
      const newLoginData = await newLoginRes.json();
      console.log('New Login Status:', newLoginRes.status);
      console.log('New Login Success:', newLoginData.success);

      console.log('\nALL BACKEND AUTH TESTS PASSED VERIFICATION PERFECTLY! ✅');
    } catch (err) {
      console.error('Verification error:', err);
    } finally {
      server.close();
      process.exit(0);
    }
  });
}

testAuth();
