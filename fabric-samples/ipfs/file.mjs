import { create } from 'ipfs-http-client';
import fs from 'fs';

const ipfs = create({
  url: 'http://172.18.0.17:5002/api/v0'
});

async function getFile(hash) {
  const chunks = [];
  for await (const chunk of ipfs.cat(hash)) {
    chunks.push(chunk);
  }
  const content = Buffer.concat(chunks);
  fs.writeFileSync('downloadedFile', content);
  console.log('File downloaded successfully.');
}

export { ipfs, getFile };