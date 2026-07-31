import { expect, test } from '@playwright/test';
import {
    createPost,
    demoUser,
    login,
    postArticle,
    sarahUser,
    uniqueValue,
} from './helpers';

test('like state does not survive a change of user', async ({ page }) => {
    await login(page, demoUser.email);
    const caption = uniqueValue('cross-user-like');
    await createPost(page, caption);
    const demoPost = postArticle(page, caption);

    await demoPost
        .getByRole('button', { name: 'Like post', exact: true })
        .click();
    await expect(
        demoPost.getByRole('button', { name: 'Unlike post', exact: true }),
    ).toBeVisible();
    await page.waitForTimeout(1_000);

    await page.getByRole('button', { name: 'Demo User', exact: true }).click();
    await page.getByText('Log out', { exact: true }).click();
    await page
        .getByRole('dialog', { name: 'Log out?' })
        .getByRole('button', { name: 'Log out' })
        .click();
    await expect(page).toHaveURL(/\/login$/);
    await login(page, sarahUser.email);

    const sarahPost = postArticle(page, caption);
    const likeButton = sarahPost.getByRole('button', {
        name: 'Like post',
        exact: true,
    });
    await expect(likeButton).toBeVisible();
    await expect(likeButton.getByText('1')).toBeVisible();
    await expect
        .poll(() =>
            page.evaluate(
                () => performance.getEntriesByType('navigation').length,
            ),
        )
        .toBe(1);
});
