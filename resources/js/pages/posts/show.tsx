import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Heart, MessageCircle } from 'lucide-react';
import PostActionsMenu from '@/components/post-actions-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { formatCount, formatPostDate } from '@/lib/format';
import { index } from '@/routes/posts';
import type { Post } from '@/types';

type Props = {
    post: Post;
};

export default function PostsShow({ post }: Props) {
    const getInitials = useInitials();

    return (
        <>
            <Head title={`${post.user.username}'s post`} />

            <div className="mx-auto w-full max-w-xl space-y-4 p-4">
                <Link
                    href={index()}
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    Back to feed
                </Link>

                <article className="overflow-hidden rounded-lg border border-border bg-card">
                    <div className="flex items-center justify-between gap-2 p-4">
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage
                                    src={post.user.avatar ?? undefined}
                                    alt={post.user.username}
                                />
                                <AvatarFallback>
                                    {getInitials(post.user.name)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="leading-tight">
                                <p className="text-sm font-semibold">
                                    {post.user.username}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {post.user.name}
                                </p>
                            </div>
                        </div>

                        <PostActionsMenu post={post} />
                    </div>

                    <div className="aspect-square w-full max-w-full overflow-hidden bg-muted">
                        <img
                            src={post.image_url}
                            alt={
                                post.caption ??
                                `Photo shared by ${post.user.username}`
                            }
                            className="size-full object-cover"
                        />
                    </div>

                    <div className="space-y-3 p-4">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <Heart className="size-4" aria-hidden="true" />
                                <span>
                                    <span className="sr-only">Likes: </span>
                                    {formatCount(post.likes_count)}
                                </span>
                            </span>
                            <span className="flex items-center gap-1">
                                <MessageCircle
                                    className="size-4"
                                    aria-hidden="true"
                                />
                                <span>
                                    <span className="sr-only">Comments: </span>
                                    {formatCount(post.comments_count)}
                                </span>
                            </span>
                        </div>

                        {post.caption && (
                            <p className="text-sm whitespace-pre-line text-foreground">
                                <span className="font-semibold">
                                    {post.user.username}
                                </span>{' '}
                                {post.caption}
                            </p>
                        )}

                        <time
                            dateTime={post.created_at}
                            className="block text-xs text-muted-foreground"
                        >
                            {formatPostDate(post.created_at)}
                        </time>
                    </div>
                </article>

                <section
                    aria-label="Comments"
                    className="space-y-3 rounded-lg border border-dashed border-border p-4"
                >
                    <h2 className="text-sm font-medium text-muted-foreground">
                        Comments
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Comments are coming soon.
                    </p>
                </section>
            </div>
        </>
    );
}

PostsShow.layout = {
    breadcrumbs: [
        { title: 'Feed', href: index() },
        { title: 'Post', href: index() },
    ],
};
