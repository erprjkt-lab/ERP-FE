import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const publicDir = path.join(rootDir, 'public');

const sizes = [16, 32, 48];
const images = sizes.map(size => {
  const filePath = path.join(publicDir, `favicon-${size}x${size}.png`);
  const data = fs.readFileSync(filePath);
  return { size, data };
});

const headerSize = 6;
const entrySize = 16;
const totalHeaderSize = headerSize + entrySize * images.length;

let currentOffset = totalHeaderSize;
const entries = [];
for (const img of images) {
  entries.push({
    width: img.size === 256 ? 0 : img.size,
    height: img.size === 256 ? 0 : img.size,
    colorCount: 0,
    reserved: 0,
    planes: 1,
    bitCount: 32,
    bytesInRes: img.data.length,
    imageOffset: currentOffset,
  });
  currentOffset += img.data.length;
}

const outBuffer = Buffer.alloc(currentOffset);

// Write header
outBuffer.writeUInt16LE(0, 0); // Reserved
outBuffer.writeUInt16LE(1, 2); // ICO type
outBuffer.writeUInt16LE(images.length, 4); // Count

// Write entries
let pos = headerSize;
for (const entry of entries) {
  outBuffer.writeUInt8(entry.width, pos);
  outBuffer.writeUInt8(entry.height, pos + 1);
  outBuffer.writeUInt8(entry.colorCount, pos + 2);
  outBuffer.writeUInt8(entry.reserved, pos + 3);
  outBuffer.writeUInt16LE(entry.planes, pos + 4);
  outBuffer.writeUInt16LE(entry.bitCount, pos + 6);
  outBuffer.writeUInt32LE(entry.bytesInRes, pos + 8);
  outBuffer.writeUInt32LE(entry.imageOffset, pos + 12);
  pos += entrySize;
}

// Write image data
for (let i = 0; i < images.length; i++) {
  images[i].data.copy(outBuffer, entries[i].imageOffset);
}

const icoPath = path.join(publicDir, 'favicon.ico');
fs.writeFileSync(icoPath, outBuffer);
console.log(`Successfully created ${icoPath} (${outBuffer.length} bytes) containing [${sizes.join(', ')}px]`);
