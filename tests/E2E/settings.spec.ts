import { expect, test } from '@playwright/test';

test('the settings index redirects to profile on desktop', async ({ page }) => {
    await page.goto('/settings');

    await expect(page).toHaveURL(/\/settings\/profile$/);
});

test('the settings index routes sections on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 414, height: 896 });
    await page.goto('/settings');

    const settingsNavigation = page.getByRole('navigation', {
        name: 'Settings',
    });
    await expect(settingsNavigation).toBeVisible();

    await settingsNavigation.getByRole('link', { name: 'Profile' }).click();
    await expect(page).toHaveURL(/\/settings\/profile$/);
    await expect(settingsNavigation).toBeHidden();

    await page.getByRole('link', { name: 'Back to settings' }).click();
    await expect(page).toHaveURL(/\/settings$/);
    await expect(settingsNavigation).toBeVisible();
});

test('the mobile account panel logs the user out', async ({ page }) => {
    await page.setViewportSize({ width: 414, height: 896 });
    await page.goto('/feed');

    await page.getByRole('button', { name: 'Demo User', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Account' })).toBeVisible();
    await page.getByText('Log out', { exact: true }).click();

    await expect(page).toHaveURL(/\/login$/);
});
