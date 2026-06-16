'use strict';

const { S3Client } = require('@aws-sdk/client-s3');

// Mengambil variabel lingkungan untuk AWS S3
const region = process.env.AWS_REGION || 'ap-southeast-1';
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

// Validasi konfigurasi minimal
if (!accessKeyId || !secretAccessKey) {
  console.warn('[AWS S3 Warning] AWS_ACCESS_KEY_ID atau AWS_SECRET_ACCESS_KEY belum dikonfigurasi. Upload file mungkin gagal.');
}

// Inisialisasi S3Client
const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

module.exports = { s3Client };
