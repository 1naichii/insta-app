import { Head, InfiniteScroll, Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import EmptyState from '@/components/empty-state';
import PostActionsMenu from '@/components/post-actions-menu';
import PostCard from '@/components/post-card';
import PostLikeButton from '@/components/post-like-button';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { create } from '@/routes/posts';
import type { Paginated, Post } from '@/types';

type Props = {
    posts: Paginated<Post>;
};

export default function PostsIndex({ posts }: Props) {
    return (
        <>
            <Head title="Feed" />

            <div className="mx-auto w-full max-w-xl space-y-6 p-4">
                <div className="flex items-center justify-between gap-2">
                    <h1 className="text-xl font-semibold tracking-tight">
                        Feed
                    </h1>

                    <Button asChild size="icon" className="size-11">
                        <Link href={create()}>
                            <Plus />
                            <span className="sr-only">New post</span>
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
                    <InfiniteScroll
                        data="posts"
                        className="space-y-6"
                        loading={
                            <Skeleton className="h-96 w-full rounded-xl" />
                        }
                    >
                        {posts.data.map((post) => (
                            <PostCard
                                key={post.id}
                                post={post}
                                actions={<PostActionsMenu post={post} />}
                                likeButton={<PostLikeButton post={post} />}
                            />
                        ))}
                    </InfiniteScroll>
                )}
            </div>
        </>
    );
}
