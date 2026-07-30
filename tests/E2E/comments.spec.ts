import { expect, test } from '@playwright/test';
import {
    createPost,
    demoUser,
    login,
    openPostModal,
    uniqueValue,
} from './helpers';

test('a user can create a comment', async ({ page }) => {
    await login(page);
    const caption = uniqueValue('commented-post');
    await createPost(page, caption);
    await openPostModal(page, caption);
    const comment = uniqueValue('browser-comment');

    await page.getByLabel('Add a comment').fill(comment);
    await page.getByRole('button', { name: 'Post comment' }).click();

    await expect(page.locator('p').filter({ hasText: comment })).toBeVisible();
});

test('a user can delete their own comment', async ({ page }) => {
    await login(page);
    const caption = uniqueValue('delete-comment-post');
    await createPost(page, caption);
    await openPostModal(page, caption);
    const comment = uniqueValue('delete-comment');
    await page.getByLabel('Add a comment').fill(comment);
    await page.getByRole('button', { name: 'Post comment' }).click();
    await expect(page.locator('p').filter({ hasText: comment })).toBeVisible();

    await page
        .getByRole('button', {
            name: `Delete comment by ${demoUser.username}`,
        })
        .click();

    await expect(page.locator('p').filter({ hasText: comment })).toHaveCount(0);
});
