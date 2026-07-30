import { Link } from '@inertiajs/react';
import { Heart, MessageCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { formatCount, formatPostDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { show } from '@/routes/posts';
import { show as showProfile } from '@/routes/profile';
import type { Post } from '@/types';

type Props = {
    post: Post;
    actions?: ReactNode;
    likeButton?: ReactNode;
    className?: string;
};

export default function PostCard({
    post,
    actions,
    likeButton,
    className,
}: Props) {
    const getInitials = useInitials();

    return (
        <article className={cn('border-b border-border pb-3', className)}>
            <header className="flex items-center gap-2 px-3 py-2.5">
                <Link
                    href={showProfile(post.user.username)}
                    className="flex min-w-0 flex-1 items-center gap-2"
                >
                    <Avatar className="size-8">
                        <AvatarImage
                            src={post.user.avatar_url ?? undefined}
                            alt={post.user.username}
                        />
                        <AvatarFallback>
                            {getInitials(post.user.name)}
                        </AvatarFallback>
                    </Avatar>
                    <span className="flex min-w-0 items-center gap-1 text-sm">
                        <span className="truncate font-medium text-foreground">
                            {post.user.username}
                        </span>
                        <span
                            aria-hidden="true"
                            className="text-muted-foreground"
                        >
                            &middot;
                        </span>
                        <time
                            dateTime={post.created_at}
                            className="shrink-0 text-muted-foreground"
                        >
                            {formatPostDate(post.created_at)}
                        </time>
                    </span>
                </Link>

                {actions}
            </header>

            <Link href={show(post.id)} className="block">
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
            </Link>

            <div className="px-3 pt-2">
                <div className="-ml-2 flex items-center gap-2">
                    {likeButton ?? (
                        <span className="inline-flex items-center rounded-full p-2 text-foreground">
                            <Heart
                                className="size-6"
                                strokeWidth={1.5}
                                aria-hidden="true"
                            />
                            <span className="sr-only">Like post</span>
                        </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 rounded-full p-2 text-foreground">
                        <MessageCircle
                            className="size-6"
                            strokeWidth={1.5}
                            aria-hidden="true"
                        />
                        <span className="text-sm">
                            <span className="sr-only">Comments: </span>
                            {formatCount(post.comments_count)}
                        </span>
                    </span>
                </div>

                {!likeButton && (
                    <p className="text-sm font-semibold text-foreground">
                        {formatCount(post.likes_count)} likes
                    </p>
                )}

                {post.caption && (
                    <Link
                        href={show(post.id)}
                        className="mt-1 block text-sm text-foreground"
                    >
                        <span className="font-medium">
                            {post.user.username}
                        </span>{' '}
                        {post.caption}
                    </Link>
                )}
            </div>
        </article>
    );
}
