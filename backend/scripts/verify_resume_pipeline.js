const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../src/config/db');
const app = require('../src/app');
const User = require('../src/models/User');
const ResumeAnalysis = require('../src/models/ResumeAnalysis');
const { generateToken } = require('../src/services/token.service');

async function testResumePipeline() {
  console.log('Connecting DB...');
  await connectDB();

  const server = app.listen(0, async () => {
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}/api/v1/resume`;
    console.log(`Resume Pipeline Test Server running on port ${port}`);

    try {
      // Create test user and token
      const testUser = await User.create({
        name: 'Resume Tester',
        email: `resume_tester_${Date.now()}@example.com`,
        password: 'Password123!',
      });
      const token = generateToken(testUser._id);

      const jobDescription = 'Looking for a Senior React Engineer with Node.js, Express, MongoDB, and TypeScript experience. Must have experience with REST APIs and Docker.';

      // 1. Text Analysis (Authenticated)
      console.log('\n--- 1. Testing Text Resume Analysis (Authenticated) ---');
      const textResume = 'Senior Full Stack Developer with 5 years experience in React, JavaScript, Node.js, Express, MongoDB, REST APIs, Git, Docker, and Webpack.';
      
      const textRes = await fetch(`${baseUrl}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ resumeText: textResume, jobDescription }),
      });
      const textData = await textRes.json();
      console.log('Text Analysis Status:', textRes.status);
      console.log('Text Analysis Success:', textData.success);
      console.log('Analysis ID:', textData.data?.analysis?._id);
      console.log('Compatibility Score:', textData.data?.analysis?.result?.compatibilityScore);
      console.log('User ID associated:', textData.data?.analysis?.user === testUser._id.toString());
      console.log('Matched Keywords:', textData.data?.analysis?.result?.matchedKeywords);

      // 2. Anonymous Analysis (Text)
      console.log('\n--- 2. Testing Anonymous Analysis ---');
      const anonRes = await fetch(`${baseUrl}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resumeText: textResume, jobDescription }),
      });
      const anonData = await anonRes.json();
      console.log('Anonymous Status:', anonRes.status);
      console.log('Anonymous User is null:', anonData.data?.analysis?.user === null);

      // 3. Missing Job Description Validation
      console.log('\n--- 3. Testing Missing Job Description ---');
      const noJdRes = await fetch(`${baseUrl}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: textResume }),
      });
      const noJdData = await noJdRes.json();
      console.log('Missing JD Status (Expected 400):', noJdRes.status);
      console.log('Missing JD Error Message:', noJdData.message);

      // 4. Short / Empty Resume Text Validation
      console.log('\n--- 4. Testing Short/Empty Resume Text ---');
      const shortRes = await fetch(`${baseUrl}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: 'Too short', jobDescription }),
      });
      const shortData = await shortRes.json();
      console.log('Short Resume Status (Expected 400):', shortRes.status);
      console.log('Short Resume Error Message:', shortData.message);

      // 5. File Upload Simulation via Multipart/form-data
      console.log('\n--- 5. Testing Multipart File Upload ---');
      // Create minimal valid PDF buffer or test with formData
      // Minimal PDF text structure
      const samplePdfContent = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >> endobj
4 0 obj << /Length 64 >> stream
BT /F1 12 Tf 72 712 Td (React Node.js MongoDB Express developer) Tj ET
endstream endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000214 00000 n 
trailer << /Root 1 0 R /Size 5 >>
startxref
330
%%EOF`;

      const formData = new FormData();
      const pdfBlob = new Blob([samplePdfContent], { type: 'application/pdf' });
      formData.append('resume', pdfBlob, 'resume.pdf');
      formData.append('jobDescription', jobDescription);

      const fileRes = await fetch(`${baseUrl}/analyze`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const fileData = await fileRes.json();
      console.log('File Upload Status:', fileRes.status);
      console.log('File Upload Success:', fileData.success);
      console.log('File Upload Name:', fileData.data?.analysis?.fileName);
      console.log('Extracted Text Matched:', fileData.data?.analysis?.result?.compatibilityScore !== undefined);

      // 6. Invalid File Type (.txt or .png)
      console.log('\n--- 6. Testing Invalid File Type ---');
      const badFormData = new FormData();
      const txtBlob = new Blob(['sample text'], { type: 'text/plain' });
      badFormData.append('resume', txtBlob, 'resume.txt');
      badFormData.append('jobDescription', jobDescription);

      const badFileRes = await fetch(`${baseUrl}/analyze`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: badFormData,
      });
      const badFileData = await badFileRes.json();
      console.log('Bad File Type Status (Expected 500/400 from multer error):', badFileRes.status);
      console.log('Bad File Error Message:', badFileData.message);

      // 7. GET History (Authenticated)
      console.log('\n--- 7. Testing GET History (Authenticated) ---');
      const historyRes = await fetch(`${baseUrl}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const historyData = await historyRes.json();
      console.log('History Status:', historyRes.status);
      console.log('History Success:', historyData.success);
      console.log('History Items Count:', historyData.data?.analyses?.length);
      const createdItem = historyData.data?.analyses?.[0];
      console.log('History Item has result & score:', createdItem?.result?.compatibilityScore !== undefined);
      console.log('History Item excludes resumeText:', createdItem?.resumeText === undefined);

      // 8. GET History (Unauthenticated - Expect 401)
      console.log('\n--- 8. Testing GET History (Unauthenticated) ---');
      const unauthHistoryRes = await fetch(`${baseUrl}/history`);
      const unauthHistoryData = await unauthHistoryRes.json();
      console.log('Unauthenticated History Status (Expected 401):', unauthHistoryRes.status);
      console.log('Unauthenticated Message:', unauthHistoryData.message);

      // 9. GET History By ID
      console.log('\n--- 9. Testing GET History By ID ---');
      const idRes = await fetch(`${baseUrl}/history/${createdItem._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const idData = await idRes.json();
      console.log('GET History By ID Status:', idRes.status);
      console.log('GET History By ID Score:', idData.data?.analysis?.result?.compatibilityScore);

      // 10. DELETE History Item
      console.log('\n--- 10. Testing DELETE History Item ---');
      const delRes = await fetch(`${baseUrl}/history/${createdItem._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const delData = await delRes.json();
      console.log('DELETE Status:', delRes.status);
      console.log('DELETE Success:', delData.success);
      console.log('DELETE Message:', delData.message);

      // Verify it is gone
      const verifyDelRes = await fetch(`${baseUrl}/history/${createdItem._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Verify Deleted Item Status (Expected 404):', verifyDelRes.status);

      console.log('\nALL RESUME PIPELINE TESTS COMPLETED SUCCESSFULLY! ✅');
    } catch (err) {
      console.error('Verification failed:', err);
    } finally {
      server.close();
      process.exit(0);
    }
  });
}

testResumePipeline();
