const { parseFile } = require('../src/services/fileParser.service');

function buildValidPdf(textContent) {
  let content = `BT /F1 12 Tf 72 712 Td (${textContent}) Tj ET`;
  let streamLen = Buffer.byteLength(content, 'utf8');

  let body = '';
  const offsets = [];

  function addObj(str) {
    offsets.push(Buffer.byteLength(body, 'latin1'));
    body += str + '\n';
  }

  body += '%PDF-1.4\n';

  // 1 0 obj: Catalog
  addObj('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');

  // 2 0 obj: Pages
  addObj('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj');

  // 3 0 obj: Page
  addObj('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj');

  // 4 0 obj: Font
  addObj('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj');

  // 5 0 obj: Content stream
  addObj(`5 0 obj\n<< /Length ${streamLen} >>\nstream\n${content}\nendstream\nendobj`);

  const startXref = Buffer.byteLength(body, 'latin1');

  let xref = `xref\n0 6\n0000000000 65535 f \r\n`;
  for (let i = 0; i < 5; i++) {
    xref += String(offsets[i]).padStart(10, '0') + ' 00000 n \r\n';
  }

  const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;

  return Buffer.from(body + xref + trailer, 'latin1');
}

async function testPdf() {
  const pdfBuffer = buildValidPdf('Experienced React, Node.js, Express, MongoDB, TypeScript, Docker developer.');
  console.log('PDF buffer size:', pdfBuffer.length);
  try {
    const text = await parseFile(pdfBuffer, 'application/pdf');
    console.log('Extracted text:', JSON.stringify(text.trim()));
    console.log('PDF PARSING SUCCESSFUL! ✅');
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testPdf();
