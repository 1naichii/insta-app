import { Head, Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import EmptyState from '@/components/empty-state';
import PostActionsMenu from '@/components/post-actions-menu';
import PostCard from '@/components/post-card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { create, index } from '@/routes/posts';
import type { Paginated, Post } from '@/types';

type Props = {
    posts: Paginated<Post>;
};

function decodeHtmlEntities(label: string): string {
    return label
        .replaceAll('&laquo;', '«')
        .replaceAll('&raquo;', '»')
        .replaceAll('&amp;', '&');
}

export default function PostsIndex({ posts }: Props) {
    return (
        <>
            <Head title="Feed" />

            <div className="mx-auto w-full max-w-xl space-y-6 p-4">
                <div className="flex items-center justify-between gap-2">
                    <h1 className="text-xl font-semibold tracking-tight">
                        Feed
                    </h1>

                    <Button asChild size="sm">
                        <Link href={create()}>
                            <Plus />
                            New post
                        </Link>
                    </Button>
                </div>

                {posts.data.length === 0 ? (
                    <EmptyState
                        title="No posts yet"
                        description="Be the first to share a photo with the community."
                        action={
                            <Button asChild>
                                <Link href={create()}>New post</Link>
                            </Button>
                        }
                    />
                ) : (
                    <div className="space-y-6">
                        {posts.data.map((post) => (
                            <PostCard
                                key={post.id}
                                post={post}
                                actions={<PostActionsMenu post={post} />}
                            />
                        ))}
                    </div>
                )}

                {posts.last_page > 1 && (
                    <nav
                        aria-label="Pagination"
                        className="flex flex-wrap items-center justify-center gap-1"
                    >
                        {posts.links.map((link, linkIndex) =>
                            link.url ? (
                                <Link
                                    key={linkIndex}
                                    href={link.url}
                                    preserveScroll
                                    className={cn(
                                        'rounded-md px-3 py-1.5 text-sm',
                                        link.active
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                                    )}
                                >
                                    {decodeHtmlEntities(link.label)}
                                </Link>
                            ) : (
                                <span
                                    key={linkIndex}
                                    aria-disabled="true"
                                    className="rounded-md px-3 py-1.5 text-sm text-muted-foreground/50"
                                >
                                    {decodeHtmlEntities(link.label)}
                                </span>
                            ),
                        )}
                    </nav>
                )}
            </div>
        </>
    );
}

PostsIndex.layout = {
    breadcrumbs: [{ title: 'Feed', href: index() }],
};
