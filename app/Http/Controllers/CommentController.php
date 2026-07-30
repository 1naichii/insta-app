<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCommentRequest;
use App\Models\Comment;
use App\Models\Post;
use App\Support\PostSerializer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class CommentController extends Controller
{
    /**
     * List the specified post's comments, oldest first, for the comments modal/sheet.
     */
    public function index(Post $post): JsonResponse
    {
        $comments = $post->comments()
            ->oldest()
            ->with('user')
            ->get();

        return response()->json([
            'comments' => $comments->map(fn (Comment $comment) => PostSerializer::comment($comment)),
        ]);
    }

    /**
     * Store a comment on the specified post.
     */
    public function store(StoreCommentRequest $request, Post $post): RedirectResponse
    {
        $request->user()->comments()->create([
            'post_id' => $post->id,
            'body' => $request->validated('body'),
        ]);

        return back();
    }

    /**
     * Remove the specified comment.
     */
    public function destroy(Comment $comment): RedirectResponse
    {
        Gate::authorize('delete', $comment);

        $comment->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Comment deleted.')]);

        return back();
    }
}
