import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps, ReactNode } from 'react';
import CreatePost from '@/pages/posts/create';
import EditPost from '@/pages/posts/edit';
import PostsIndex from '@/pages/posts/index';
import type { Paginated, Post } from '@/types';

const formState = vi.hoisted(() => ({
    processing: false,
    errors: {} as Record<string, string>,
}));

vi.mock('@inertiajs/react', () => ({
    Form: ({
        children,
    }: {
        children: (props: typeof formState) => ReactNode;
    }) => <form>{children(formState)}</form>,
    Head: () => null,
    InfiniteScroll: ({ children }: { children: ReactNode }) => (
        <div data-testid="infinite-scroll">{children}</div>
    ),
    Link: ({
        children,
        href,
        ...props
    }: Omit<ComponentProps<'a'>, 'href'> & {
        children: ReactNode;
        href: string | { url: string };
    }) => (
        <a href={typeof href === 'string' ? href : href.url} {...props}>
            {children}
        </a>
    ),
}));

vi.mock('@/components/post-actions-menu', () => ({
    default: () => null,
}));

vi.mock('@/components/post-card', () => ({
    default: ({ post }: { post: Post }) => (
        <article aria-label={`Post: ${post.caption}`}>{post.caption}</article>
    ),
}));

vi.mock('@/components/post-like-button', () => ({
    default: () => null,
}));

const post = (id: number, caption: string): Post => ({
    id,
    caption,
    image_url: `https://example.test/posts/${id}.jpg`,
    created_at: '2026-07-30T10:00:00Z',
    likes_count: id,
    comments_count: 0,
    liked_by_user: false,
    user: {
        id: 2,
        name: 'Ada Lovelace',
        username: 'ada',
        avatar_url: null,
    },
    can: { update: true, delete: true },
});

const paginatedPosts = (data: Post[]): Paginated<Post> => ({
    data,
    current_page: 1,
    last_page: 1,
    per_page: 12,
    total: data.length,
    links: [],
});

beforeEach(() => {
    formState.processing = false;
    formState.errors = {};
});

describe('CreatePost', () => {
    it('counts the caption and enforces its 2200 character limit', async () => {
        const user = userEvent.setup();
        render(<CreatePost />);
        const caption = screen.getByLabelText('Caption');

        await user.type(caption, 'A short caption');

        expect(caption).toHaveValue('A short caption');
        expect(caption).toHaveProperty('maxLength', 2200);
        expect(screen.getByText('15/2200')).toBeInTheDocument();
    });

    it('disables composer controls while the form is processing', () => {
        formState.processing = true;

        render(<CreatePost />);

        expect(screen.getByLabelText('Photo')).toBeDisabled();
        expect(screen.getByLabelText('Caption')).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Share' })).toBeDisabled();
    });
});

describe('EditPost', () => {
    it('seeds the caption and shows one existing photo box', () => {
        const existingPost = post(7, 'A day by the sea');

        render(<EditPost post={existingPost} />);

        expect(screen.getByLabelText('Caption')).toHaveValue(
            'A day by the sea',
        );
        expect(screen.getByText('16/2200')).toBeInTheDocument();
        expect(
            screen.getAllByRole('img', { name: 'Current post photo' }),
        ).toHaveLength(1);
        expect(
            screen.getByRole('button', { name: 'Change photo' }),
        ).toBeVisible();
        expect(screen.getByLabelText('Photo')).not.toBeRequired();
    });

    it('disables saving while the form is processing', () => {
        formState.processing = true;

        render(<EditPost post={post(7, 'Existing caption')} />);

        expect(
            screen.getByRole('button', { name: 'Save changes' }),
        ).toBeDisabled();
    });
});

describe('PostsIndex', () => {
    it('renders an empty state with working compose actions', () => {
        render(<PostsIndex posts={paginatedPosts([])} />);

        expect(
            screen.getByRole('heading', { name: 'No posts yet' }),
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                'Be the first to share a photo with the community.',
            ),
        ).toBeInTheDocument();

        const composeActions = screen.getAllByRole('link', {
            name: 'New post',
        });
        expect(composeActions).toHaveLength(2);

        for (const action of composeActions) {
            expect(action).toHaveAttribute('href', '/posts/create');
        }
    });

    it('renders each post card inside the feed', () => {
        render(
            <PostsIndex
                posts={paginatedPosts([
                    post(1, 'First post'),
                    post(2, 'Second post'),
                ])}
            />,
        );

        expect(screen.getByTestId('infinite-scroll')).toBeInTheDocument();
        expect(
            screen.getByRole('article', { name: 'Post: First post' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('article', { name: 'Post: Second post' }),
        ).toBeInTheDocument();
    });
});
