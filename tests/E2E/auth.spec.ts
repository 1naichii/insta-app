import { expect, test } from '@playwright/test';
import { login, uniqueValue } from './helpers';

test.use({ storageState: { cookies: [], origins: [] } });

test('a user can register', async ({ page }) => {
    const unique = uniqueValue('browser-user');
    const username = unique.replaceAll('-', '_');

    await page.goto('/register');
    await page.getByLabel('Name', { exact: true }).fill('Browser User');
    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Email address').fill(`${unique}@instaapp.test`);
    await page.getByLabel('Password', { exact: true }).fill('Password1!');
    await page.getByLabel('Confirm password').fill('Password1!');
    await page.getByRole('button', { name: 'Create account' }).click();

    // Landing anywhere other than /register is not enough: assert the new
    // account is actually signed in and looking at its own feed. The account
    // menu is labelled with the display name, not the username.
    await expect(page.getByRole('heading', { name: 'Feed' })).toBeVisible();
    await expect(
        page.getByRole('button', { name: 'Browser User' }),
    ).toBeVisible();
});

test('a user can log in', async ({ page }) => {
    await login(page);
    await expect(page.getByRole('heading', { name: 'Feed' })).toBeVisible();
});

test('a user can log out', async ({ page }) => {
    await login(page);

    // Not a substring match on `demoUser.username` ("demo"): the feed can
    // (and, once posts exist, does) contain post captions that start with
    // the demo user's own username, which now render as buttons that open
    // the post modal, so an inexact name would also match those. `exact`
    // keeps this matching only the account menu trigger, which is labelled
    // with the display name "Demo User".
    await page.getByRole('button', { name: 'Demo User', exact: true }).click();
    await page.getByText('Log out', { exact: true }).click();

    await expect(page).toHaveURL(/\/login$/);
});

test('the mobile account icon is centred in its dock cell', async ({
    page,
}) => {
    await page.setViewportSize({ width: 414, height: 896 });
    await login(page);

    const trigger = page.getByRole('button', {
        name: 'Demo User',
        exact: true,
    });
    const geometry = await trigger.evaluate((button) => {
        const cellBounds = button.parentElement!.getBoundingClientRect();
        const iconBounds = button.querySelector('svg')!.getBoundingClientRect();

        return {
            cellCenter: cellBounds.x + cellBounds.width / 2,
            iconCenter: iconBounds.x + iconBounds.width / 2,
        };
    });

    expect(geometry.cellCenter).toBeCloseTo(349.125, 2);
    expect(geometry.iconCenter).toBeCloseTo(349.125, 2);
});

test('the desktop navigation rail stays expanded with its account menu open', async ({
    page,
}) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await login(page);

    const navigation = page.locator('nav[aria-label="Main"]:visible');
    await navigation.hover();
    await expect(navigation).toHaveCSS('width', '244px');
    const trigger = navigation.getByRole('button', {
        name: 'Demo User',
        exact: true,
    });
    const triggerBounds = await trigger.boundingBox();
    await trigger.click();
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();
    await page.getByText('Log out', { exact: true }).hover();

    await expect(navigation).toHaveCSS('width', '244px');
    const menuBounds = await menu.boundingBox();
    expect(triggerBounds).not.toBeNull();
    expect(menuBounds).not.toBeNull();
    expect(menuBounds!.y + menuBounds!.height).toBeLessThanOrEqual(
        triggerBounds!.y,
    );
    expect(menuBounds!.x).toBeGreaterThanOrEqual(0);
    expect(menuBounds!.y).toBeGreaterThanOrEqual(0);
    expect(menuBounds!.x + menuBounds!.width).toBeLessThanOrEqual(1280);
});

test('a guest is redirected to login', async ({ page }) => {
    await page.goto('/feed');

    await expect(page).toHaveURL(/\/login$/);
});
