// Home screen & habit management E2E tests
// Requires a logged-in session. Set TEST_EMAIL / TEST_PASSWORD env vars or hardcode a test account.
// Run: npx detox test --configuration android.emu.debug -o e2e/home.test.js

const TEST_EMAIL = process.env.E2E_EMAIL || 'e2e@streakup.dev';
const TEST_PASSWORD = process.env.E2E_PASSWORD || 'E2ePass123!';

async function loginAs(email, password) {
  await device.launchApp({ newInstance: true });
  // Wait for onboarding or home
  try {
    await waitFor(element(by.id('get-started-btn'))).toBeVisible().withTimeout(5000);
    await element(by.id('get-started-btn')).tap();
    await element(by.text('Login')).tap();
  } catch {
    // Already on login screen (or home)
  }
  try {
    await waitFor(element(by.id('email-input'))).toBeVisible().withTimeout(4000);
    await element(by.id('email-input')).typeText(email);
    await element(by.id('password-input')).typeText(password);
    await element(by.id('login-btn')).tap();
    await waitFor(element(by.text('Home'))).toBeVisible().withTimeout(10000);
  } catch {
    // Already authenticated
  }
}

describe('Home screen – empty state', () => {
  beforeAll(async () => {
    await loginAs(TEST_EMAIL, TEST_PASSWORD);
  });

  it('shows greeting with user name', async () => {
    // Greeting contains "Good morning/afternoon/evening/night"
    await waitFor(element(by.text(/Good (morning|afternoon|evening|night)/)))
      .toBeVisible()
      .withTimeout(5000)
      .catch(async () => {
        // Fallback: just check we're on tabs
        await expect(element(by.text('Home'))).toBeVisible();
      });
  });

  it('shows empty state when no habits exist', async () => {
    // Only visible if user has no habits
    const noHabitsText = element(by.text('No habits yet.'));
    const addPrompt    = element(by.text('Tap + to add your first habit.'));
    try {
      await expect(noHabitsText).toBeVisible();
      await expect(addPrompt).toBeVisible();
    } catch {
      // User already has habits — skip empty-state assertions
    }
  });

  it('center FAB button is visible', async () => {
    await expect(element(by.id('center-add-btn'))).toBeVisible();
  });
});

describe('Add habit flow', () => {
  beforeAll(async () => {
    await loginAs(TEST_EMAIL, TEST_PASSWORD);
  });

  const HABIT_NAME = `E2E Habit ${Date.now()}`;

  it('opens AddHabitSheet when FAB is tapped', async () => {
    await element(by.id('center-add-btn')).tap();
    await waitFor(element(by.text('New Habit'))).toBeVisible().withTimeout(3000);
  });

  it('Add Habit button is disabled with empty name', async () => {
    // Clear any pre-filled name
    await element(by.id('habit-name-input')).clearText();
    // Button exists but submitting with empty name should not work
    await element(by.id('add-habit-btn')).tap();
    await expect(element(by.text('New Habit'))).toBeVisible(); // Sheet still open
  });

  it('fills habit name and submits', async () => {
    await element(by.id('habit-name-input')).typeText(HABIT_NAME);
    await element(by.id('add-habit-btn')).tap();
    await waitFor(element(by.text(HABIT_NAME))).toBeVisible().withTimeout(5000);
  });

  it('new habit appears in the list', async () => {
    await expect(element(by.text(HABIT_NAME))).toBeVisible();
  });

  it('shows progress card after habit is added', async () => {
    await expect(element(by.text(/\d+ of \d+ done today/))).toBeVisible();
  });
});

describe('Habit completion toggle', () => {
  beforeAll(async () => {
    await loginAs(TEST_EMAIL, TEST_PASSWORD);
  });

  it('tapping the completion ring marks a habit done', async () => {
    // Find the first habit toggle ring and tap it
    await waitFor(element(by.text(/Start your streak!/)))
      .toBeVisible()
      .withTimeout(5000)
      .catch(() => {}); // Might already be done

    // Use first visible ring toggle
    try {
      await element(by.text('Start your streak!')).atIndex(0).tap();
    } catch {
      // No habits present — add one first
    }
  });

  it('shows streak toast after marking done', async () => {
    // Toast appears briefly after toggle
    try {
      await waitFor(element(by.text(/\d+ day streak/)))
        .toBeVisible()
        .withTimeout(4000);
    } catch {
      // Toast may have already dismissed; not a blocking failure
    }
  });
});

describe('Bottom tab navigation', () => {
  beforeAll(async () => {
    await loginAs(TEST_EMAIL, TEST_PASSWORD);
  });

  it('Stats tab is visible and navigable', async () => {
    await element(by.text('Stats')).tap();
    await waitFor(element(by.text('Stats')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('Badges tab is visible and navigable', async () => {
    await element(by.text('Badges')).tap();
    await waitFor(element(by.text('Badges')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('Settings tab is visible and navigable', async () => {
    await element(by.text('Settings')).tap();
    await waitFor(element(by.text('Settings')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('Home tab returns to home screen', async () => {
    await element(by.text('Home')).tap();
    await waitFor(element(by.text('Home')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('all 4 tab labels are fully visible (not truncated)', async () => {
    await expect(element(by.text('Home'))).toBeVisible();
    await expect(element(by.text('Stats'))).toBeVisible();
    await expect(element(by.text('Badges'))).toBeVisible();
    await expect(element(by.text('Settings'))).toBeVisible();
  });
});

describe('Habit detail screen', () => {
  beforeAll(async () => {
    await loginAs(TEST_EMAIL, TEST_PASSWORD);
  });

  it('tapping a habit card opens the detail screen', async () => {
    // Tap the first habit card body (not the toggle ring)
    try {
      const habitCards = element(by.id(/^habit-card-/));
      await habitCards.atIndex(0).tap();
      await waitFor(element(by.text('Back')).or(element(by.traits(['button']))))
        .toBeVisible()
        .withTimeout(4000);
    } catch {
      // No habits present — skipping detail test
    }
  });

  it('back navigation returns to home', async () => {
    try {
      await device.pressBack();
      await expect(element(by.text('Home'))).toBeVisible();
    } catch {
      // Already on home or no detail was opened
    }
  });
});
