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
