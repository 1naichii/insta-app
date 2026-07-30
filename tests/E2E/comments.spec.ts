import { expect, test } from '@playwright/test';
import { createPost, demoUser, login, uniqueValue } from './helpers';

test('a user can create a comment', async ({ page }) => {
    await login(page);
    await createPost(page, uniqueValue('commented-post'));
    const comment = uniqueValue('browser-comment');

    await page.getByLabel('Add a comment').fill(comment);
    await page.getByRole('button', { name: 'Post comment' }).click();

    await expect(page.getByText(comment)).toBeVisible();
});

test('a user can delete their own comment', async ({ page }) => {
    await login(page);
    await createPost(page, uniqueValue('delete-comment-post'));
    const comment = uniqueValue('delete-comment');
    await page.getByLabel('Add a comment').fill(comment);
    await page.getByRole('button', { name: 'Post comment' }).click();
    await expect(page.getByText(comment)).toBeVisible();

    await page
        .getByRole('button', {
            name: `Delete comment by ${demoUser.username}`,
        })
        .click();

    await expect(page.getByText(comment)).toHaveCount(0);
});
