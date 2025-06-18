// Test script for API endpoints
let cookies = '';

async function testLogin(credentials) {
  try {
    const response = await fetch('http://localhost:3000/api/auth/signin/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...credentials,
        csrfToken: await getCsrfToken(),
        callbackUrl: 'http://localhost:3000'
      }),
    });
    
    // Get cookies from response
    const responseCookies = response.headers.get('set-cookie');
    if (responseCookies) {
      cookies = responseCookies;
    }
    
    const data = await response.json();
    console.log(`\nTest login for ${credentials.email}:`);
    console.log('Status:', response.status);
    console.log('Response:', data);
    
    return { success: response.ok, data };
  } catch (error) {
    console.error('Error testing login:', error);
    return { success: false, error };
  }
}

async function getCsrfToken() {
  try {
    const response = await fetch('http://localhost:3000/api/auth/csrf');
    const data = await response.json();
    return data.csrfToken;
  } catch (error) {
    console.error('Error getting CSRF token:', error);
    return null;
  }
}

async function testUserRegistration(userData) {
  try {
    const response = await fetch('http://localhost:3000/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      credentials: 'include',
      body: JSON.stringify(userData),
    });
    
    const data = await response.json();
    console.log('\nTest user registration:');
    console.log('Status:', response.status);
    console.log('Response:', data);
    
    return { success: response.ok, data };
  } catch (error) {
    console.error('Error testing user registration:', error);
    return { success: false, error };
  }
}

async function testUserDeletion(id) {
  try {
    const response = await fetch(`http://localhost:3000/api/users/${id}`, {
      method: 'DELETE',
      headers: {
        'Cookie': cookies
      },
      credentials: 'include',
    });
    
    const data = await response.json();
    console.log('\nTest user deletion:');
    console.log('Status:', response.status);
    console.log('Response:', data);
    
    return { success: response.ok, data };
  } catch (error) {
    console.error('Error testing user deletion:', error);
    return { success: false, error };
  }
}

async function testAttendanceRecord(attendanceData) {
  try {
    const response = await fetch('http://localhost:3000/api/attendance/record', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      credentials: 'include',
      body: JSON.stringify(attendanceData),
    });
    
    const data = await response.json();
    console.log('\nTest attendance record:');
    console.log('Status:', response.status);
    console.log('Response:', data);
    
    return { success: response.ok, data };
  } catch (error) {
    console.error('Error testing attendance record:', error);
    return { success: false, error };
  }
}

// Test cases
const testCases = [
  {
    name: 'Admin Login',
    credentials: {
      email: 'admin@unilorin.edu.ng',
      password: 'admin123'
    }
  },
  {
    name: 'Register New Student',
    userData: {
      name: 'Test Student',
      email: 'test.student@unilorin.edu.ng',
      password: 'test123',
      role: 'STUDENT',
      matricNumber: 'TEST/2024/001',
      department: 'Computer Science',
      faculty: 'Science'
    }
  },
  {
    name: 'Record Attendance',
    attendanceData: {
      courseId: 'TEST-COURSE-001',
      studentId: 'TEST-STUDENT-001',
      date: new Date().toISOString(),
      status: 'PRESENT'
    }
  }
];

// Run tests
async function runTests() {
  console.log('Starting API tests...\n');
  
  // First login as admin
  const loginResult = await testLogin(testCases[0].credentials);
  if (!loginResult.success) {
    console.error('Admin login failed, stopping tests');
    return;
  }
  
  // Register new user
  const registrationResult = await testUserRegistration(testCases[1].userData);
  if (!registrationResult.success) {
    console.error('User registration failed');
  } else {
    console.log('User registration successful');
    
    // Record attendance (if we have a valid user)
    if (registrationResult.data.user?.id) {
      const attendanceData = {
        ...testCases[2].attendanceData,
        studentId: registrationResult.data.user.id
      };
      await testAttendanceRecord(attendanceData);
    }
    
    // Clean up - delete test user
    if (registrationResult.data.user?.id) {
      await testUserDeletion(registrationResult.data.user.id);
    }
  }
  
  console.log('\nAPI tests completed.');
}

// Execute tests
runTests(); 