<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\User;
use App\Support\PostSerializer;
use Inertia\Inertia;
use Inertia\Response;

class UserProfileController extends Controller
{
    /**
     * Display the given user's public profile.
     */
    public function show(User $user): Response
    {
        $viewerId = request()->user()?->id;

        $user->loadCount(['posts', 'postLikes as likes_received_count']);

        $posts = Post::query()
            ->where('user_id', $user->id)
            ->latest()
            ->with('user')
            ->withCount(['likes', 'comments'])
            ->withExists([
                'likes as liked_by_user' => fn ($query) => $query->where('user_id', $viewerId),
            ])
            ->paginate(12)
            ->through(fn (Post $post) => PostSerializer::post($post));

        return Inertia::render('profile/show', [
            'profile' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'bio' => $user->bio,
                'avatar_url' => $user->avatar_url,
                'posts_count' => $user->posts_count,
                'likes_received_count' => $user->likes_received_count,
                'is_own_profile' => $viewerId === $user->id,
            ],
            'posts' => $posts,
        ]);
    }
}
