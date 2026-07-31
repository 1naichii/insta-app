import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps, ReactNode } from 'react';
import ProfileShow from '@/pages/profile/show';
import type { Paginated, Post, Profile } from '@/types';

const viewport = vi.hoisted(() => ({ isMobile: false }));

vi.mock('@inertiajs/react', () => ({
    Head: () => null,
    InfiniteScroll: ({ children }: { children: ReactNode }) => (
        <div data-testid="infinite-scroll">{children}</div>
    ),
    Link: ({
        children,
        ...props
    }: ComponentProps<'a'> & { children: ReactNode }) => (
        <a {...props}>{children}</a>
    ),
}));

vi.mock('@/components/post-actions-menu', () => ({
    default: () => null,
}));

vi.mock('@/components/post-card', () => ({
    default: ({ post }: { post: Post }) => (
        <article>List post {post.caption}</article>
    ),
}));

vi.mock('@/components/post-like-button', () => ({
    default: () => null,
}));

vi.mock('@/components/post-modal', () => ({
    default: ({
        open,
        post,
        onOpenChange,
    }: {
        open: boolean;
        post: Post;
        onOpenChange: (open: boolean) => void;
    }) =>
        open ? (
            <div role="dialog">
                Dialog post {post.caption}
                <button type="button" onClick={() => onOpenChange(false)}>
                    Dismiss dialog
                </button>
            </div>
        ) : null,
}));

vi.mock('@/hooks/use-mobile', () => ({
    useIsMobile: () => viewport.isMobile,
}));

const profile: Profile = {
    id: 2,
    name: 'Ada Lovelace',
    username: 'ada',
    bio: null,
    avatar_url: null,
    posts_count: 2,
    likes_received_count: 7,
    is_own_profile: false,
};

const post = (id: number, caption: string): Post => ({
    id,
    caption,
    image_url: `https://example.test/${id}.jpg`,
    created_at: '2026-07-30T10:00:00Z',
    likes_count: id,
    comments_count: 0,
    liked_by_user: false,
    user: {
        id: profile.id,
        name: profile.name,
        username: profile.username,
        avatar_url: null,
    },
    can: { update: false, delete: false },
});

const posts = {
    data: [post(1, 'Newest post'), post(2, 'Tapped post')],
    current_page: 1,
    last_page: 1,
    per_page: 12,
    total: 2,
} as Paginated<Post>;

beforeEach(() => {
    viewport.isMobile = false;
});

describe('ProfileShow', () => {
    it('switches the mobile grid to a list starting at the tapped post', async () => {
        viewport.isMobile = true;
        const user = userEvent.setup();
        render(<ProfileShow profile={profile} posts={posts} />);

        await user.click(screen.getByRole('button', { name: /^Tapped post/ }));

        expect(screen.getByText('List post Tapped post')).toBeInTheDocument();
        expect(
            screen.queryByText('List post Newest post'),
        ).not.toBeInTheDocument();
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('returns from the mobile list to the profile grid', async () => {
        viewport.isMobile = true;
        const user = userEvent.setup();
        render(<ProfileShow profile={profile} posts={posts} />);

        await user.click(screen.getByRole('button', { name: /^Newest post/ }));
        await user.click(screen.getByRole('button', { name: 'Back' }));

        expect(
            screen.getByRole('button', { name: /^Newest post/ }),
        ).toBeInTheDocument();
        expect(
            screen.queryByText('List post Newest post'),
        ).not.toBeInTheDocument();
    });

    it('keeps the desktop grid and opens its post dialog', async () => {
        const user = userEvent.setup();
        render(<ProfileShow profile={profile} posts={posts} />);

        await user.click(screen.getByRole('button', { name: /^Tapped post/ }));

        expect(screen.getByRole('dialog')).toHaveTextContent(
            'Dialog post Tapped post',
        );
        expect(
            screen.queryByText('List post Tapped post'),
        ).not.toBeInTheDocument();
    });

    it('keeps the grid after a closed desktop dialog is narrowed', async () => {
        const user = userEvent.setup();
        const view = render(<ProfileShow profile={profile} posts={posts} />);

        await user.click(screen.getByRole('button', { name: /^Tapped post/ }));
        await user.click(
            screen.getByRole('button', { name: 'Dismiss dialog' }),
        );
        viewport.isMobile = true;
        view.rerender(<ProfileShow profile={profile} posts={posts} />);

        expect(
            screen.getByRole('button', { name: /^Tapped post/ }),
        ).toBeInTheDocument();
        expect(
            screen.queryByText('List post Tapped post'),
        ).not.toBeInTheDocument();
    });

    it('returns an open mobile post list to the grid when widened', async () => {
        viewport.isMobile = true;
        const user = userEvent.setup();
        const view = render(<ProfileShow profile={profile} posts={posts} />);

        await user.click(screen.getByRole('button', { name: /^Tapped post/ }));
        viewport.isMobile = false;
        view.rerender(<ProfileShow profile={profile} posts={posts} />);

        expect(
            screen.getByRole('button', { name: /^Tapped post/ }),
        ).toBeInTheDocument();
        expect(
            screen.queryByText('List post Tapped post'),
        ).not.toBeInTheDocument();
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

        viewport.isMobile = true;
        view.rerender(<ProfileShow profile={profile} posts={posts} />);

        expect(
            screen.getByRole('button', { name: /^Tapped post/ }),
        ).toBeInTheDocument();
        expect(
            screen.queryByText('List post Tapped post'),
        ).not.toBeInTheDocument();
    });
});
