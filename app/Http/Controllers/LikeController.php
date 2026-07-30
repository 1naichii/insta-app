<?php

namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LikeController extends Controller
{
    /**
     * Like the specified post.
     */
    public function store(Request $request, Post $post): JsonResponse
    {
        try {
            $post->likes()->firstOrCreate([
                'user_id' => $request->user()->id,
            ]);
        } catch (UniqueConstraintViolationException) {
            // A concurrent request created the same like first, which is the
            // outcome this request wanted anyway, so treat it as a success.
        }

        return response()->json([
            'liked' => true,
            'likes_count' => $post->likes()->count(),
        ]);
    }

    /**
     * Remove the current user's like from the specified post.
     */
    public function destroy(Request $request, Post $post): JsonResponse
    {
        $post->likes()
            ->where('user_id', $request->user()->id)
            ->delete();

        return response()->json([
            'liked' => false,
            'likes_count' => $post->likes()->count(),
        ]);
    }
}
