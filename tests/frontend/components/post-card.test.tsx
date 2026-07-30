import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps, ReactNode } from 'react';
import PostCard from '@/components/post-card';
import type { Post } from '@/types';

const viewport = vi.hoisted(() => ({ isMobile: false }));
const likeMock = vi.hoisted(() => ({ liked: false, toggle: vi.fn() }));

vi.mock('@inertiajs/react', () => ({
    Link: ({
        children,
        ...props
    }: ComponentProps<'a'> & { children: ReactNode }) => (
        <a {...props}>{children}</a>
    ),
}));

// PostModal itself fetches comments and picks Dialog/Sheet via
// `useIsMobile()` (backed by `window.matchMedia`), none of which this test
// cares about - it only needs to prove PostCard opens the modal, so the
// modal is replaced with a minimal stand-in that reveals its `open` prop.
vi.mock('@/components/post-modal', () => ({
    default: ({ open }: { open: boolean }) =>
        open ? <div data-testid="post-modal">Post modal</div> : null,
}));

vi.mock('@/hooks/use-mobile', () => ({
    useIsMobile: () => viewport.isMobile,
}));

vi.mock('@/hooks/use-optimistic-like', () => ({
    useOptimisticLike: () => likeMock,
}));

const post: Post = {
    id: 7,
    caption: 'A day by the sea',
    image_url: 'https://example.test/sea.jpg',
    created_at: '2026-07-30T10:00:00Z',
    likes_count: 1500,
    comments_count: 12,
    liked_by_user: false,
    user: {
        id: 2,
        name: 'Ada Lovelace',
        username: 'ada',
        avatar_url: null,
    },
    can: { update: false, delete: false },
};

beforeEach(() => {
    viewport.isMobile = false;
    likeMock.liked = false;
    likeMock.toggle.mockReset();
});

afterEach(() => {
    vi.useRealTimers();
});

describe('PostCard', () => {
    it('shows the post content and counts', () => {
        render(<PostCard post={post} />);

        expect(screen.getAllByText('ada')).toHaveLength(2);
        expect(screen.getByText('A day by the sea')).toBeInTheDocument();
        expect(
            screen.getByRole('img', { name: 'A day by the sea' }),
        ).toHaveAttribute('src', post.image_url);
        expect(screen.getByText('1.5K likes')).toBeInTheDocument();
        expect(screen.getByText('12')).toBeInTheDocument();
    });

    it('renders content passed into its actions slot', () => {
        render(<PostCard post={post} actions={<button>Edit post</button>} />);

        expect(
            screen.getByRole('button', { name: /edit post/i }),
        ).toBeInTheDocument();
    });

    it('keeps every interactive post-card region as a sibling', () => {
        const { container } = render(
            <PostCard
                post={post}
                actions={<button>Edit post</button>}
                likeButton={<button>Custom likes</button>}
            />,
        );

        expect(
            container.querySelector('a a, a button, button a, button button'),
        ).toBeNull();
    });

    it('renders a supplied like button instead of the fallback count', () => {
        render(
            <PostCard post={post} likeButton={<button>Custom likes</button>} />,
        );

        expect(
            screen.getByRole('button', { name: /custom likes/i }),
        ).toBeInTheDocument();
        expect(screen.queryByText('1.5K likes')).not.toBeInTheDocument();
    });

    it('opens the post modal when the comment control is activated', async () => {
        const user = userEvent.setup();
        render(<PostCard post={post} />);

        expect(screen.queryByTestId('post-modal')).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'View comments' }));

        expect(screen.getByTestId('post-modal')).toBeInTheDocument();
    });

    it('opens the post modal when the media is activated', async () => {
        const user = userEvent.setup();
        render(<PostCard post={post} />);

        await user.click(
            screen.getByRole('button', { name: 'A day by the sea' }),
        );

        expect(screen.getByTestId('post-modal')).toBeInTheDocument();
    });

    it('likes an unliked post after a mobile media double tap', () => {
        viewport.isMobile = true;
        vi.useFakeTimers();
        render(<PostCard post={post} />);
        const media = screen.getByRole('button', {
            name: 'A day by the sea',
        });

        fireEvent.click(media, { detail: 1 });
        fireEvent.click(media, { detail: 2 });
        vi.runAllTimers();

        expect(likeMock.toggle).toHaveBeenCalledOnce();
        expect(screen.queryByTestId('post-modal')).not.toBeInTheDocument();
    });

    it('does not unlike an already-liked post after a mobile double tap', () => {
        viewport.isMobile = true;
        likeMock.liked = true;
        vi.useFakeTimers();
        render(<PostCard post={post} />);
        const media = screen.getByRole('button', {
            name: 'A day by the sea',
        });

        fireEvent.click(media, { detail: 1 });
        fireEvent.click(media, { detail: 2 });
        vi.runAllTimers();

        expect(likeMock.toggle).not.toHaveBeenCalled();
        expect(screen.queryByTestId('post-modal')).not.toBeInTheDocument();
    });

    it('opens immediately when mobile media is keyboard activated', () => {
        viewport.isMobile = true;
        render(<PostCard post={post} />);

        fireEvent.click(
            screen.getByRole('button', { name: 'A day by the sea' }),
            { detail: 0 },
        );

        expect(screen.getByTestId('post-modal')).toBeInTheDocument();
    });

    it('opens the post modal when the caption is activated', async () => {
        const user = userEvent.setup();
        render(<PostCard post={post} />);

        await user.click(
            screen.getByRole('button', { name: 'ada A day by the sea' }),
        );

        expect(screen.getByTestId('post-modal')).toBeInTheDocument();
    });

    it('preserves caption line breaks in the feed', () => {
        const multilinePost = {
            ...post,
            caption: 'First line\nSecond line',
        };
        render(<PostCard post={multilinePost} />);

        const caption = screen.getByRole('button', {
            name: /ada First line\s+Second line/,
        });
        expect(caption).toHaveClass('whitespace-pre-line');
        expect(caption.textContent).toContain('First line\nSecond line');
    });

    it('clamps a long caption and expands it from a sibling control', async () => {
        const user = userEvent.setup();
        const longCaption = Array.from(
            { length: 30 },
            () => 'A descriptive moment',
        ).join(' ');
        const { container } = render(
            <PostCard post={{ ...post, caption: longCaption }} />,
        );
        const caption = screen.getByRole('button', {
            name: `ada ${longCaption}`,
        });
        const seeMore = screen.getByRole('button', { name: 'see more' });

        expect(caption).toHaveClass('line-clamp-3', 'whitespace-pre-line');
        expect(caption.contains(seeMore)).toBe(false);
        expect(caption.parentElement).toBe(seeMore.parentElement);
        expect(
            container.querySelector('button button'),
        ).not.toBeInTheDocument();

        await user.click(seeMore);

        expect(caption).not.toHaveClass('line-clamp-3');
        expect(caption).toHaveTextContent(longCaption);
        expect(
            screen.queryByRole('button', { name: 'see more' }),
        ).not.toBeInTheDocument();
    });
});
