import { render, screen } from '@testing-library/react';
import type { ComponentProps, ReactNode } from 'react';
import PostCard from '@/components/post-card';
import type { Post } from '@/types';

vi.mock('@inertiajs/react', () => ({
    Link: ({
        children,
        ...props
    }: ComponentProps<'a'> & { children: ReactNode }) => (
        <a {...props}>{children}</a>
    ),
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

    it('renders a supplied like button instead of the fallback count', () => {
        render(
            <PostCard post={post} likeButton={<button>Custom likes</button>} />,
        );

        expect(
            screen.getByRole('button', { name: /custom likes/i }),
        ).toBeInTheDocument();
        expect(screen.queryByText('1.5K likes')).not.toBeInTheDocument();
    });
});
