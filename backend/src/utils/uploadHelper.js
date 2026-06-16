'use strict';

const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { s3Client } = require('../config/s3');
const crypto = require('crypto');
const path = require('path');

// Target Bucket dari env
const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'simaris-uploads';
const REGION = process.env.AWS_REGION || 'ap-southeast-1';

// Format Mimetype yang diizinkan
const ALLOWED_MIMETYPES = ['image/jpeg', 'image/png', 'image/webp'];
// Ukuran maksimal 5MB (dalam bytes)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Mengunggah file buffer dari memori ke AWS S3.
 * 
 * @param {Object} file - File object yang dikirim dari Multer (memoryStorage)
 * @param {string} folder - Nama folder tujuan di S3 (misal: 'foto-barang')
 * @returns {Promise<string>} URL public file S3
 */
async function uploadFileToS3(file, folder) {
  try {
    if (!file) {
      throw new Error('Tidak ada file yang diunggah.');
    }

    // 1. Validasi tipe file
    if (!ALLOWED_MIMETYPES.includes(file.mimetype)) {
      throw new Error('Format file tidak didukung. Hanya menerima JPG, PNG, atau WEBP.');
    }

    // 2. Validasi ukuran file
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('Ukuran file terlalu besar. Maksimal ukuran file adalah 5MB.');
    }

    // 3. Pembuatan nama file unik: [folder]/[uuid]-[timestamp].[ext]
    const uuid = crypto.randomUUID();
    const timestamp = Date.now();
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    
    // Pastikan ekstensi aman dan valid
    const cleanExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.jpg';
    const key = `${folder}/${uuid}-${timestamp}${cleanExt}`;

    // 4. Upload ke S3 menggunakan PutObjectCommand
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    // 5. Kembalikan URL publik
    // Format: https://[bucket].s3.[region].amazonaws.com/[key]
    const fileUrl = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${key}`;
    return fileUrl;

  } catch (error) {
    console.error('[uploadHelper.uploadFileToS3] Error:', error);
    throw new Error(error.message || 'Gagal mengunggah file ke AWS S3.');
  }
}

/**
 * Menghapus objek berkas dari AWS S3 berdasarkan URL-nya.
 * 
 * @param {string} fileUrl - URL publik file yang disimpan di database
 * @returns {Promise<void>}
 */
async function deleteFileFromS3(fileUrl) {
  try {
    if (!fileUrl) {
      console.warn('[uploadHelper.deleteFileFromS3] URL kosong, proses diabaikan.');
      return;
    }

    // Extract S3 key dari URL
    // URL format: https://[bucket].s3.[region].amazonaws.com/[key]
    const expectedDomainPart = `.s3.${REGION}.amazonaws.com/`;
    
    let key;
    if (fileUrl.includes(expectedDomainPart)) {
      const urlParts = fileUrl.split(expectedDomainPart);
      key = decodeURIComponent(urlParts[1]);
    } else {
      // Fallback menggunakan standard URL parser jika format berbeda sedikit
      const parsedUrl = new URL(fileUrl);
      key = decodeURIComponent(parsedUrl.pathname.substring(1));
    }

    if (!key) {
      console.warn(`[uploadHelper.deleteFileFromS3] Key tidak dapat diekstrak dari URL: ${fileUrl}`);
      return;
    }

    const deleteParams = {
      Bucket: BUCKET_NAME,
      Key: key,
    };

    const command = new DeleteObjectCommand(deleteParams);
    await s3Client.send(command);
    console.log(`[uploadHelper.deleteFileFromS3] Berhasil menghapus file dari S3 dengan key: ${key}`);

  } catch (error) {
    // Jangan throw error (idempotent), cukup log warning sesuai instruksi
    console.warn(`[uploadHelper.deleteFileFromS3] Warning: Gagal menghapus file dari S3. URL: ${fileUrl}. Error:`, error.message);
  }
}

module.exports = {
  uploadFileToS3,
  deleteFileFromS3,
};
