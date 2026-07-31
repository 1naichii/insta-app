import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PostLikeButton from '@/components/post-like-button';
import type { Post } from '@/types';

const likeMock = vi.hoisted(() => ({
    liked: false,
    likesCount: 10,
    processing: false,
    toggle: vi.fn(),
}));

vi.mock('@/hooks/use-optimistic-like', () => ({
    useOptimisticLike: () => likeMock,
}));

const post = {
    id: 7,
    caption: null,
    image_url: '/image.jpg',
    created_at: '2026-07-30T10:00:00Z',
    likes_count: 10,
    comments_count: 0,
    liked_by_user: false,
    user: {
        id: 2,
        name: 'Ada Lovelace',
        username: 'ada',
        avatar_url: null,
    },
    can: { update: false, delete: false },
} satisfies Post;

beforeEach(() => {
    likeMock.liked = false;
    likeMock.likesCount = 10;
    likeMock.processing = false;
    likeMock.toggle.mockReset();
});

describe('PostLikeButton', () => {
    it('connects the optimistic like state to the button', async () => {
        const user = userEvent.setup();
        render(<PostLikeButton post={post} />);

        expect(screen.getByText('10')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Like post' }));

        expect(likeMock.toggle).toHaveBeenCalledOnce();
    });

    it('renders the processing state', () => {
        likeMock.liked = true;
        likeMock.likesCount = 11;
        likeMock.processing = true;
        render(<PostLikeButton post={post} />);

        expect(
            screen.getByRole('button', { name: 'Unlike post' }),
        ).toBeDisabled();
        expect(screen.getByText('11')).toBeInTheDocument();
    });
});
