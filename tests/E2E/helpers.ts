import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { expect } from '@playwright/test';
import type { BrowserContext, Page } from '@playwright/test';

export const demoUser = {
    email: 'demo@instaapp.test',
    username: 'demo',
};

export const sarahUser = {
    email: 'sarah@instaapp.test',
    username: 'sarah',
};

export async function login(page: Page, email = demoUser.email) {
    if (email === demoUser.email) {
        await page.goto('/feed');

        if (page.url().endsWith('/feed')) {
            return;
        }
    }

    await page.goto('/login');
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Password', { exact: true }).fill('password');
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page).toHaveURL(/\/feed$/);
}

export async function switchUser(page: Page, email: string) {
    const stateFile = email === sarahUser.email ? 'sarah.json' : 'demo.json';
    const state = JSON.parse(
        await readFile(
            fileURLToPath(new URL(`./.auth/${stateFile}`, import.meta.url)),
            'utf8',
        ),
    ) as Awaited<ReturnType<BrowserContext['storageState']>>;

    await page.context().clearCookies();
    await page.context().addCookies(state.cookies);
    await page.goto('/feed');
    await expect(page).toHaveURL(/\/feed$/);
}

export async function createPost(page: Page, caption: string) {
    await page.goto('/posts/create');
    await page
        .locator('input[type="file"]')
        .setInputFiles(
            fileURLToPath(new URL('./fixtures/photo.png', import.meta.url)),
        );
    await page.getByLabel('Caption').fill(caption);
    await page.getByRole('button', { name: 'Share' }).click();
    await expect(page).toHaveURL(/\/feed$/);
    const post = page.getByRole('article').filter({ hasText: caption });
    await expect(post).toBeVisible();
    await post.getByRole('link').nth(1).click();
    await expect(page).toHaveURL(/\/posts\/\d+$/);

    return Number(new URL(page.url()).pathname.split('/').pop());
}

export async function directDelete(page: Page, path: string) {
    return page.evaluate(async (requestPath) => {
        const token = document.cookie
            .split('; ')
            .find((cookie) => cookie.startsWith('XSRF-TOKEN='))
            ?.split('=')
            .slice(1)
            .join('=');

        const response = await fetch(requestPath, {
            method: 'DELETE',
            credentials: 'same-origin',
            headers: {
                Accept: 'text/html, application/xhtml+xml',
                'X-Requested-With': 'XMLHttpRequest',
                'X-XSRF-TOKEN': decodeURIComponent(token ?? ''),
            },
        });

        return response.status;
    }, path);
}

export function uniqueValue(prefix: string) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
