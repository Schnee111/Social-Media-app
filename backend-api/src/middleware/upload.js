const multer = require('multer');
const path = require('path');
// Hapus require('fs') karena tidak lagi menyimpan ke disk lokal

// Import Azure SDK dan dotenv untuk mendapatkan variabel lingkungan
const { BlobServiceClient } = require('@azure/storage-blob');
// dotenv.config() diperlukan di sini karena middleware dipanggil sebelum server.js
// Namun, karena sudah dipanggil di server.js, kita asumsikan variabel sudah tersedia.
// Jika terjadi error, uncomment baris di bawah ini.
// const dotenv = require('dotenv');
// dotenv.config(); 

// FUNGSI UTAMA: Mengembalikan middleware upload ke Azure Blob
const azureUpload = (fieldName) => (req, res, next) => {
    // 1. Konfigurasi Multer menggunakan Memory Storage (menyimpan file di RAM)
    const multerUpload = multer({
        storage: multer.memoryStorage(),
        limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
        // 2. File filter (tetap sama)
        fileFilter: (req, file, cb) => {
            const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi/;
            const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
            const mimetype = allowedTypes.test(file.mimetype);
            if (mimetype && extname) {
                return cb(null, true);
            } else {
                cb(new Error('Only images and videos are allowed!'));
            }
        }
    }).single(fieldName); // Gunakan fieldName yang diberikan ('image' atau 'media')

    // 3. Jalankan Multer untuk mendapatkan file buffer
    multerUpload(req, res, (err) => {
        if (err) {
            return res.status(400).json({ success: false, error: err.message || 'File upload failed' });
        }

        // Jika tidak ada file yang diunggah, lanjut
        if (!req.file) {
            return next();
        }

        // 4. Lakukan Upload ke Azure Blob Storage
        const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
        const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;

        if (!connectionString || !containerName) {
            return res.status(500).json({ 
                success: false, 
                error: 'Azure Storage configuration not found.' 
            });
        }
        
        try {
            const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
            const containerClient = blobServiceClient.getContainerClient(containerName);
            
            // Buat nama blob unik
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const fileExtension = path.extname(req.file.originalname);
            const blobName = uniqueSuffix + fileExtension;
            
            const blockBlobClient = containerClient.getBlockBlobClient(blobName);

            const uploadOptions = {
                blobHTTPHeaders: { blobContentType: req.file.mimetype }
            };

            // Upload buffer file ke Azure (asynchronous)
            blockBlobClient.uploadData(req.file.buffer, uploadOptions)
                .then(() => {
                    // Berhasil: set req.file.filename menjadi URL penuh Blob Azure
                    req.file.filename = blockBlobClient.url;
                    // Lanjut ke controller
                    next();
                })
                .catch(error => {
                    console.error('Azure upload error:', error);
                    res.status(500).json({ success: false, error: 'Failed to upload file to Azure Blob Storage.' });
                });
        } catch (error) {
            console.error('Azure setup error:', error);
            res.status(500).json({ success: false, error: 'Internal server error during Azure setup.' });
        }
    });
};

module.exports = azureUpload;