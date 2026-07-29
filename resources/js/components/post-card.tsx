import { Link } from '@inertiajs/react';
import { Heart, MessageCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { formatCount, formatPostDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { show } from '@/routes/posts';
import type { Post } from '@/types';

type Props = {
    post: Post;
    actions?: ReactNode;
    className?: string;
};

export default function PostCard({ post, actions, className }: Props) {
    const getInitials = useInitials();

    return (
        <article
            className={cn(
                'overflow-hidden rounded-lg border border-border bg-card',
                className,
            )}
        >
            <header className="flex items-center justify-between gap-2 p-3">
                <div className="flex items-center gap-2">
                    <Avatar>
                        <AvatarImage
                            src={post.user.avatar ?? undefined}
                            alt={post.user.username}
                        />
                        <AvatarFallback>
                            {getInitials(post.user.name)}
                        </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">
                        {post.user.username}
                    </span>
                </div>

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

                <div className="space-y-2 p-3">
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
                        <p className="text-sm text-foreground">
                            <span className="font-medium">
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
            </Link>
        </article>
    );
}
