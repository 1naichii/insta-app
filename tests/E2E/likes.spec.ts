import { expect, test } from '@playwright/test';
import { createPost, login, postArticle, uniqueValue } from './helpers';

test('a user can like a post', async ({ page }) => {
    await login(page);
    const caption = uniqueValue('like-post');
    await createPost(page, caption);
    const post = postArticle(page, caption);

    await post.getByRole('button', { name: 'Like post' }).click();

    await expect(
        post.getByRole('button', { name: 'Unlike post' }),
    ).toBeVisible();
    await expect(
        post.getByRole('button', { name: 'Unlike post' }).getByText('1'),
    ).toBeVisible();

    await page.waitForTimeout(1_000);

    await expect(
        post.getByRole('button', { name: 'Unlike post' }).getByText('1'),
    ).toBeVisible();
});

test('a like count stays updated in a profile post modal', async ({ page }) => {
    await login(page);
    const caption = uniqueValue('profile-like-post');
    await createPost(page, caption);
    await page.goto('/@demo');
    await page
        .getByRole('button')
        .filter({ has: page.getByRole('img', { name: caption }) })
        .click();
    const likeButton = page.getByRole('button', { name: 'Like post' });

    await likeButton.click();

    const unlikeButton = page.getByRole('button', { name: 'Unlike post' });
    await expect(unlikeButton.getByText('1')).toBeVisible();

    await page.waitForTimeout(1_000);

    await expect(unlikeButton.getByText('1')).toBeVisible();
});

test('a user can unlike a post', async ({ page }) => {
    await login(page);
    const caption = uniqueValue('unlike-post');
    await createPost(page, caption);
    const post = postArticle(page, caption);
    await post.getByRole('button', { name: 'Like post' }).click();
    const unlikeButton = post.getByRole('button', { name: 'Unlike post' });
    await expect(unlikeButton).toBeVisible();

    await unlikeButton.click();

    await expect(post.getByRole('button', { name: 'Like post' })).toBeVisible();
});
