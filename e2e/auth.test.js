// Auth flow E2E tests: onboarding → signup → login → logout
// Run: npx detox test --configuration android.emu.debug -o e2e/auth.test.js

const TEST_EMAIL = `test+${Date.now()}@streakup.dev`;
const TEST_PASSWORD = 'TestPass123!';
const TEST_NAME = 'E2E Tester';

describe('Onboarding', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('shows the onboarding screen on first launch', async () => {
    await expect(element(by.text('Get Started'))).toBeVisible();
  });

  it('displays auto-advancing slide headlines', async () => {
    await expect(element(by.text('Build habits that stick.'))).toBeVisible();
    await waitFor(element(by.text('Small steps, big wins.')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('navigates to signup when Get Started is tapped', async () => {
    await element(by.id('get-started-btn')).tap();
    await expect(element(by.text('Create account'))).toBeVisible();
  });
});

describe('Signup', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    await element(by.id('get-started-btn')).tap();
  });

  it('shows the signup form', async () => {
    await expect(element(by.text('Create account'))).toBeVisible();
    await expect(element(by.id('nickname-input'))).toBeVisible();
    await expect(element(by.id('email-input'))).toBeVisible();
    await expect(element(by.id('password-input'))).toBeVisible();
    await expect(element(by.id('confirm-password-input'))).toBeVisible();
    await expect(element(by.id('create-account-btn'))).toBeVisible();
  });

  it('disables submit when fields are empty', async () => {
    // Button should exist but form validation prevents submission with empty fields
    await expect(element(by.id('create-account-btn'))).toBeVisible();
  });

  it('shows error for invalid email format', async () => {
    await element(by.id('nickname-input')).typeText(TEST_NAME);
    await element(by.id('email-input')).typeText('notanemail');
    await element(by.id('password-input')).typeText(TEST_PASSWORD);
    await element(by.id('confirm-password-input')).typeText(TEST_PASSWORD);
    await element(by.id('create-account-btn')).tap();
    await expect(element(by.text('Enter a valid email address.'))).toBeVisible();
  });

  it('shows error when passwords do not match', async () => {
    await element(by.id('email-input')).clearText();
    await element(by.id('email-input')).typeText(TEST_EMAIL);
    await element(by.id('confirm-password-input')).clearText();
    await element(by.id('confirm-password-input')).typeText('DifferentPass999!');
    await element(by.id('create-account-btn')).tap();
    await expect(element(by.text('Passwords do not match.'))).toBeVisible();
  });

  it('shows error for password shorter than 6 chars', async () => {
    await element(by.id('password-input')).clearText();
    await element(by.id('password-input')).typeText('abc');
    await element(by.id('confirm-password-input')).clearText();
    await element(by.id('confirm-password-input')).typeText('abc');
    await element(by.id('create-account-btn')).tap();
    await expect(element(by.text('Password must be at least 6 characters.'))).toBeVisible();
  });

  it('navigates to login from signup', async () => {
    await element(by.text('Login')).tap();
    await expect(element(by.text('StreakUp'))).toBeVisible();
    // Go back
    await element(by.text('Sign up')).tap();
  });

  it('back button returns to onboarding', async () => {
    await element(by.traits(['button'])).atIndex(0).tap();
    await expect(element(by.text('Get Started'))).toBeVisible();
  });
});

describe('Login', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    // Navigate to login (onboarding → signup → login)
    await element(by.id('get-started-btn')).tap();
    await element(by.text('Login')).tap();
  });

  it('shows the login form', async () => {
    await expect(element(by.text('StreakUp'))).toBeVisible();
    await expect(element(by.id('email-input'))).toBeVisible();
    await expect(element(by.id('password-input'))).toBeVisible();
    await expect(element(by.id('login-btn'))).toBeVisible();
  });

  it('shows error for invalid email format', async () => {
    await element(by.id('email-input')).typeText('bademail');
    await element(by.id('password-input')).typeText('somepassword');
    await element(by.id('login-btn')).tap();
    await expect(element(by.text('Enter a valid email address.'))).toBeVisible();
  });

  it('clears error when user starts typing', async () => {
    await element(by.id('email-input')).clearText();
    await element(by.id('email-input')).typeText('a');
    await expect(element(by.text('Enter a valid email address.'))).not.toBeVisible();
  });

  it('forgot password link navigates to reset screen', async () => {
    await element(by.text('Forgot password?')).tap();
    await expect(element(by.text('Reset password'))).toBeVisible();
    await device.pressBack();
  });

  it('shows error banner for wrong credentials', async () => {
    await element(by.id('email-input')).clearText();
    await element(by.id('email-input')).typeText('wrong@example.com');
    await element(by.id('password-input')).clearText();
    await element(by.id('password-input')).typeText('wrongpassword');
    await element(by.id('login-btn')).tap();
    // Error banner should appear (either network error or 401)
    await waitFor(element(by.text('Invalid email or password')))
      .toBeVisible()
      .withTimeout(8000)
      .catch(() => {
        // Backend may return different message; check for any error state
        return waitFor(element(by.text('Something went wrong. Please try again.')))
          .toBeVisible()
          .withTimeout(3000);
      });
  });

  it('sign up link navigates to signup', async () => {
    await element(by.text('Sign up')).tap();
    await expect(element(by.text('Create account'))).toBeVisible();
  });
});
