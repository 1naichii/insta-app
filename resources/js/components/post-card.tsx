import { Link } from '@inertiajs/react';
import { Heart, MessageCircle } from 'lucide-react';
import type { MouseEvent, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import PostImage from '@/components/post-image';
import PostModal from '@/components/post-modal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { useIsMobile } from '@/hooks/use-mobile';
import { useOptimisticLike } from '@/hooks/use-optimistic-like';
import { formatCount, formatPostDate } from '@/lib/format';
import {
    POST_ACTION_CLASS,
    POST_ACTION_ICON_CLASS,
    POST_ACTION_ICON_STROKE,
} from '@/lib/post-actions';
import { cn } from '@/lib/utils';
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
    const isMobile = useIsMobile();
    const { liked, toggle } = useOptimisticLike(post);
    const [modalOpen, setModalOpen] = useState(false);
    const [captionExpanded, setCaptionExpanded] = useState(false);
    const pendingMediaTap = useRef<ReturnType<typeof setTimeout> | null>(null);
    const captionNeedsExpansion =
        post.caption !== null &&
        (post.caption.length > 160 || post.caption.split(/\r?\n/).length > 3);

    useEffect(() => {
        return () => {
            if (pendingMediaTap.current !== null) {
                clearTimeout(pendingMediaTap.current);
            }
        };
    }, []);

    function handleMediaClick(event: MouseEvent<HTMLButtonElement>) {
        if (!isMobile || event.detail === 0) {
            setModalOpen(true);

            return;
        }

        if (pendingMediaTap.current === null) {
            pendingMediaTap.current = setTimeout(() => {
                pendingMediaTap.current = null;
                setModalOpen(true);
            }, 250);

            return;
        }

        clearTimeout(pendingMediaTap.current);
        pendingMediaTap.current = null;

        if (!liked) {
            toggle();
        }
    }

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

            <button
                type="button"
                onClick={handleMediaClick}
                className="block w-full cursor-pointer text-left"
            >
                <div className="aspect-square w-full max-w-full overflow-hidden bg-muted">
                    <PostImage
                        src={post.image_url}
                        alt={
                            post.caption ??
                            `Photo shared by ${post.user.username}`
                        }
                        loading="lazy"
                        className="size-full object-cover"
                    />
                </div>
            </button>

            <div className="px-3 pt-2">
                {/* Cancel the shared action padding so the first icon's optical edge aligns with the content column. */}
                <div className="-ml-2 flex items-center gap-2">
                    {likeButton ?? (
                        <span
                            aria-hidden="true"
                            className={cn(POST_ACTION_CLASS, 'cursor-default')}
                        >
                            <Heart
                                className={POST_ACTION_ICON_CLASS}
                                strokeWidth={POST_ACTION_ICON_STROKE}
                                aria-hidden="true"
                            />
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={() => setModalOpen(true)}
                        aria-label="View comments"
                        className={POST_ACTION_CLASS}
                    >
                        <MessageCircle
                            className={POST_ACTION_ICON_CLASS}
                            strokeWidth={POST_ACTION_ICON_STROKE}
                            aria-hidden="true"
                        />
                        <span>{formatCount(post.comments_count)}</span>
                    </button>
                </div>

                {!likeButton && (
                    <p className="text-sm font-semibold text-foreground">
                        {formatCount(post.likes_count)} likes
                    </p>
                )}

                {post.caption && (
                    <>
                        <button
                            type="button"
                            onClick={() => setModalOpen(true)}
                            className={cn(
                                'mt-1 block w-full cursor-pointer text-left text-sm whitespace-pre-line text-foreground',
                                captionNeedsExpansion &&
                                    !captionExpanded &&
                                    'line-clamp-3',
                            )}
                        >
                            <span className="font-medium">
                                {post.user.username}
                            </span>{' '}
                            {post.caption}
                        </button>
                        {captionNeedsExpansion && !captionExpanded && (
                            <button
                                type="button"
                                onClick={() => setCaptionExpanded(true)}
                                className="mt-1 cursor-pointer text-sm text-muted-foreground hover:text-foreground"
                            >
                                see more
                            </button>
                        )}
                    </>
                )}
            </div>

            <PostModal
                post={post}
                open={modalOpen}
                onOpenChange={setModalOpen}
            />
        </article>
    );
}
