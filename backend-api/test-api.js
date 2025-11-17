const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Color codes untuk console
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
};

// Test data storage
const testData = {
    user1: { token: '', id: '', username: '', email: '' },
    user2: { token: '', id: '', username: '', email: '' },
    post1: { id: '', content: '' },
    post2: { id: '', content: '' },
    comment1: { id: '', content: '' },
};

let testsPassed = 0;
let testsFailed = 0;

// Helper functions
function log(emoji, message, color = colors.reset) {
    console.log(`${color}${emoji} ${message}${colors.reset}`);
}

function success(message) {
    testsPassed++;
    log('✅', message, colors.green);
}

function error(message, err) {
    testsFailed++;
    log('❌', message, colors.red);
    if (err?.response?.data) {
        console.log(colors.dim + '   Error:', err.response.data, colors.reset);
    } else if (err?.message) {
        console.log(colors.dim + '   Error:', err.message, colors.reset);
    }
}

function section(title) {
    console.log('\n' + colors.cyan + '═'.repeat(60) + colors.reset);
    console.log(colors.bright + colors.cyan + `  ${title}` + colors.reset);
    console.log(colors.cyan + '═'.repeat(60) + colors.reset + '\n');
}

function subsection(title) {
    console.log(colors.yellow + '\n▶ ' + title + colors.reset);
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Test functions
async function testRegister() {
    subsection('Test 1: Register User 1');
    try {
        const timestamp = Date.now();
        const username = `user1_${timestamp}`;
        const email = `user1_${timestamp}@test.com`;
        
        const response = await axios.post(`${BASE_URL}/auth/register`, {
            username,
            email,
            password: 'password123',
            bio: 'Test user 1 bio',
            avatar: 'https://i.pravatar.cc/150?img=1'
        });

        if (response.data.success && response.data.token) {
            testData.user1.token = response.data.token;
            testData.user1.id = response.data.data._id;
            testData.user1.username = response.data.data.username;
            testData.user1.email = response.data.data.email;
            success(`User 1 registered: ${username}`);
        } else {
            throw new Error('Invalid response format');
        }
    } catch (err) {
        error('Register User 1 failed', err);
    }
    await sleep(300);
}

async function testRegisterUser2() {
    subsection('Test 2: Register User 2');
    try {
        const timestamp = Date.now();
        const username = `user2_${timestamp}`;
        const email = `user2_${timestamp}@test.com`;
        
        const response = await axios.post(`${BASE_URL}/auth/register`, {
            username,
            email,
            password: 'password123',
            bio: 'Test user 2 bio',
            avatar: 'https://i.pravatar.cc/150?img=2'
        });

        if (response.data.success && response.data.token) {
            testData.user2.token = response.data.token;
            testData.user2.id = response.data.data._id;
            testData.user2.username = response.data.data.username;
            testData.user2.email = response.data.data.email;
            success(`User 2 registered: ${username}`);
        } else {
            throw new Error('Invalid response format');
        }
    } catch (err) {
        error('Register User 2 failed', err);
    }
    await sleep(300);
}

async function testLogin() {
    subsection('Test 3: Login User 1');
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            email: testData.user1.email,
            password: 'password123'
        });

        if (response.data.success && response.data.token) {
            success('User 1 login successful');
        } else {
            throw new Error('Invalid response format');
        }
    } catch (err) {
        error('Login failed', err);
    }
    await sleep(300);
}

async function testGetCurrentUser() {
    subsection('Test 4: Get Current User');
    try {
        const response = await axios.get(`${BASE_URL}/users/me`, {
            headers: { Authorization: `Bearer ${testData.user1.token}` }
        });

        if (response.data.success && response.data.data.username === testData.user1.username) {
            success(`Current user retrieved: ${response.data.data.username}`);
        } else {
            throw new Error('Invalid response format');
        }
    } catch (err) {
        error('Get current user failed', err);
    }
    await sleep(300);
}

async function testUpdateProfile() {
    subsection('Test 5: Update Profile');
    try {
        const response = await axios.put(`${BASE_URL}/users/profile`, {
            bio: 'Updated bio from automated test 📝'
        }, {
            headers: { Authorization: `Bearer ${testData.user1.token}` }
        });

        if (response.data.success && response.data.data.bio.includes('Updated bio')) {
            success('Profile updated successfully');
        } else {
            throw new Error('Invalid response format');
        }
    } catch (err) {
        error('Update profile failed', err);
    }
    await sleep(300);
}

