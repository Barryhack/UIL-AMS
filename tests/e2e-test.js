import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Starting E2E tests...\n');

  try {
    // Test 1: Admin Login
    console.log('Testing Admin Login...');
    await page.goto('http://localhost:3000/auth/login');
    console.log('- Loaded login page');
    
    await page.fill('input[name="email"]', 'admin@unilorin.edu.ng');
    await page.fill('input[name="password"]', 'admin123');
    console.log('- Filled login form');
    
    await page.click('button[type="submit"]');
    console.log('- Submitted login form');
    
    // Wait for navigation
    await page.waitForURL('http://localhost:3000/admin/dashboard');
    console.log('Admin login successful!\n');

    // Test 2: User Registration via Users Management
    console.log('Testing User Registration...');
    await page.goto('http://localhost:3000/admin/users');
    console.log('- Navigated to users management page');
    
    // Wait for the "Add New User" button and click it
    await page.waitForSelector('button:has-text("Add New User")', { timeout: 5000 });
    await page.click('button:has-text("Add New User")');
    console.log('- Clicked Add New User button');
    
    // Wait for the registration form to be visible
    await page.waitForSelector('form', { timeout: 5000 });
    console.log('- Found registration form');
    
    // Fill in the form fields
    await page.fill('input[id="firstName"]', 'Test');
    await page.fill('input[id="lastName"]', 'Student');
    await page.fill('input[id="email"]', 'test.student@unilorin.edu.ng');
    await page.fill('input[id="password"]', 'test123');
    await page.fill('input[id="confirmPassword"]', 'test123');
    
    // Click the role select trigger
    await page.click('button[role="combobox"]:first-of-type');
    // Select STUDENT role
    await page.click('div[role="option"]:has-text("STUDENT")');
    
    // Select faculty
    await page.click('button[role="combobox"]:nth-of-type(2)');
    await page.click('div[role="option"]:has-text("Faculty of Engineering")');
    
    // Select department
    await page.click('button[role="combobox"]:nth-of-type(3)');
    await page.click('div[role="option"]:has-text("Computer Engineering")');
    
    await page.fill('input[id="matricNumber"]', 'TEST/2024/001');
    
    // Select device (if available)
    await page.click('button[role="combobox"]:last-of-type');
    await page.click('div[role="option"]:first-of-type');
    
    console.log('- Filled registration form');
    
    // Submit the form
    await page.click('button:has-text("Save & Continue to Biometric")');
    console.log('- Submitted registration form');
    
    // Wait for success toast and navigation to biometric step
    await Promise.race([
      page.waitForSelector('[data-sonner-toast]', { timeout: 10000 }),
      page.waitForSelector('button:has-text("Scan Fingerprint")', { timeout: 10000 })
    ]);
    console.log('User registration successful!\n');

    // Test 3: View Student Attendance (Read-only test)
    console.log('Testing Attendance View...');
    await page.goto('http://localhost:3000/student/attendance');
    console.log('- Navigated to student attendance page');
    
    // Wait for the attendance stats card
    await page.waitForSelector('h2:has-text("Overall Attendance Rate")', { timeout: 5000 });
    console.log('- Found attendance statistics');
    
    // Verify attendance records table exists
    await page.waitForSelector('h2:has-text("Attendance Records")', { timeout: 5000 });
    console.log('Attendance view successful!\n');

    // Test 4: User Deletion
    console.log('Testing User Deletion...');
    await page.goto('http://localhost:3000/admin/users');
    console.log('- Navigated to users list');
    
    // Wait for the search input
    await page.fill('input[placeholder="Search users..."]', 'test.student@unilorin.edu.ng');
    console.log('- Searched for test user');
    
    // Wait for the delete button and click it
    await page.click('button[aria-label="Delete user"]');
    console.log('- Clicked delete button');
    
    // Wait for and click the confirm button in the dialog
    await page.click('button:has-text("Delete")');
    console.log('- Confirmed deletion');
    
    // Wait for success toast or navigation
    await Promise.race([
      page.waitForSelector('[data-sonner-toast]', { timeout: 10000 }),
      page.waitForURL('http://localhost:3000/admin/users')
    ]);
    console.log('User deletion successful!\n');

  } catch (error) {
    console.error('Test failed:', error);
    
    // Take a screenshot on failure
    if (page) {
      await page.screenshot({ path: 'test-failure.png' });
      console.log('Screenshot saved as test-failure.png');
      
      // Log the current URL
      console.log('Current URL:', page.url());
      
      // Log any error messages on the page
      const errorText = await page.evaluate(() => {
        const errorElements = document.querySelectorAll('[role="alert"], .error-message, .form-error');
        return Array.from(errorElements).map(el => el.textContent).join('\n');
      });
      if (errorText) {
        console.log('Error messages on page:', errorText);
      }
    }
  } finally {
    await browser.close();
    console.log('E2E tests completed.');
  }
})(); 