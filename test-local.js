const http = require('http');

const DEVICE_ID = 'UNILORIN_AMS_1';

console.log('Local Device API Test\n');

function testLocalCommandPolling() {
  console.log('Testing local command polling endpoint...');
  
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/device/commands?deviceId=${DEVICE_ID}`,
      method: 'GET',
      timeout: 5000
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`Local command polling status: ${res.statusCode}`);
        console.log('Response:', data);
        resolve(res.statusCode === 200);
      });
    });
    
    req.on('error', (err) => {
      console.log(`Local command polling failed: ${err.message}`);
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.log('Local command polling timeout');
      req.destroy();
      resolve(false);
    });
    
    req.end();
  });
}

function testLocalAttendanceRecord() {
  console.log('\nTesting local attendance record endpoint...');
  
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
      hostname: 'localhost',
      port: 3000,
      path: '/api/device/attendance',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 5000
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`Local attendance record status: ${res.statusCode}`);
        console.log('Response:', data);
        resolve(res.statusCode === 200);
      });
    });
    
    req.on('error', (err) => {
      console.log(`Local attendance record failed: ${err.message}`);
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.log('Local attendance record timeout');
      req.destroy();
      resolve(false);
    });
    
    req.write(postData);
    req.end();
  });
}

async function runLocalTests() {
  console.log('Starting Local Device API Tests...\n');
  
  const commandSuccess = await testLocalCommandPolling();
  const attendanceSuccess = await testLocalAttendanceRecord();
  
  if (commandSuccess && attendanceSuccess) {
    console.log('\nLocal tests passed! Middleware changes are working.');
    console.log('Deploy to production to fix the ESP32 connection.');
  } else {
    console.log('\nLocal tests failed. Check middleware configuration.');
  }
}

runLocalTests(); 