async function testCreatePost() {
    subsection('Test 6: Create Post (User 1)');
    try {
        const content = 'Hello World! This is a test post from User 1 🚀';
        const response = await axios.post(`${BASE_URL}/posts`, {
            content
        }, {
            headers: { Authorization: `Bearer ${testData.user1.token}` }
        });

        if (response.data.success && response.data.data._id) {
            testData.post1.id = response.data.data._id;
            testData.post1.content = response.data.data.content;
            success(`Post created: ${testData.post1.id}`);
        } else {
            throw new Error('Invalid response format');
        }
    } catch (err) {
        error('Create post failed', err);
    }
    await sleep(300);
}

async function testCreatePost2() {
    subsection('Test 7: Create Post (User 2)');
    try {
        const content = 'Another test post from User 2! 🎉';
        const response = await axios.post(`${BASE_URL}/posts`, {
            content
        }, {
            headers: { Authorization: `Bearer ${testData.user2.token}` }
        });

        if (response.data.success && response.data.data._id) {
            testData.post2.id = response.data.data._id;
            testData.post2.content = response.data.data.content;
            success(`Post 2 created: ${testData.post2.id}`);
        } else {
            throw new Error('Invalid response format');
        }
    } catch (err) {
        error('Create post 2 failed', err);
    }
    await sleep(300);
}

async function testGetAllPosts() {
    subsection('Test 8: Get All Posts (Explore)');
    try {
        const response = await axios.get(`${BASE_URL}/posts`, {
            headers: { Authorization: `Bearer ${testData.user1.token}` }
        });

        if (response.data.success && Array.isArray(response.data.data)) {
            success(`All posts retrieved: ${response.data.data.length} posts`);
        } else {
            throw new Error('Invalid response format');
        }
    } catch (err) {
        error('Get all posts failed', err);
    }
    await sleep(300);
}

async function testGetFeed() {
    subsection('Test 9: Get Feed');
    try {
        const response = await axios.get(`${BASE_URL}/posts/feed`, {
            headers: { Authorization: `Bearer ${testData.user1.token}` }
        });

        if (response.data.success && Array.isArray(response.data.data)) {
            success(`Feed retrieved: ${response.data.data.length} posts`);
        } else {
            throw new Error('Invalid response format');
        }
    } catch (err) {
        error('Get feed failed', err);
    }
    await sleep(300);
}

async function testGetPostById() {
    subsection('Test 10: Get Post by ID');
    try {
        const response = await axios.get(`${BASE_URL}/posts/${testData.post1.id}`, {
            headers: { Authorization: `Bearer ${testData.user1.token}` }
        });

        if (response.data.success && response.data.data._id === testData.post1.id) {
            success('Post retrieved by ID');
        } else {
            throw new Error('Invalid response format');
        }
    } catch (err) {
        error('Get post by ID failed', err);
    }
    await sleep(300);
}

async function testLikePost() {
    subsection('Test 11: Like Post (User 2 likes User 1\'s post)');
    try {
        const response = await axios.post(`${BASE_URL}/posts/${testData.post1.id}/like`, {}, {
            headers: { Authorization: `Bearer ${testData.user2.token}` }
        });

        if (response.data.success && response.data.data.isLiked) {
            success(`Post liked: ${response.data.data.likesCount} likes`);
        } else {
            throw new Error('Invalid response format');
        }
    } catch (err) {
        error('Like post failed', err);
    }
    await sleep(300);
}

async function testUnlikePost() {
    subsection('Test 12: Unlike Post');
    try {
        const response = await axios.post(`${BASE_URL}/posts/${testData.post1.id}/like`, {}, {
            headers: { Authorization: `Bearer ${testData.user2.token}` }
        });

        if (response.data.success && !response.data.data.isLiked) {
            success(`Post unliked: ${response.data.data.likesCount} likes`);
        } else {
            throw new Error('Invalid response format');
        }
    } catch (err) {
        error('Unlike post failed', err);
    }
    await sleep(300);
}

async function testSavePost() {
    subsection('Test 13: Save Post');
    try {
        const response = await axios.post(`${BASE_URL}/posts/${testData.post1.id}/save`, {}, {
            headers: { Authorization: `Bearer ${testData.user2.token}` }
        });

        if (response.data.success && response.data.data.isSaved) {
            success('Post saved successfully');
        } else {
            throw new Error('Invalid response format');
        }
    } catch (err) {
        error('Save post failed', err);
    }
    await sleep(300);
}

