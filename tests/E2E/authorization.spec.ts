import { expect, test } from '@playwright/test';
import {
    createPost,
    demoUser,
    directDelete,
    login,
    openPostModal,
    sarahUser,
    switchUser,
    uniqueValue,
} from './helpers';

test("User B cannot edit User A's post", async ({ page }) => {
    await login(page);
    const caption = uniqueValue('protected-edit');
    const postId = await createPost(page, caption);
    await switchUser(page, sarahUser.email);

    await openPostModal(page, caption);
    await expect(
        page.getByRole('button', { name: 'Post options' }),
    ).toHaveCount(0);

    const response = await page.goto(`/posts/${postId}/edit`);
    expect(response?.status()).toBe(403);
});

test("User B cannot delete User A's post", async ({ page }) => {
    await login(page);
    const caption = uniqueValue('protected-delete');
    const postId = await createPost(page, caption);
    await switchUser(page, sarahUser.email);

    await openPostModal(page, caption);
    await expect(
        page.getByRole('button', { name: 'Post options' }),
    ).toHaveCount(0);
    expect(await directDelete(page, `/posts/${postId}`)).toBe(403);
});

test("User B cannot delete User A's comment", async ({ page }) => {
    await login(page);
    const caption = uniqueValue('protected-comment-post');
    await createPost(page, caption);
    await openPostModal(page, caption);
    const body = uniqueValue('protected-comment');
    await page.getByLabel('Add a comment').fill(body);
    await page.getByRole('button', { name: 'Post comment' }).click();
    await expect(page.getByText(body)).toBeVisible();
    let commentPath: string | undefined;
    await page.route('**/comments/*', async (route) => {
        commentPath = new URL(route.request().url()).pathname;
        await route.abort();
    });
    await page
        .getByRole('button', {
            name: `Delete comment by ${demoUser.username}`,
        })
        .click();
    await expect.poll(() => commentPath).toBeDefined();
    await page.unroute('**/comments/*');

    await switchUser(page, sarahUser.email);
    await openPostModal(page, caption);
    await expect(page.getByText(body)).toBeVisible();
    await expect(
        page.getByRole('button', {
            name: `Delete comment by ${demoUser.username}`,
        }),
    ).toHaveCount(0);
    expect(await directDelete(page, commentPath!)).toBe(403);
});
