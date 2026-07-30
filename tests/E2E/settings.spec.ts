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

test('the desktop settings content keeps the same horizontal geometry', async ({
    page,
}) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    const geometries: Array<{ x: number; width: number }> = [];

    for (const path of [
        '/settings/profile',
        '/settings/security',
        '/settings/appearance',
    ]) {
        await page.goto(path);

        if (page.url().endsWith('/user/confirm-password')) {
            await page.getByLabel('Password', { exact: true }).fill('password');
            await page
                .getByRole('button', { name: 'Confirm password' })
                .click();
            await expect(page).toHaveURL(path);
        }

        const contentBounds = await page
            .locator('main section.space-y-10')
            .boundingBox();

        expect(contentBounds).not.toBeNull();
        geometries.push({
            x: contentBounds!.x,
            width: contentBounds!.width,
        });
    }

    expect(new Set(geometries.map(({ x }) => x)).size).toBe(1);
    expect(new Set(geometries.map(({ width }) => width)).size).toBe(1);
    expect(
        await page.evaluate(
            () => getComputedStyle(document.documentElement).scrollbarGutter,
        ),
    ).toBe('stable');
});

test('the mobile account panel logs the user out', async ({ page }) => {
    await page.setViewportSize({ width: 414, height: 896 });
    await page.goto('/feed');

    await page.getByRole('button', { name: 'Demo User', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Account' })).toBeVisible();
    await page.getByText('Log out', { exact: true }).click();

    await expect(page).toHaveURL(/\/login$/);
});