async function testGetSavedPosts() {
    subsection('Test 14: Get Saved Posts');
    try {
        const response = await axios.get(`${BASE_URL}/users/saved`, {
            headers: { Authorization: `Bearer ${testData.user2.token}` }
        });

        if (response.data.success && Array.isArray(response.data.data)) {
            success(`Saved posts retrieved: ${response.data.data.length} posts`);
        } else {
            throw new Error('Invalid response format');
        }
    } catch (err) {
        error('Get saved posts failed', err);
    }
    await sleep(300);
}

async function testCreateComment() {
    subsection('Test 15: Create Comment (User 2 comments on User 1\'s post)');
    try {
        const content = 'Great post! This is a test comment 👍';
        const response = await axios.post(`${BASE_URL}/comments/post/${testData.post1.id}`, {
            content
        }, {
            headers: { Authorization: `Bearer ${testData.user2.token}` }
        });

        if (response.data.success && response.data.data._id) {
            testData.comment1.id = response.data.data._id;
            testData.comment1.content = response.data.data.content;
            success('Comment created');
        } else {
            throw new Error('Invalid response format');
        }
    } catch (err) {
        error('Create comment failed', err);
    }
    await sleep(300);
}

async function testGetComments() {
    subsection('Test 16: Get Comments');
    try {
        const response = await axios.get(`${BASE_URL}/comments/post/${testData.post1.id}`, {
            headers: { Authorization: `Bearer ${testData.user1.token}` }
        });

        if (response.data.success && Array.isArray(response.data.data)) {
            success(`Comments retrieved: ${response.data.data.length} comments`);
        } else {
            throw new Error('Invalid response format');
        }
    } catch (err) {
        error('Get comments failed', err);
    }
    await sleep(300);
}

async function testUpdateComment() {
    subsection('Test 17: Update Comment');
    try {
        const response = await axios.put(`${BASE_URL}/comments/${testData.comment1.id}`, {
            content: 'Updated comment text! 🎉'
        }, {
            headers: { Authorization: `Bearer ${testData.user2.token}` }
        });

        if (response.data.success && response.data.data.content.includes('Updated')) {
            success('Comment updated');
        } else {
            throw new Error('Invalid response format');
        }
    } catch (err) {
        error('Update comment failed', err);
    }
    await sleep(300);
}

async function testFollowUser() {
    subsection('Test 18: Follow User (User 2 follows User 1)');
    try {
        const response = await axios.post(`${BASE_URL}/users/${testData.user1.id}/follow`, {}, {
            headers: { Authorization: `Bearer ${testData.user2.token}` }
        });

        // FIX: Check response structure
        if (response.data.success && response.data.isFollowing === true) {
            success('User followed successfully');
        } else {
            throw new Error('Invalid response format');
        }
    } catch (err) {
        error('Follow user failed', err);
    }
    await sleep(300);
}

async function testUnfollowUser() {
    subsection('Test 19: Unfollow User');
    try {
        const response = await axios.post(`${BASE_URL}/users/${testData.user1.id}/follow`, {}, {
            headers: { Authorization: `Bearer ${testData.user2.token}` }
        });

        // FIX: Check response structure
        if (response.data.success && response.data.isFollowing === false) {
            success('User unfollowed successfully');
        } else {
            throw new Error('Invalid response format');
        }
    } catch (err) {
        error('Unfollow user failed', err);
    }
    await sleep(300);
}

async function testGetUserProfile() {
    subsection('Test 20: Get User Profile');
    try {
        const response = await axios.get(`${BASE_URL}/users/${testData.user1.id}`, {
            headers: { Authorization: `Bearer ${testData.user2.token}` }
        });

        // FIX: Check correct path
        if (response.data.success && response.data.data.user._id === testData.user1.id) {
            success(`User profile retrieved: ${response.data.data.user.username}`);
        } else {
            throw new Error('Invalid response format');
        }
    } catch (err) {
        error('Get user profile failed', err);
    }
    await sleep(300);
}

async function testSearchUsers() {
    subsection('Test 21: Search Users');
    try {
        const response = await axios.get(`${BASE_URL}/users/search?q=user`, {
            headers: { Authorization: `Bearer ${testData.user1.token}` }
        });

        if (response.data.success && Array.isArray(response.data.data)) {
            success(`Search results: ${response.data.data.length} users found`);
        } else {
            throw new Error('Invalid response format');
        }
    } catch (err) {
        error('Search users failed', err);
    }
    await sleep(300);
}

