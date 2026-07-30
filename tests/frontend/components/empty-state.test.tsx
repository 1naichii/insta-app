import { render, screen } from '@testing-library/react';
import type { ComponentProps, ReactNode } from 'react';
import EmptyState from '@/components/empty-state';
import ProfileShow from '@/pages/profile/show';
import type { Paginated, Post, Profile } from '@/types';

vi.mock('@inertiajs/react', () => ({
    Head: () => null,
    InfiniteScroll: ({ children }: { children: ReactNode }) => children,
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

vi.mock('@/components/post-image', () => ({ default: () => null }));
vi.mock('@/components/post-modal', () => ({ default: () => null }));

const emptyPosts: Paginated<Post> = {
    data: [],
    current_page: 1,
    last_page: 1,
    per_page: 12,
    total: 0,
    links: [],
};

const profile: Profile = {
    id: 2,
    name: 'Ada Lovelace',
    username: 'ada',
    bio: null,
    avatar_url: null,
    posts_count: 0,
    likes_received_count: 0,
    is_own_profile: true,
};

describe('EmptyState', () => {
    it('renders its user-visible content and action', () => {
        render(
            <EmptyState
                title="Nothing here"
                description="Create the first item."
                action={<button>Create item</button>}
            />,
        );

        expect(
            screen.getByRole('heading', { name: 'Nothing here' }),
        ).toBeInTheDocument();
        expect(screen.getByText('Create the first item.')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Create item' }),
        ).toBeInTheDocument();
    });

    it('omits optional content when it is not supplied', () => {
        render(<EmptyState title="Nothing here" />);

        expect(
            screen.queryByText('Create the first item.'),
        ).not.toBeInTheDocument();
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
});

describe('empty profile state', () => {
    it('sends the own-profile action to the post composer', () => {
        render(<ProfileShow profile={profile} posts={emptyPosts} />);

        expect(screen.getByRole('link', { name: 'New post' })).toHaveAttribute(
            'href',
            '/posts/create',
        );
    });

    it('does not offer an action on another users profile', () => {
        render(
            <ProfileShow
                profile={{ ...profile, is_own_profile: false }}
                posts={emptyPosts}
            />,
        );

        expect(
            screen.getByText("Ada Lovelace hasn't shared any photos yet."),
        ).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'New post' })).toBeNull();
    });
});
