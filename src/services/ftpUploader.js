const ftp = require("basic-ftp");
const path = require("path");
const crypto = require("crypto");

function generateFileName(originalName) {
  const timestamp = Date.now();
  const random = crypto.randomBytes(3).toString("hex");
  const ext = path.extname(originalName);
  const base = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
  return `${timestamp}_${random}_${base}${ext}`;
}

async function uploadFile(fileBuffer, originalName, domainConfig) {
  const client = new ftp.Client();
  client.ftp.verbose = false;

  const fileName = generateFileName(originalName);

  try {
    await client.access({
      host: domainConfig.ftpHost,
      user: domainConfig.ftpUser,
      password: domainConfig.ftpPassword,
      secure: false,
    });

    await client.ensureDir(domainConfig.uploadPath);

    const { Readable } = require("stream");
    const stream = Readable.from(fileBuffer);
    await client.uploadFrom(stream, fileName);

    const publicUrl = `${domainConfig.publicBaseUrl}/${fileName}`;
    return { fileName, publicUrl };
  } finally {
    client.close();
  }
}

module.exports = { uploadFile, generateFileName };
