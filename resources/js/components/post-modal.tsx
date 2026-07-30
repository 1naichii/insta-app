import { Link } from '@inertiajs/react';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import CommentForm from '@/components/comment-form';
import CommentList from '@/components/comment-list';
import PostActionsMenu from '@/components/post-actions-menu';
import PostLikeButton from '@/components/post-like-button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useInitials } from '@/hooks/use-initials';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatCount, formatPostDate } from '@/lib/format';
import { index as indexComments } from '@/routes/posts/comments';
import { show as showProfile } from '@/routes/profile';
import type { Comment, Post } from '@/types';

function fetchComments(postId: number): Promise<Comment[]> {
    return fetch(indexComments(postId).url, {
        headers: { Accept: 'application/json' },
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error('Failed to load comments');
            }

            return response.json() as Promise<{ comments: Comment[] }>;
        })
        .then((payload) => payload.comments);
}

type Props = {
    post: Post;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

function CommentsSkeleton() {
    return (
        <div className="space-y-4" aria-hidden="true">
            {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="flex items-start gap-3">
                    <Skeleton className="size-8 shrink-0 rounded-full" />
                    <div className="min-w-0 flex-1 space-y-2">
                        <Skeleton className="h-3 w-1/3" />
                        <Skeleton className="h-3 w-2/3" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function CommentsLoadError({ onRetry }: { onRetry: () => void }) {
    return (
        <div className="flex flex-col items-center gap-3 py-8 text-center text-sm">
            <p className="text-muted-foreground">Couldn't load comments.</p>
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
                Try again
            </Button>
        </div>
    );
}

function CaptionEntry({ post }: { post: Post }) {
    if (!post.caption) {
        return null;
    }

    return (
        <div className="border-b border-border pb-3">
            <p className="text-sm whitespace-pre-line text-foreground">
                <Link
                    href={showProfile(post.user.username)}
                    className="font-semibold hover:underline"
                >
                    {post.user.username}
                </Link>{' '}
                {post.caption}
            </p>
            <time
                dateTime={post.created_at}
                className="mt-1 block text-xs text-muted-foreground"
            >
                {formatPostDate(post.created_at)}
            </time>
        </div>
    );
}

function CommentsBody({
    post,
    comments,
    isLoading,
    loadError,
    onRetry,
    onDeleted,
}: {
    post: Post;
    comments: Comment[] | null;
    isLoading: boolean;
    loadError: boolean;
    onRetry: () => void;
    onDeleted: () => void;
}) {
    return (
        <div className="space-y-3">
            <CaptionEntry post={post} />

            {isLoading && <CommentsSkeleton />}

            {!isLoading && loadError && <CommentsLoadError onRetry={onRetry} />}

            {!isLoading && !loadError && (
                <CommentList comments={comments ?? []} onDeleted={onDeleted} />
            )}
        </div>
    );
}

function LikeRow({ post }: { post: Post }) {
    return (
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <PostLikeButton post={post} />
            <span className="flex items-center gap-1">
                <MessageCircle className="size-4" aria-hidden="true" />
                <span>
                    <span className="sr-only">Comments: </span>
                    {formatCount(post.comments_count)}
                </span>
            </span>
        </div>
    );
}

export default function PostModal({ post, open, onOpenChange }: Props) {
    const isMobile = useIsMobile();
    const getInitials = useInitials();

    const [comments, setComments] = useState<Comment[] | null>(null);
    const [loadError, setLoadError] = useState(false);

    // No comments loaded yet and no error means a fetch is either about to
    // start or already in flight - derived instead of tracked separately, so
    // there is nothing to synchronise via a synchronous setState call in an
    // effect (see the effect below).
    const isLoading = open && comments === null && !loadError;

    // Reset stale data when `open` flips to false, following React's
    // recommended pattern of adjusting state during render (rather than in
    // an effect) when a prop changes:
    // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
    const [wasOpen, setWasOpen] = useState(open);

    if (open !== wasOpen) {
        setWasOpen(open);

        if (!open) {
            setComments(null);
            setLoadError(false);
        }
    }

    // Used for manual refetches: the retry button, and the `onCreated` /
    // `onDeleted` callbacks that keep the list fresh after a write (see
    // below). Not called from the effect below - that effect fetches
    // inline instead, so every setState it triggers happens inside a
    // `.then`/`.catch` callback rather than synchronously in the effect
    // body.
    const loadComments = useCallback(() => {
        setLoadError(false);

        return fetchComments(post.id)
            .then((data) => setComments(data))
            .catch(() => setLoadError(true));
    }, [post.id]);

    // Fetch when the modal opens. This effect's dependency array is `open`
    // (a boolean) plus `post.id`, so it only re-runs on an actual open/close
    // transition - never on a re-render that happens while the modal stays
    // open. Refetching after a comment is added/deleted goes through
    // `loadComments` directly (see `onCreated`/`onDeleted` below), which is
    // called from event handlers rather than from this effect.
    useEffect(() => {
        if (!open) {
            return;
        }

        let cancelled = false;

        fetchComments(post.id)
            .then((data) => {
                if (!cancelled) {
                    setComments(data);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setLoadError(true);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [open, post.id]);

    if (isMobile) {
        return (
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent side="bottom" className="h-[85vh] gap-0 p-0">
                    <SheetDescription className="sr-only">
                        View and add comments on {post.user.username}'s post.
                    </SheetDescription>

                    <div className="flex items-center gap-2 border-b border-border p-4">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Back"
                            onClick={() => onOpenChange(false)}
                        >
                            <ArrowLeft />
                        </Button>
                        <SheetTitle className="flex-1 text-center">
                            Comments
                        </SheetTitle>
                        <PostActionsMenu post={post} />
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        <CommentsBody
                            post={post}
                            comments={comments}
                            isLoading={isLoading}
                            loadError={loadError}
                            onRetry={loadComments}
                            onDeleted={loadComments}
                        />
                    </div>

                    <div className="space-y-3 border-t border-border p-4">
                        <LikeRow post={post} />
                        <CommentForm
                            postId={post.id}
                            onCreated={loadComments}
                        />
                    </div>
                </SheetContent>
            </Sheet>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex h-[85vh] max-w-5xl gap-0 overflow-hidden p-0 sm:max-w-5xl">
                <DialogTitle className="sr-only">
                    {`${post.user.username}'s post`}
                </DialogTitle>
                <DialogDescription className="sr-only">
                    View the photo, like it, and read or add comments.
                </DialogDescription>

                <div className="flex w-3/5 items-center justify-center bg-black">
                    <img
                        src={post.image_url}
                        alt={
                            post.caption ??
                            `Photo shared by ${post.user.username}`
                        }
                        className="size-full object-contain"
                    />
                </div>

                <div className="flex w-2/5 flex-col">
                    <div className="flex items-center justify-between gap-2 border-b border-border p-4">
                        <Link
                            href={showProfile(post.user.username)}
                            className="flex items-center gap-3"
                        >
                            <Avatar>
                                <AvatarImage
                                    src={post.user.avatar_url ?? undefined}
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
                        </Link>

                        <PostActionsMenu post={post} />
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        <CommentsBody
                            post={post}
                            comments={comments}
                            isLoading={isLoading}
                            loadError={loadError}
                            onRetry={loadComments}
                            onDeleted={loadComments}
                        />
                    </div>

                    <div className="space-y-3 border-t border-border p-4">
                        <LikeRow post={post} />
                        <CommentForm
                            postId={post.id}
                            onCreated={loadComments}
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
