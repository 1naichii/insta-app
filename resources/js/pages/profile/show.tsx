import { Head, InfiniteScroll, Link } from '@inertiajs/react';
import { Heart, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import EmptyState from '@/components/empty-state';
import PostModal from '@/components/post-modal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useInitials } from '@/hooks/use-initials';
import { formatCount } from '@/lib/format';
import { index } from '@/routes/posts';
import { edit as editProfile } from '@/routes/profile';
import type { Paginated, Post, Profile } from '@/types';

type Props = {
    profile: Profile;
    posts: Paginated<Post>;
};

export default function ProfileShow({ profile, posts }: Props) {
    const getInitials = useInitials();
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    return (
        <>
            <Head title={`@${profile.username}`} />

            <div className="mx-auto w-full max-w-3xl space-y-8 p-4">
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
                                <Button asChild size="sm" variant="outline">
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
                                    {formatCount(profile.likes_received_count)}
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
                                    <Link href={index()}>Go to feed</Link>
                                </Button>
                            ) : undefined
                        }
                    />
                ) : (
                    <InfiniteScroll
                        data="posts"
                        className="grid grid-cols-3 gap-1 sm:gap-2"
                        loading={<Skeleton className="aspect-square w-full" />}
                    >
                        {posts.data.map((post) => (
                            <button
                                key={post.id}
                                type="button"
                                onClick={() => {
                                    setSelectedPost(post);
                                    setModalOpen(true);
                                }}
                                className="group relative aspect-square w-full max-w-full cursor-pointer overflow-hidden bg-muted"
                            >
                                <img
                                    src={post.image_url}
                                    alt={
                                        post.caption ??
                                        `Photo shared by ${post.user.username}`
                                    }
                                    className="size-full object-cover"
                                />
                                <div className="absolute inset-0 flex items-center justify-center gap-4 bg-black/0 text-sm font-semibold text-white opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
                                    <span className="flex items-center gap-1">
                                        <Heart
                                            className="size-4"
                                            aria-hidden="true"
                                        />
                                        {formatCount(post.likes_count)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <MessageCircle
                                            className="size-4"
                                            aria-hidden="true"
                                        />
                                        {formatCount(post.comments_count)}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </InfiniteScroll>
                )}
            </div>

            {selectedPost && (
                <PostModal
                    post={selectedPost}
                    open={modalOpen}
                    onOpenChange={setModalOpen}
                />
            )}
        </>
    );
}
