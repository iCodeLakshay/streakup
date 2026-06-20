// Smoke test — verifies app launches and reaches a known screen.
// Full suite: auth.test.js, home.test.js, settings.test.js

describe('App launch', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('launches and shows onboarding, login, or home screen', async () => {
    // New install → onboarding; returning user → home tabs; logged-out → login
    let found = false;

    // Check onboarding
    try {
      await waitFor(element(by.id('get-started-btn'))).toBeVisible().withTimeout(6000);
      found = true;
    } catch (_) {}

    // Check login screen
    if (!found) {
      try {
        await waitFor(element(by.id('login-btn'))).toBeVisible().withTimeout(6000);
        found = true;
      } catch (_) {}
    }

    // Check home tab bar
    if (!found) {
      try {
        await waitFor(element(by.text('Home'))).toBeVisible().withTimeout(6000);
        found = true;
      } catch (_) {}
    }

    if (!found) {
      throw new Error('App did not reach any known screen within timeout');
    }
  });
});
