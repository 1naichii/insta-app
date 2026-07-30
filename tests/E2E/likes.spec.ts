import { expect, test } from '@playwright/test';
import { createPost, login, uniqueValue } from './helpers';

test('a user can like a post', async ({ page }) => {
    await login(page);
    await createPost(page, uniqueValue('like-post'));

    await page.getByRole('button', { name: 'Like post' }).click();

    await expect(
        page.getByRole('button', { name: 'Unlike post' }),
    ).toBeVisible();
});

test('a user can unlike a post', async ({ page }) => {
    await login(page);
    await createPost(page, uniqueValue('unlike-post'));
    await page.getByRole('button', { name: 'Like post' }).click();
    const unlikeButton = page.getByRole('button', { name: 'Unlike post' });
    await expect(unlikeButton).toBeVisible();

    await unlikeButton.click();

    await expect(page.getByRole('button', { name: 'Like post' })).toBeVisible();
});
