<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePostRequest;
use App\Http\Requests\UpdatePostRequest;
use App\Models\Comment;
use App\Models\Post;
use App\Support\PostSerializer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PostController extends Controller
{
    /**
     * Display the feed of posts, newest first.
     */
    public function index(): Response
    {
        $userId = request()->user()?->id;

        $posts = Post::query()
            ->latest()
            ->with('user')
            ->withCount(['likes', 'comments'])
            ->withExists([
                'likes as liked_by_user' => fn ($query) => $query->where('user_id', $userId),
            ])
            ->paginate(12)
            ->through(fn (Post $post) => PostSerializer::post($post));

        return Inertia::render('posts/index', [
            'posts' => Inertia::scroll($posts),
        ]);
    }

    /**
     * Show the form for creating a new post.
     */
    public function create(): Response
    {
        return Inertia::render('posts/create');
    }

    /**
     * Store a newly created post.
     */
    public function store(StorePostRequest $request): RedirectResponse
    {
        $path = $request->file('image')->store('posts', 'public');

        try {
            DB::transaction(function () use ($request, $path): void {
                $request->user()->posts()->create([
                    'caption' => $request->validated('caption'),
                    'image_path' => $path,
                ]);
            });
        } catch (\Throwable $e) {
            Storage::disk('public')->delete($path);

            throw $e;
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Post created.')]);

        return to_route('posts.index');
    }

    /**
     * Display the specified post.
     */
    public function show(Post $post): Response
    {
        $userId = request()->user()?->id;

        $post = Post::query()
            ->with([
                'user',
                'comments' => fn ($query) => $query->oldest()->with('user'),
            ])
            ->withCount(['likes', 'comments'])
            ->withExists([
                'likes as liked_by_user' => fn ($query) => $query->where('user_id', $userId),
            ])
            ->findOrFail($post->id);

        return Inertia::render('posts/show', [
            'post' => PostSerializer::post($post),
            'comments' => $post->comments->map(fn (Comment $comment) => PostSerializer::comment($comment)),
        ]);
    }

    /**
     * Show the form for editing the specified post.
     */
    public function edit(Post $post): Response
    {
        Gate::authorize('update', $post);

        return Inertia::render('posts/edit', [
            'post' => PostSerializer::post($post),
        ]);
    }

    /**
     * Update the specified post.
     */
    public function update(UpdatePostRequest $request, Post $post): RedirectResponse
    {
        Gate::authorize('update', $post);

        $previousImagePath = $post->image_path;
        $newImagePath = $request->hasFile('image')
            ? $request->file('image')->store('posts', 'public')
            : null;

        try {
            DB::transaction(function () use ($request, $post, $newImagePath): void {
                $attributes = ['image_path' => $newImagePath ?? $post->image_path];

                // Only touch the caption when it was actually submitted, so a
                // request that replaces just the image cannot silently clear it.
                if ($request->has('caption')) {
                    $attributes['caption'] = $request->validated('caption');
                }

                $post->update($attributes);
            });
        } catch (\Throwable $e) {
            if ($newImagePath !== null) {
                Storage::disk('public')->delete($newImagePath);
            }

            throw $e;
        }

        if ($newImagePath !== null) {
            Storage::disk('public')->delete($previousImagePath);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Post updated.')]);

        return to_route('posts.show', $post);
    }

    /**
     * Remove the specified post.
     */
    public function destroy(Post $post): RedirectResponse
    {
        Gate::authorize('delete', $post);

        $imagePath = $post->image_path;

        DB::transaction(function () use ($post): void {
            $post->delete();
        });

        Storage::disk('public')->delete($imagePath);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Post deleted.')]);

        return to_route('posts.index');
    }
}
