import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import CommentForm from '@/components/comment-form';
import CommentList from '@/components/comment-list';
import PostActionsMenu from '@/components/post-actions-menu';
import PostImage from '@/components/post-image';
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
import {
    POST_ACTION_CLASS,
    POST_ACTION_ICON_CLASS,
    POST_ACTION_ICON_STROKE,
} from '@/lib/post-actions';
import { cn } from '@/lib/utils';
import { index as indexComments } from '@/routes/posts/comments';
import { show as showProfile } from '@/routes/profile';
import type { Comment, Post } from '@/types';

function fetchComments(
    postId: number,
    signal: AbortSignal,
): Promise<Comment[]> {
    return fetch(indexComments(postId).url, {
        headers: { Accept: 'application/json' },
        signal,
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

            {!isLoading && loadError && comments === null && (
                <CommentsLoadError onRetry={onRetry} />
            )}

            {!isLoading && comments !== null && (
                <CommentList comments={comments} onDeleted={onDeleted} />
            )}
        </div>
    );
}

function LikeRow({ post }: { post: Post }) {
    return (
        <div className="-ml-2 flex items-center gap-2">
            <PostLikeButton post={post} />
            <span className={cn(POST_ACTION_CLASS, 'cursor-default')}>
                <MessageCircle
                    className={POST_ACTION_ICON_CLASS}
                    strokeWidth={POST_ACTION_ICON_STROKE}
                    aria-hidden="true"
                />
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
    const { auth } = usePage().props;

    const [comments, setComments] = useState<Comment[] | null>(null);
    const [optimisticComments, setOptimisticComments] = useState<Comment[]>([]);
    const [loadError, setLoadError] = useState(false);
    const optimisticCommentId = useRef(-1);
    const commentsRequest = useRef<AbortController | null>(null);

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
            setOptimisticComments([]);
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
        commentsRequest.current?.abort();
        const controller = new AbortController();
        commentsRequest.current = controller;
        setLoadError(false);

        return fetchComments(post.id, controller.signal)
            .then((data) => {
                if (controller.signal.aborted) {
                    return false;
                }

                setComments(data);

                return true;
            })
            .catch((error: unknown) => {
                if (
                    controller.signal.aborted ||
                    (error instanceof DOMException &&
                        error.name === 'AbortError')
                ) {
                    return false;
                }

                setLoadError(true);

                return false;
            })
            .finally(() => {
                if (commentsRequest.current === controller) {
                    commentsRequest.current = null;
                }
            });
    }, [post.id]);

    function addOptimisticComment(body: string) {
        const id = optimisticCommentId.current--;
        const comment: Comment = {
            id,
            body,
            created_at: new Date().toISOString(),
            user: {
                id: auth.user.id,
                name: auth.user.name,
                username: auth.user.username,
                avatar_url: auth.user.avatar_url,
            },
            can: { delete: false },
        };
        const removeComment = () => {
            setOptimisticComments((current) =>
                current.filter((item) => item.id !== id),
            );
        };

        setComments((current) => current ?? []);
        setOptimisticComments((current) => [...current, comment]);

        return {
            onError: removeComment,
            onSuccess: () => {
                void loadComments().then((refreshed) => {
                    if (refreshed) {
                        removeComment();
                    }
                });
            },
        };
    }

    const displayedComments =
        comments === null ? null : [...comments, ...optimisticComments];

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
        commentsRequest.current?.abort();
        const controller = new AbortController();
        commentsRequest.current = controller;

        fetchComments(post.id, controller.signal)
            .then((data) => {
                if (!cancelled && !controller.signal.aborted) {
                    setComments(data);
                }
            })
            .catch((error: unknown) => {
                if (
                    !cancelled &&
                    !controller.signal.aborted &&
                    !(
                        error instanceof DOMException &&
                        error.name === 'AbortError'
                    )
                ) {
                    setLoadError(true);
                }
            })
            .finally(() => {
                if (commentsRequest.current === controller) {
                    commentsRequest.current = null;
                }
            });

        return () => {
            cancelled = true;
            commentsRequest.current?.abort();
            commentsRequest.current = null;
        };
    }, [open, post.id]);

    if (isMobile) {
        return (
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent
                    side="bottom"
                    showCloseButton={false}
                    className="h-[85vh] gap-0 p-0"
                >
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
                            comments={displayedComments}
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
                            onCreated={addOptimisticComment}
                        />
                    </div>
                </SheetContent>
            </Sheet>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={false}
                className="flex h-[85vh] max-w-5xl gap-0 overflow-hidden p-0 sm:max-w-5xl"
            >
                <DialogTitle className="sr-only">
                    {`${post.user.username}'s post`}
                </DialogTitle>
                <DialogDescription className="sr-only">
                    View the photo, like it, and read or add comments.
                </DialogDescription>

                <div className="flex w-3/5 items-center justify-center bg-black">
                    <PostImage
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
                            comments={displayedComments}
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
                            onCreated={addOptimisticComment}
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
