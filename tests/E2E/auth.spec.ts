import { expect, test } from '@playwright/test';
import { demoUser, login, uniqueValue } from './helpers';

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
    await page.getByRole('button', { name: demoUser.username }).click();
    await page.getByText('Log out', { exact: true }).click();

    await expect(page).toHaveURL('/');
});

test('a guest is redirected to login', async ({ page }) => {
    await page.goto('/feed');

    await expect(page).toHaveURL(/\/login$/);
});
