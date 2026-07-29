<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePostRequest;
use App\Models\Post;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
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
        $posts = Post::query()
            ->latest()
            ->with('user')
            ->withCount(['likes', 'comments'])
            ->paginate(12)
            ->through(fn (Post $post) => $this->serialize($post));

        return Inertia::render('posts/index', [
            'posts' => $posts,
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
        $post->load('user')->loadCount(['likes', 'comments']);

        return Inertia::render('posts/show', [
            'post' => $this->serialize($post),
        ]);
    }

    /**
     * Serialize a post for the Inertia response.
     *
     * @return array<string, mixed>
     */
    private function serialize(Post $post): array
    {
        return [
            'id' => $post->id,
            'caption' => $post->caption,
            'image_url' => Storage::disk('public')->url($post->image_path),
            'created_at' => $post->created_at->toIso8601String(),
            'likes_count' => $post->likes_count,
            'comments_count' => $post->comments_count,
            'user' => [
                'id' => $post->user->id,
                'name' => $post->user->name,
                'username' => $post->user->username,
                'avatar' => $post->user->avatar,
            ],
        ];
    }
}
