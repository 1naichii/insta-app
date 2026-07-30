import { expect, test } from '@playwright/test';
import {
    createPost,
    login,
    openPostModal,
    postArticle,
    uniqueValue,
} from './helpers';

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

test('the post modal closes without a close button', async ({ page }) => {
    await login(page);
    const caption = uniqueValue('dismiss-post-modal');
    await createPost(page, caption);
    await openPostModal(page, caption);
    const dialog = page.getByRole('dialog');

    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Close' })).toHaveCount(0);

    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();

    await openPostModal(page, caption);
    await page
        .locator('[data-slot="dialog-overlay"]')
        .click({ position: { x: 5, y: 5 } });
    await expect(dialog).not.toBeVisible();
});

test('a user can edit their own post', async ({ page }) => {
    await login(page);
    const caption = uniqueValue('before-edit');
    const postId = await createPost(page, caption);
    const updatedCaption = uniqueValue('after-edit');

    await postArticle(page, caption)
        .getByRole('button', { name: 'Post options' })
        .click();
    await page.getByRole('menuitem', { name: 'Edit post' }).click();
    await expect(page).toHaveURL(`/posts/${postId}/edit`);
    await page.getByLabel('Caption').fill(updatedCaption);
    await page.getByRole('button', { name: 'Save changes' }).click();

    await expect(page).toHaveURL(/\/feed$/);
    await expect(page.getByText(updatedCaption)).toBeVisible();
});

test('a user can delete their own post', async ({ page }) => {
    await login(page);
    const caption = uniqueValue('delete-post');
    await createPost(page, caption);
    await page.goto('/@demo');

    await page
        .getByRole('button')
        .filter({ has: page.getByRole('img', { name: caption }) })
        .click();
    await page.getByRole('button', { name: 'Post options' }).click();
    await page.getByRole('menuitem', { name: 'Delete post' }).click();
    await expect(
        page.getByRole('dialog', { name: 'Delete this post?' }),
    ).toBeVisible();
    const deleteResponse = page.waitForResponse(
        (response) =>
            response.request().method() === 'DELETE' &&
            /\/posts\/\d+$/.test(new URL(response.url()).pathname),
    );
    await page.getByRole('button', { name: 'Confirm delete' }).click();
    await deleteResponse;

    await expect(page.getByText('Post deleted.')).toBeVisible();
    await expect(page).toHaveURL(/\/@demo$/);
    await expect(page.getByRole('img', { name: caption })).toHaveCount(0);
});
