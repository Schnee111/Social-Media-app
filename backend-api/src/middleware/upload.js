const multer = require('multer');
const path = require('path');
const { BlobServiceClient } = require('@azure/storage-blob');

// FUNGSI UTAMA: Mengembalikan middleware upload ke Azure Blob
// Mendukung single file dan multiple files
const azureUpload = (fieldName, maxCount = 1) => (req, res, next) => {
    // 1. Konfigurasi Multer menggunakan Memory Storage (menyimpan file di RAM)
    const multerStorage = multer.memoryStorage();
    
    const multerConfig = {
        storage: multerStorage,
        limits: { 
            fileSize: 100 * 1024 * 1024, // 100MB limit (increased for video)
            files: maxCount // Limit jumlah files
        },
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
    };

    // Gunakan .single() untuk single file atau .array() untuk multiple files
    const multerUpload = maxCount === 1 
        ? multer(multerConfig).single(fieldName)
        : multer(multerConfig).array(fieldName, maxCount);

    // 3. Jalankan Multer untuk mendapatkan file buffer
    multerUpload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ 
                success: false, 
                error: err.message || 'File upload failed' 
            });
        }

        // Jika tidak ada file yang diunggah, lanjut
        if (!req.file && (!req.files || req.files.length === 0)) {
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
            
            // Handle single file
            if (req.file) {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const fileExtension = path.extname(req.file.originalname);
                const blobName = uniqueSuffix + fileExtension;
                
                const blockBlobClient = containerClient.getBlockBlobClient(blobName);

                const uploadOptions = {
                    blobHTTPHeaders: { blobContentType: req.file.mimetype }
                };

                try {
                    await blockBlobClient.uploadData(req.file.buffer, uploadOptions);
                    // Set filename ke URL penuh
                    req.file.filename = blockBlobClient.url;
                    next();
                } catch (uploadError) {
                    console.error('Azure upload error:', uploadError);
                    return res.status(500).json({ 
                        success: false, 
                        error: 'Failed to upload file to Azure Blob Storage.' 
                    });
                }
            }
            // Handle multiple files
            else if (req.files && req.files.length > 0) {
                const uploadPromises = req.files.map(async (file) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                    const fileExtension = path.extname(file.originalname);
                    const blobName = uniqueSuffix + fileExtension;
                    
                    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

                    const uploadOptions = {
                        blobHTTPHeaders: { blobContentType: file.mimetype }
                    };

                    await blockBlobClient.uploadData(file.buffer, uploadOptions);
                    
                    // Return URL untuk setiap file
                    return blockBlobClient.url;
                });

                try {
                    // Upload semua files secara parallel
                    const uploadedUrls = await Promise.all(uploadPromises);
                    
                    // Simpan array URLs di req.uploadedFiles (untuk multiple)
                    req.uploadedFiles = uploadedUrls;
                    
                    // Untuk backward compatibility, set req.file dengan first file
                    if (uploadedUrls.length > 0) {
                        req.file = {
                            filename: uploadedUrls[0]
                        };
                    }
                    
                    next();
                } catch (uploadError) {
                    console.error('Azure multiple upload error:', uploadError);
                    return res.status(500).json({ 
                        success: false, 
                        error: 'Failed to upload files to Azure Blob Storage.' 
                    });
                }
            }
        } catch (error) {
            console.error('Azure setup error:', error);
            return res.status(500).json({ 
                success: false, 
                error: 'Internal server error during Azure setup.' 
            });
        }
    });
};

module.exports = azureUpload;