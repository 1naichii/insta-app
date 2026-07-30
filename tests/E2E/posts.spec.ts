import { expect, test } from '@playwright/test';
import { createPost, login, uniqueValue } from './helpers';

test('a user can create a post with an image', async ({ page }) => {
    await login(page);
    const caption = uniqueValue('created-in-browser');

    await createPost(page, caption);

    await expect(page.getByRole('img', { name: caption })).toBeVisible();
});

test('the post appears in the feed', async ({ page }) => {
    await login(page);
    const caption = uniqueValue('feed-post');
    await createPost(page, caption);

    await page.goto('/feed');

    await expect(page.getByText(caption)).toBeVisible();
});

test('a user can edit their own post', async ({ page }) => {
    await login(page);
    const postId = await createPost(page, uniqueValue('before-edit'));
    const updatedCaption = uniqueValue('after-edit');

    await page.getByRole('button', { name: 'Post options' }).click();
    await page.getByRole('menuitem', { name: 'Edit post' }).click();
    await expect(page).toHaveURL(`/posts/${postId}/edit`);
    await page.getByLabel('Caption').fill(updatedCaption);
    await page.getByRole('button', { name: 'Save changes' }).click();

    await expect(page).toHaveURL(`/posts/${postId}`);
    await expect(page.getByText(updatedCaption)).toBeVisible();
});

test('a user can delete their own post', async ({ page }) => {
    await login(page);
    const caption = uniqueValue('delete-post');
    await createPost(page, caption);

    await page.getByRole('button', { name: 'Post options' }).click();
    await page.getByRole('menuitem', { name: 'Delete post' }).click();
    await expect(
        page.getByRole('dialog', { name: 'Delete this post?' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Confirm delete' }).click();

    await expect(page).toHaveURL(/\/feed$/);
    await expect(page.getByText(caption)).toHaveCount(0);
});