async function testUpdatePost() {
    subsection('Test 22: Update Post');
    try {
        const response = await axios.put(`${BASE_URL}/posts/${testData.post1.id}`, {
            content: 'Updated post content! 🎨'
        }, {
            headers: { Authorization: `Bearer ${testData.user1.token}` }
        });

        if (response.data.success && response.data.data.content.includes('Updated')) {
            success('Post updated successfully');
        } else {
            throw new Error('Invalid response format');
        }
    } catch (err) {
        error('Update post failed', err);
    }
    await sleep(300);
}

async function testDeleteComment() {
    subsection('Test 23: Delete Comment');
    try {
        const response = await axios.delete(`${BASE_URL}/comments/${testData.comment1.id}`, {
            headers: { Authorization: `Bearer ${testData.user2.token}` }
        });

        if (response.data.success) {
            success('Comment deleted successfully');
        } else {
            throw new Error('Invalid response format');
        }
    } catch (err) {
        error('Delete comment failed', err);
    }
    await sleep(300);
}

async function testDeletePost() {
    subsection('Test 24: Delete Post');
    try {
        const response = await axios.delete(`${BASE_URL}/posts/${testData.post2.id}`, {
            headers: { Authorization: `Bearer ${testData.user2.token}` }
        });

        if (response.data.success) {
            success('Post deleted successfully');
        } else {
            throw new Error('Invalid response format');
        }
    } catch (err) {
        error('Delete post failed', err);
    }
    await sleep(300);
}

// Main test runner
async function runTests() {
    console.clear();
    console.log(colors.bright + colors.blue);
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                                                            ║');
    console.log('║           🧪  SOCIAL MEDIA API TEST SUITE  🧪             ║');
    console.log('║                                                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(colors.reset);

    const startTime = Date.now();

    // Authentication Tests
    section('📝 AUTHENTICATION TESTS');
    await testRegister();
    await testRegisterUser2();
    await testLogin();

    // User Tests
    section('👤 USER TESTS');
    await testGetCurrentUser();
    await testUpdateProfile();
    await testGetUserProfile();
    await testSearchUsers();

    // Post Tests
    section('📮 POST TESTS');
    await testCreatePost();
    await testCreatePost2();
    await testGetAllPosts();
    await testGetFeed();
    await testGetPostById();
    await testUpdatePost();

    // Interaction Tests
    section('❤️ INTERACTION TESTS');
    await testLikePost();
    await testUnlikePost();
    await testSavePost();
    await testGetSavedPosts();

    // Comment Tests
    section('💬 COMMENT TESTS');
    await testCreateComment();
    await testGetComments();
    await testUpdateComment();
    await testDeleteComment();

    // Follow Tests
    section('👥 FOLLOW TESTS');
    await testFollowUser();
    await testUnfollowUser();

    // Cleanup Tests
    section('🗑️ CLEANUP TESTS');
    await testDeletePost();

    // Results
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n' + colors.bright + colors.blue + '═'.repeat(60) + colors.reset);
    console.log(colors.bright + colors.blue + '  TEST RESULTS' + colors.reset);
    console.log(colors.blue + '═'.repeat(60) + colors.reset + '\n');

    const total = testsPassed + testsFailed;
    const passRate = total > 0 ? ((testsPassed / total) * 100).toFixed(1) : 0;

    console.log(colors.green + `  ✅ Tests Passed: ${testsPassed}` + colors.reset);
    console.log(colors.red + `  ❌ Tests Failed: ${testsFailed}` + colors.reset);
    console.log(colors.cyan + `  📊 Total Tests: ${total}` + colors.reset);
    console.log(colors.yellow + `  ⏱️  Duration: ${duration}s` + colors.reset);
    console.log(colors.magenta + `  📈 Pass Rate: ${passRate}%` + colors.reset);

    if (testsFailed === 0) {
        console.log('\n' + colors.bright + colors.green + '  🎉 ALL TESTS PASSED! 🎉' + colors.reset + '\n');
    } else {
        console.log('\n' + colors.bright + colors.red + '  ⚠️  SOME TESTS FAILED ⚠️' + colors.reset + '\n');
    }

    console.log(colors.blue + '═'.repeat(60) + colors.reset + '\n');
}

// Run the tests
runTests().catch(err => {
    console.error(colors.red + '\n❌ Test suite crashed:', err.message + colors.reset);
    process.exit(1);
});