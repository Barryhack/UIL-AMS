// Test ESP32 connection when server is available
const https = require('https');

const SERVER_URL = 'https://uil-ams.onrender.com';
const DEVICE_ID = 'UNILORIN_AMS_1';

console.log('🧪 ESP32 Connection Test\n');

// Test 1: Check if server is reachable
function testServerReachability() {
  console.log('1️⃣ Testing server reachability...');
  
  return new Promise((resolve) => {
    const req = https.get(SERVER_URL, (res) => {
      console.log(`✅ Server is reachable! Status: ${res.statusCode}`);
      resolve(true);
    });
    
    req.on('error', (err) => {
      console.log(`❌ Server not reachable: ${err.message}`);
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.log('❌ Server timeout');
      req.destroy();
      resolve(false);
    });
  });
}

// Test 2: Test ESP32 command polling endpoint
function testCommandPolling() {
  console.log('\n2️⃣ Testing command polling endpoint...');
  
  return new Promise((resolve) => {
    const options = {
      hostname: 'uil-ams.onrender.com',
      port: 443,
      path: `/api/device/commands?deviceId=${DEVICE_ID}`,
      method: 'GET',
      timeout: 5000
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`✅ Command polling works! Status: ${res.statusCode}`);
        try {
          const response = JSON.parse(data);
          console.log('Response:', JSON.stringify(response, null, 2));
        } catch (e) {
          console.log('Raw response:', data);
        }
        resolve(true);
      });
    });
    
    req.on('error', (err) => {
      console.log(`❌ Command polling failed: ${err.message}`);
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.log('❌ Command polling timeout');
      req.destroy();
      resolve(false);
    });
    
    req.end();
  });
}

// Test 3: Test attendance record endpoint
function testAttendanceRecord() {
  console.log('\n3️⃣ Testing attendance record endpoint...');
  
  const record = {
    deviceId: DEVICE_ID,
    type: 'fingerprint',
    identifier: 'test_user_123',
    success: true,
    timestamp: Date.now()
  };
  
  const postData = JSON.stringify(record);
  
  return new Promise((resolve) => {
    const options = {
      hostname: 'uil-ams.onrender.com',
      port: 443,
      path: '/api/device/attendance',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 5000
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`✅ Attendance record endpoint works! Status: ${res.statusCode}`);
        try {
          const response = JSON.parse(data);
          console.log('Response:', JSON.stringify(response, null, 2));
        } catch (e) {
          console.log('Raw response:', data);
        }
        resolve(true);
      });
    });
    
    req.on('error', (err) => {
      console.log(`❌ Attendance record failed: ${err.message}`);
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.log('❌ Attendance record timeout');
      req.destroy();
      resolve(false);
    });
    
    req.write(postData);
    req.end();
  });
}

// Run all tests
async function runConnectionTests() {
  console.log('🚀 Starting ESP32 Connection Tests...\n');
  
  const serverReachable = await testServerReachability();
  
  if (serverReachable) {
    await testCommandPolling();
    await testAttendanceRecord();
    
    console.log('\n🎉 All tests completed!');
    console.log('\n📱 ESP32 should be able to connect successfully.');
    console.log('💡 Upload the updated sketch and test!');
  } else {
    console.log('\n⚠️ Server is not reachable.');
    console.log('💡 Wait for server to be available and try again.');
  }
}

// Run tests
runConnectionTests(); 