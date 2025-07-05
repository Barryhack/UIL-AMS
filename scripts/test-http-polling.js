import https from 'https';

const API_BASE = 'https://uil-ams.onrender.com';
const DEVICE_ID = 'UNILORIN_AMS_1';

// Test 1: Send a fingerprint scan command
async function testSendCommand() {
  console.log('🧪 Testing command sending...');
  
  const command = {
    deviceId: DEVICE_ID,
    type: 'fingerprint_scan'
  };

  const postData = JSON.stringify(command);
  
  const options = {
    hostname: 'uil-ams.onrender.com',
    port: 443,
    path: '/api/admin/device-command',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`✅ Command sent successfully! Status: ${res.statusCode}`);
        console.log('Response:', JSON.parse(data));
        resolve(data);
      });
    });

    req.on('error', (err) => {
      console.error('❌ Error sending command:', err);
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

// Test 2: Poll for commands (simulate ESP32)
async function testPollCommands() {
  console.log('\n🧪 Testing command polling...');
  
  const options = {
    hostname: 'uil-ams.onrender.com',
    port: 443,
    path: `/api/device/commands?deviceId=${DEVICE_ID}`,
    method: 'GET'
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`✅ Commands polled successfully! Status: ${res.statusCode}`);
        console.log('Response:', JSON.parse(data));
        resolve(data);
      });
    });

    req.on('error', (err) => {
      console.error('❌ Error polling commands:', err);
      reject(err);
    });

    req.end();
  });
}

// Test 3: Send attendance record (simulate ESP32)
async function testSendAttendanceRecord() {
  console.log('\n🧪 Testing attendance record sending...');
  
  const record = {
    deviceId: DEVICE_ID,
    type: 'fingerprint',
    identifier: 'test_user_123',
    success: true,
    timestamp: Date.now()
  };

  const postData = JSON.stringify(record);
  
  const options = {
    hostname: 'uil-ams.onrender.com',
    port: 443,
    path: '/api/device/attendance',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`✅ Attendance record sent successfully! Status: ${res.statusCode}`);
        console.log('Response:', JSON.parse(data));
        resolve(data);
      });
    });

    req.on('error', (err) => {
      console.error('❌ Error sending attendance record:', err);
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting HTTP Polling Tests...\n');
  
  try {
    await testSendCommand();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    
    await testPollCommands();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    
    await testSendAttendanceRecord();
    
    console.log('\n🎉 All tests completed successfully!');
  } catch (error) {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
runTests(); 