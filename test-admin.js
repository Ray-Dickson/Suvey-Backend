// Simple test script to verify admin endpoints
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testAdminEndpoints() {
  try {
    console.log('Testing admin endpoints...\n');

    // Test login as admin (using default admin credentials from schema.sql)
    console.log('1. Testing admin login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@surveyapp.com',
      password: 'admin123'
    });
    
    const { token } = loginResponse.data;
    console.log('✅ Admin login successful');

    // Test admin stats endpoint
    console.log('\n2. Testing admin stats endpoint...');
    const statsResponse = await axios.get(`${BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Admin stats:', statsResponse.data);

    // Test admin surveys endpoint
    console.log('\n3. Testing admin surveys endpoint...');
    const surveysResponse = await axios.get(`${BASE_URL}/admin/surveys`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Admin surveys:', surveysResponse.data.length, 'surveys found');

    // Test admin users endpoint
    console.log('\n4. Testing admin users endpoint...');
    const usersResponse = await axios.get(`${BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Admin users:', usersResponse.data.length, 'users found');

    console.log('\n🎉 All admin endpoints working correctly!');

  } catch (error) {
    console.error('❌ Error testing admin endpoints:', error.response?.data || error.message);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  testAdminEndpoints();
}

module.exports = testAdminEndpoints;
