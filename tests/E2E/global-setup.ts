import { chromium, expect } from '@playwright/test';

async function saveUserState(email: string, path: string) {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    await page.goto('http://127.0.0.1:8000/login');
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Password', { exact: true }).fill('password');
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page).toHaveURL(/\/feed$/);
    await page.context().storageState({ path });

    await browser.close();
}

export default async function globalSetup() {
    await saveUserState('demo@instaapp.test', 'tests/E2E/.auth/demo.json');
    await saveUserState('sarah@instaapp.test', 'tests/E2E/.auth/sarah.json');
}
