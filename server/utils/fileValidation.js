function isDocx(buffer) {
  if (buffer.length < 22 || buffer.readUInt32LE(0) !== 0x04034b50) return false;
  const minOffset = Math.max(0, buffer.length - 22 - 0xffff);
  let endRecord = -1;
  for (let offset = buffer.length - 22; offset >= minOffset; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) { endRecord = offset; break; }
  }
  if (endRecord < 0 || endRecord + 22 > buffer.length) return false;
  const entries = buffer.readUInt16LE(endRecord + 10);
  const centralSize = buffer.readUInt32LE(endRecord + 12);
  const centralOffset = buffer.readUInt32LE(endRecord + 16);
  if (centralOffset + centralSize > endRecord || entries > 20000) return false;
  const names = new Set();
  let offset = centralOffset;
  for (let index = 0; index < entries && offset + 46 <= buffer.length; index += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) return false;
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    if (offset + 46 + nameLength + extraLength + commentLength > buffer.length) return false;
    names.add(buffer.subarray(offset + 46, offset + 46 + nameLength).toString('utf8'));
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return names.has('[Content_Types].xml') && names.has('word/document.xml');
}

function validateFileContent(mimeType, extension, buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) return false;
  const checks = {
    'application/pdf': extension === '.pdf' && buffer.subarray(0, 5).toString() === '%PDF-',
    'image/png': extension === '.png' && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
    'image/jpeg': ['.jpg', '.jpeg'].includes(extension) && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
    'image/gif': extension === '.gif' && buffer.subarray(0, 3).toString() === 'GIF',
    'image/webp': extension === '.webp' && buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP',
    'text/plain': extension === '.txt' && !buffer.subarray(0, Math.min(buffer.length, 8192)).includes(0),
    'application/msword': extension === '.doc' && buffer.subarray(0, 4).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0])) && buffer.includes(Buffer.from('WordDocument', 'utf16le')),
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': extension === '.docx' && isDocx(buffer)
  };
  return Boolean(checks[mimeType]);
}

module.exports = { isDocx, validateFileContent };
