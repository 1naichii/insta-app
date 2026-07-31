import { Head, InfiniteScroll, Link } from '@inertiajs/react';
import { ArrowLeft, Heart, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import EmptyState from '@/components/empty-state';
import PostActionsMenu from '@/components/post-actions-menu';
import PostCard from '@/components/post-card';
import PostImage from '@/components/post-image';
import PostLikeButton from '@/components/post-like-button';
import PostModal from '@/components/post-modal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useInitials } from '@/hooks/use-initials';
import { useIsMobile } from '@/hooks/use-mobile';
import {
    postLikeState,
    useLikesRevision,
    usePostLikeState,
} from '@/hooks/use-optimistic-like';
import { formatCount } from '@/lib/format';
import { POST_ACTION_ICON_STROKE } from '@/lib/post-actions';
import { create } from '@/routes/posts';
import { edit as editProfile } from '@/routes/profile';
import type { Paginated, Post, Profile } from '@/types';

type Props = {
    profile: Profile;
    posts: Paginated<Post>;
};

type PostSelection = {
    id: number;
    surface: 'desktop-modal' | 'mobile-list';
};

function ProfilePost({ post, onOpen }: { post: Post; onOpen: () => void }) {
    const { likesCount } = usePostLikeState(post);

    return (
        <button
            type="button"
            onClick={onOpen}
            className="group relative aspect-square w-full max-w-full cursor-pointer overflow-hidden bg-muted"
        >
            <PostImage
                src={post.image_url}
                alt={post.caption ?? `Photo shared by ${post.user.username}`}
                loading="lazy"
                className="size-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center gap-4 bg-black/0 text-sm font-semibold text-white opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
                <span className="flex items-center gap-1">
                    <Heart
                        className="size-4"
                        strokeWidth={POST_ACTION_ICON_STROKE}
                        aria-hidden="true"
                    />
                    {formatCount(likesCount)}
                </span>
                <span className="flex items-center gap-1">
                    <MessageCircle
                        className="size-4"
                        strokeWidth={POST_ACTION_ICON_STROKE}
                        aria-hidden="true"
                    />
                    {formatCount(post.comments_count)}
                </span>
            </div>
        </button>
    );
}

function ProfileContent({
    profile,
    posts,
    isMobile,
}: Props & { isMobile: boolean }) {
    const getInitials = useInitials();
    const [postSelection, setPostSelection] = useState<PostSelection | null>(
        null,
    );
    const selectedPost = posts.data.find(
        (post) => post.id === postSelection?.id,
    );
    const selectedPostIndex = posts.data.findIndex(
        (post) => post.id === postSelection?.id,
    );
    const mobilePosts =
        selectedPostIndex === -1
            ? posts.data
            : posts.data.slice(selectedPostIndex);
    const isMobilePostList =
        postSelection?.surface === 'mobile-list' && selectedPost !== undefined;
    useLikesRevision();
    const likesReceivedCount =
        profile.likes_received_count +
        posts.data.reduce(
            (total, post) =>
                total + postLikeState(post).likesCount - post.likes_count,
            0,
        );

    return (
        <>
            <Head title={`@${profile.username}`} />

            <div
                className={
                    isMobilePostList
                        ? 'mx-auto w-full max-w-xl space-y-4 p-4'
                        : 'mx-auto w-full max-w-3xl space-y-8 p-4'
                }
            >
                {isMobilePostList ? (
                    <>
                        <div className="flex items-center gap-2 border-b border-border pb-3">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label="Back"
                                onClick={() => setPostSelection(null)}
                            >
                                <ArrowLeft />
                            </Button>
                            <h1 className="text-lg font-semibold tracking-tight">
                                @{profile.username}
                            </h1>
                        </div>

                        <InfiniteScroll
                            data="posts"
                            className="space-y-6"
                            loading={
                                <Skeleton className="h-96 w-full rounded-xl" />
                            }
                        >
                            {mobilePosts.map((post) => (
                                <PostCard
                                    key={post.id}
                                    post={post}
                                    actions={<PostActionsMenu post={post} />}
                                    likeButton={<PostLikeButton post={post} />}
                                />
                            ))}
                        </InfiniteScroll>
                    </>
                ) : (
                    <>
                        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
                            <Avatar className="size-24 shrink-0 sm:size-28">
                                <AvatarImage
                                    src={profile.avatar_url ?? undefined}
                                    alt={profile.username}
                                />
                                <AvatarFallback className="text-2xl">
                                    {getInitials(profile.name)}
                                </AvatarFallback>
                            </Avatar>

                            <div className="min-w-0 flex-1 space-y-3">
                                <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="min-w-0">
                                        <h1 className="truncate text-xl font-semibold tracking-tight">
                                            {profile.name}
                                        </h1>
                                        <p className="truncate text-sm text-muted-foreground">
                                            @{profile.username}
                                        </p>
                                    </div>

                                    {profile.is_own_profile && (
                                        <Button
                                            asChild
                                            size="sm"
                                            variant="outline"
                                        >
                                            <Link href={editProfile()}>
                                                Edit profile
                                            </Link>
                                        </Button>
                                    )}
                                </div>

                                <div className="flex items-center justify-center gap-6 text-sm sm:justify-start">
                                    <span>
                                        <span className="font-semibold">
                                            {formatCount(profile.posts_count)}
                                        </span>{' '}
                                        <span className="text-muted-foreground">
                                            posts
                                        </span>
                                    </span>
                                    <span>
                                        <span className="font-semibold">
                                            {formatCount(likesReceivedCount)}
                                        </span>{' '}
                                        <span className="text-muted-foreground">
                                            likes
                                        </span>
                                    </span>
                                </div>

                                {profile.bio && (
                                    <p className="max-w-full text-sm whitespace-pre-line text-foreground">
                                        {profile.bio}
                                    </p>
                                )}
                            </div>
                        </div>

                        {posts.data.length === 0 ? (
                            <EmptyState
                                title={
                                    profile.is_own_profile
                                        ? "You haven't posted yet"
                                        : 'No posts yet'
                                }
                                description={
                                    profile.is_own_profile
                                        ? 'Share your first photo with the community.'
                                        : `${profile.name} hasn't shared any photos yet.`
                                }
                                action={
                                    profile.is_own_profile ? (
                                        <Button asChild>
                                            <Link href={create()}>
                                                New post
                                            </Link>
                                        </Button>
                                    ) : undefined
                                }
                            />
                        ) : (
                            <InfiniteScroll
                                data="posts"
                                className="grid grid-cols-3 gap-1 sm:gap-2"
                                loading={
                                    <Skeleton className="aspect-square w-full" />
                                }
                            >
                                {posts.data.map((post) => (
                                    <ProfilePost
                                        key={post.id}
                                        post={post}
                                        onOpen={() => {
                                            setPostSelection({
                                                id: post.id,
                                                surface: isMobile
                                                    ? 'mobile-list'
                                                    : 'desktop-modal',
                                            });
                                        }}
                                    />
                                ))}
                            </InfiniteScroll>
                        )}
                    </>
                )}
            </div>

            {selectedPost && postSelection?.surface === 'desktop-modal' && (
                <PostModal
                    key={selectedPost.id}
                    post={selectedPost}
                    open
                    onOpenChange={(open) => {
                        if (!open) {
                            setPostSelection(null);
                        }
                    }}
                />
            )}
        </>
    );
}

export default function ProfileShow(props: Props) {
    const isMobile = useIsMobile();

    // Crossing the breakpoint abandons either post surface and returns to the
    // grid, so a mobile list never becomes a modal or a closed modal a list.
    return (
        <ProfileContent
            key={isMobile ? 'mobile' : 'desktop'}
            {...props}
            isMobile={isMobile}
        />
    );
}
