import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { createPost, login, openPostModal, uniqueValue } from './helpers';

test('a user can create a post with an image', async ({ page }) => {
    await login(page);
    const caption = uniqueValue('created-in-browser');
    await page.goto('/posts/create');
    const photo = await readFile(
        fileURLToPath(new URL('./fixtures/photo.png', import.meta.url)),
    );
    const dataTransfer = await page.evaluateHandle(
        (bytes) => {
            const transfer = new DataTransfer();
            transfer.items.add(
                new File([new Uint8Array(bytes)], 'photo.png', {
                    type: 'image/png',
                }),
            );

            return transfer;
        },
        [...photo],
    );

    await page
        .getByText(/drag a photo here/i)
        .locator('..')
        .dispatchEvent('drop', { dataTransfer });

    const uploadState = await page.locator('form').evaluate((form) => {
        const input =
            form.querySelector<HTMLInputElement>('input[type="file"]');
        const image = new FormData(form).get('image');

        return {
            filesLength: input?.files?.length ?? 0,
            formDataName: image instanceof File ? image.name : null,
            formDataSize: image instanceof File ? image.size : null,
        };
    });

    expect(uploadState).toEqual({
        filesLength: 1,
        formDataName: 'photo.png',
        formDataSize: photo.length,
    });

    await page.getByLabel('Caption').fill(caption);
    await page.getByRole('button', { name: 'Share' }).click();
    await expect(page).toHaveURL(/\/feed$/);

    await expect(page.getByRole('img', { name: caption })).toBeVisible();
});

test('the post appears in the feed', async ({ page }) => {
    await login(page);
    const caption = uniqueValue('feed-post');
    await createPost(page, caption);

    await page.goto('/feed');

    await expect(page.getByText(caption)).toBeVisible();
});

test('the feed new post action is an accessible icon target', async ({
    page,
}) => {
    await page.setViewportSize({ width: 414, height: 896 });
    await login(page);

    const action = page.getByRole('link', { name: 'New post', exact: true });
    await expect(action).toBeVisible();
    const bounds = await action.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.width).toBeGreaterThanOrEqual(44);
    expect(bounds!.height).toBeGreaterThanOrEqual(44);
    await expect(action).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');

    await action.hover();
    await expect(action).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');

    const label = action.locator('span', { hasText: 'New post' });
    await expect(label).toHaveCount(1);
    await expect(label).toHaveCSS('position', 'absolute');
    await expect(label).toHaveCSS('clip-path', 'inset(50%)');
});

test('a caption keeps user-entered line breaks in the feed', async ({
    page,
}) => {
    await login(page);
    const firstLine = uniqueValue('caption-first-line');
    const caption = `${firstLine}\nSecond line\nThird line`;
    await createPost(page, caption);
    const post = page.getByRole('article').filter({ hasText: firstLine });
    const renderedCaption = post.locator('button.whitespace-pre-line');

    await expect(renderedCaption).toBeVisible();
    expect(await renderedCaption.innerText()).toContain(
        `${firstLine}\nSecond line\nThird line`,
    );
    expect(
        await renderedCaption.evaluate(
            (element) => getComputedStyle(element).whiteSpace,
        ),
    ).toBe('pre-line');
});

test('a mobile profile opens posts in a scrollable list', async ({ page }) => {
    await page.setViewportSize({ width: 414, height: 896 });
    await login(page);
    const captions: string[] = [];

    for (let index = 0; index < 13; index += 1) {
        const caption = uniqueValue(`mobile-profile-${index}`);
        captions.push(caption);
        await createPost(page, caption);
    }

    const tappedCaption = captions.at(-1)!;
    await page.goto('/@demo');
    await page
        .getByRole('button')
        .filter({ has: page.getByRole('img', { name: tappedCaption }) })
        .click();

    const posts = page.getByRole('article');
    await expect(posts.first()).toContainText(tappedCaption);
    const initialPostCount = await posts.count();
    expect(initialPostCount).toBe(12);
    expect(
        await page.evaluate(() => document.documentElement.scrollHeight),
    ).toBeGreaterThan(896);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect.poll(() => posts.count()).toBeGreaterThan(initialPostCount);
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);

    await posts.first().getByRole('button', { name: 'View comments' }).click();
    const commentsSheet = page.getByRole('dialog');
    await expect(
        commentsSheet.getByRole('heading', { name: 'Comments' }),
    ).toBeVisible();
    await commentsSheet.getByRole('button', { name: 'Back' }).click();

    await page.getByRole('button', { name: 'Back' }).click();
    await expect(
        page
            .getByRole('button')
            .filter({ has: page.getByRole('img', { name: tappedCaption }) }),
    ).toBeVisible();
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

test('closing a desktop profile post keeps the grid after narrowing', async ({
    page,
}) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await login(page);
    await page.goto('/@demo');
    const profilePost = page.locator('main').getByRole('button').first();

    await profilePost.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();

    await page.setViewportSize({ width: 414, height: 896 });

    await expect(profilePost).toBeVisible();
    await expect(page.getByRole('article')).toHaveCount(0);
});

test('editing a post from a profile returns to that profile', async ({
    page,
}) => {
    await login(page);
    const caption = uniqueValue('before-edit');
    const postId = await createPost(page, caption);
    const updatedCaption = uniqueValue('after-edit');
    await page.goto('/@demo');

    await page
        .getByRole('button')
        .filter({ has: page.getByRole('img', { name: caption }) })
        .click();
    await page.getByRole('button', { name: 'Post options' }).click();
    await page.getByRole('menuitem', { name: 'Edit post' }).click();
    await expect(page).toHaveURL(`/posts/${postId}/edit`);
    await page.getByLabel('Caption').fill(updatedCaption);
    await page.getByRole('button', { name: 'Save changes' }).click();

    await expect(page).toHaveURL(/\/@demo$/);
    await expect(page.getByRole('img', { name: updatedCaption })).toBeVisible();
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
