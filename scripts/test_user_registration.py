from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import time

# Update this if your app runs on a different port or host
BASE_URL = "https://192.168.60.118:3000"

EMAIL = "admin@unilorin.edu.ng"
PASSWORD = "admin123"

# Set up Chrome options
chrome_options = Options()
chrome_options.add_argument('--ignore-certificate-errors')
chrome_options.add_argument('--ignore-ssl-errors')

# Set up the driver (make sure chromedriver is in your PATH)
driver = webdriver.Chrome(options=chrome_options)

try:
    # 1. Go to login page
    print("Navigating to login page...")
    driver.get(f"{BASE_URL}/auth/login")
    time.sleep(2)  # Give the page time to fully load and render
    
    print("Looking for email input...")
    # Wait for the email input to be visible and interactable
    email_input = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email']"))
    )
    print("Found email input, entering email...")
    email_input.send_keys(EMAIL)
    
    print("Looking for password input...")
    # Continue with password and submit
    password_input = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='password']"))
    )
    print("Found password input, entering password...")
    password_input.send_keys(PASSWORD)
    
    print("Looking for submit button...")
    # Find and click the submit button (looking for the button with "Sign in" text)
    submit_button = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Sign in')]"))
    )
    print("Found submit button, clicking...")
    submit_button.click()
    
    print("Waiting for response...")
    time.sleep(2)  # Give time for any error messages to appear
    
    # Check for error messages
    error_elements = driver.find_elements(By.CSS_SELECTOR, ".text-red-600")
    if error_elements:
        error_text = error_elements[0].text
        print(f"Login error found: {error_text}")
        raise Exception(f"Login failed: {error_text}")
    
    print("Waiting for dashboard redirect...")
    # Wait for initial redirect to dashboard
    WebDriverWait(driver, 20).until(EC.url_contains("/dashboard"))
    
    print("Checking final URL...")
    current_url = driver.current_url
    print(f"Current URL: {current_url}")
    
    if not ("/admin" in current_url or "/dashboard/admin" in current_url):
        raise Exception(f"Failed to reach admin page. Current URL: {current_url}")
    
    print("Successfully logged in and reached admin area")

    # 3. Go to user registration page
    driver.get(f"{BASE_URL}/admin/users")
    WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.ID, "name")))

    # 4. Fill out the form fields
    driver.find_element(By.ID, "name").send_keys("Test User")
    driver.find_element(By.ID, "email").send_keys("testuser@student.unilorin.edu.ng")
    driver.find_element(By.ID, "matricNumber").send_keys("12345678")

    # Select Level
    level_dropdown = driver.find_element(By.XPATH, "//div[label[@for='level']]//button")
    level_dropdown.click()
    time.sleep(1)
    level_option = driver.find_element(By.XPATH, "//div[@role='option' and contains(., '100 Level')]")
    level_option.click()

    # Select Faculty
    faculty_dropdown = driver.find_element(By.XPATH, "//div[label[@for='faculty']]//button")
    faculty_dropdown.click()
    time.sleep(1)
    faculty_option = driver.find_element(By.XPATH, "//div[@role='option' and contains(., 'Science')]")
    faculty_option.click()

    # Select Department (after faculty is selected)
    department_dropdown = driver.find_element(By.XPATH, "//div[label[@for='department']]//button")
    department_dropdown.click()
    time.sleep(1)
    department_option = driver.find_element(By.XPATH, "//div[@role='option' and contains(., 'Computer Science')]")
    department_option.click()

    # Select Device (Assign Device)
    device_dropdown = driver.find_element(By.XPATH, "//div[label[@for='register-device']]//button")
    device_dropdown.click()
    time.sleep(1)
    first_device_option = driver.find_element(By.XPATH, "//div[@role='option']")
    first_device_option.click()

    # 5. Click "Scan Fingerprint"
    scan_fp_btn = driver.find_element(By.XPATH, "//button[contains(., 'Scan Fingerprint') or contains(., 'Rescan Fingerprint')]")
    scan_fp_btn.click()
    time.sleep(5)  # Wait for scan dialog to appear
    # Close the scan dialog (click "Cancel" button)
    cancel_btn = driver.find_element(By.XPATH, "//button[contains(., 'Cancel')]")
    cancel_btn.click()
    time.sleep(1)  # Wait for dialog to close

    # 6. Click "Scan RFID Card"
    scan_rfid_btn = driver.find_element(By.XPATH, "//button[contains(., 'Scan RFID Card') or contains(., 'Rescan RFID Card')]")
    scan_rfid_btn.click()
    time.sleep(5)  # Wait for scan dialog to appear
    # Close the scan dialog (click "Cancel" button)
    cancel_btn = driver.find_element(By.XPATH, "//button[contains(., 'Cancel')]")
    cancel_btn.click()
    time.sleep(1)  # Wait for dialog to close

    # 7. Submit the form
    submit_btn = driver.find_element(By.XPATH, "//button[contains(., 'Register Student')]")
    submit_btn.click()
    time.sleep(2)

    # 8. Check for success (update selector as needed)
    print("Test completed. Check the app for registration result.")

finally:
    driver.quit() 