const logger = (req, res, next) => {
    const start = Date.now();
    
    // Log request
    console.log('\n' + '='.repeat(80));
    console.log(`📨 [${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    console.log(`🔹 IP: ${req.ip}`);
    
    if (req.headers.authorization) {
        console.log(`🔑 Auth: ${req.headers.authorization.substring(0, 20)}...`);
    }
    
    // Check if req.body exists and is not empty
    if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
        console.log(`📦 Body:`, JSON.stringify(req.body, null, 2));
    }
    
    // Check if req.params exists and is not empty
    if (req.params && typeof req.params === 'object' && Object.keys(req.params).length > 0) {
        console.log(`🎯 Params:`, req.params);
    }
    
    // Check if req.query exists and is not empty
    if (req.query && typeof req.query === 'object' && Object.keys(req.query).length > 0) {
        console.log(`🔍 Query:`, req.query);
    }

    // Check if req.file exists (for file uploads)
    if (req.file) {
        console.log(`📎 File:`, {
            fieldname: req.file.fieldname,
            filename: req.file.filename,
            size: req.file.size
        });
    }

    // Log response
    const originalSend = res.send;
    res.send = function (data) {
        const duration = Date.now() - start;
        console.log(`⏱️  Duration: ${duration}ms`);
        console.log(`✅ Status: ${res.statusCode}`);
        
        // Log response body (truncate if too long)
        try {
            const responseBody = typeof data === 'string' ? JSON.parse(data) : data;
            const responseStr = JSON.stringify(responseBody);
            const truncated = responseStr.substring(0, 500);
            console.log(`📤 Response: ${truncated}${responseStr.length > 500 ? '...' : ''}`);
        } catch (e) {
            const dataStr = String(data);
            console.log(`📤 Response: ${dataStr.substring(0, 200)}${dataStr.length > 200 ? '...' : ''}`);
        }
        
        console.log('='.repeat(80) + '\n');
        
        originalSend.call(this, data);
    };

    next();
};

module.exports = logger;