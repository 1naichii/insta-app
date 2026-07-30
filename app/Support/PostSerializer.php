<?php

namespace App\Support;

use App\Models\Comment;
use App\Models\Post;
use Illuminate\Support\Facades\Storage;

/**
 * Serializes posts and comments into the shape shared by the feed,
 * post detail, and public profile pages so every surface that renders
 * a post emits an identical object.
 */
class PostSerializer
{
    /**
     * Serialize a post for an Inertia response.
     *
     * @return array<string, mixed>
     */
    public static function post(Post $post): array
    {
        $user = request()->user();

        return [
            'id' => $post->id,
            'caption' => $post->caption,
            'image_url' => Storage::disk('public')->url($post->image_path),
            'created_at' => $post->created_at->toIso8601String(),
            'likes_count' => $post->likes_count,
            'comments_count' => $post->comments_count,
            'liked_by_user' => (bool) ($post->liked_by_user ?? false),
            'user' => [
                'id' => $post->user->id,
                'name' => $post->user->name,
                'username' => $post->user->username,
                'avatar_url' => $post->user->avatar_url,
            ],
            'can' => [
                'update' => $user?->can('update', $post) ?? false,
                'delete' => $user?->can('delete', $post) ?? false,
            ],
        ];
    }

    /**
     * Serialize a comment for an Inertia response.
     *
     * @return array<string, mixed>
     */
    public static function comment(Comment $comment): array
    {
        return [
            'id' => $comment->id,
            'body' => $comment->body,
            'created_at' => $comment->created_at->toIso8601String(),
            'user' => [
                'id' => $comment->user->id,
                'name' => $comment->user->name,
                'username' => $comment->user->username,
                'avatar_url' => $comment->user->avatar_url,
            ],
            'can' => [
                'delete' => request()->user()?->can('delete', $comment) ?? false,
            ],
        ];
    }
}
