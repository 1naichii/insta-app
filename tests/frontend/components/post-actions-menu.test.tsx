import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps, ReactNode } from 'react';
import PostActionsMenu from '@/components/post-actions-menu';
import type { Post } from '@/types';

const routerDelete = vi.fn();

vi.mock('@inertiajs/react', () => ({
    Link: ({
        children,
        ...props
    }: ComponentProps<'a'> & { children: ReactNode }) => (
        <a {...props}>{children}</a>
    ),
    router: {
        delete: (...args: unknown[]) => routerDelete(...args),
    },
}));

beforeEach(() => {
    routerDelete.mockReset();
});

const post: Post = {
    id: 7,
    caption: null,
    image_url: '/image.jpg',
    created_at: '2026-07-30T10:00:00Z',
    likes_count: 0,
    comments_count: 0,
    liked_by_user: false,
    user: {
        id: 2,
        name: 'Ada Lovelace',
        username: 'ada',
        avatar_url: null,
    },
    can: { update: false, delete: false },
};

describe('PostActionsMenu', () => {
    it('hides the edit menu from users without permission', () => {
        const { container } = render(<PostActionsMenu post={post} />);

        expect(container).toBeEmptyDOMElement();
        expect(
            screen.queryByRole('button', { name: /post options/i }),
        ).not.toBeInTheDocument();
    });

    it('shows the edit menu to the post owner', async () => {
        const user = userEvent.setup();
        render(
            <PostActionsMenu
                post={{ ...post, can: { update: true, delete: true } }}
            />,
        );

        await user.click(screen.getByRole('button', { name: /post options/i }));

        expect(
            screen.getByRole('menuitem', { name: /edit post/i }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('menuitem', { name: /delete post/i }),
        ).toBeInTheDocument();
    });

    it('opens the confirmation dialog from the menu without closing it first', async () => {
        const user = userEvent.setup();
        render(
            <PostActionsMenu
                post={{ ...post, can: { update: true, delete: true } }}
            />,
        );

        await user.click(screen.getByRole('button', { name: /post options/i }));
        await user.click(
            screen.getByRole('menuitem', { name: /delete post/i }),
        );

        // The dialog lives inside the menu item's subtree, so it can only
        // appear if selecting the item did not unmount the menu content.
        expect(
            screen.getByRole('button', { name: /confirm delete/i }),
        ).toBeInTheDocument();
        expect(routerDelete).not.toHaveBeenCalled();
    });

    it('deletes the post when the deletion is confirmed', async () => {
        const user = userEvent.setup();
        render(
            <PostActionsMenu
                post={{ ...post, can: { update: true, delete: true } }}
            />,
        );

        await user.click(screen.getByRole('button', { name: /post options/i }));
        await user.click(
            screen.getByRole('menuitem', { name: /delete post/i }),
        );
        await user.click(
            screen.getByRole('button', { name: /confirm delete/i }),
        );

        expect(routerDelete).toHaveBeenCalledOnce();
        expect(routerDelete.mock.calls[0][0]).toContain(String(post.id));
    });

    it('reports a failed deletion and allows another attempt', async () => {
        const user = userEvent.setup();
        render(
            <PostActionsMenu
                post={{ ...post, can: { update: true, delete: true } }}
            />,
        );

        await user.click(screen.getByRole('button', { name: 'Post options' }));
        await user.click(screen.getByRole('menuitem', { name: 'Delete post' }));
        await user.click(
            screen.getByRole('button', { name: 'Confirm delete' }),
        );

        const options = routerDelete.mock.calls[0][1] as {
            onFinish: () => void;
            onNetworkError: () => void;
        };

        act(() => {
            options.onNetworkError();
            options.onFinish();
        });

        expect(screen.getByRole('alert')).toHaveTextContent(
            'The post could not be deleted. Please try again.',
        );
        expect(
            screen.getByRole('button', { name: 'Confirm delete' }),
        ).toBeEnabled();
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled();
    });

    it('does not delete the post when the dialog is cancelled', async () => {
        const user = userEvent.setup();
        render(
            <PostActionsMenu
                post={{ ...post, can: { update: true, delete: true } }}
            />,
        );

        await user.click(screen.getByRole('button', { name: /post options/i }));
        await user.click(
            screen.getByRole('menuitem', { name: /delete post/i }),
        );
        await user.click(screen.getByRole('button', { name: /cancel/i }));

        expect(routerDelete).not.toHaveBeenCalled();
    });
});
