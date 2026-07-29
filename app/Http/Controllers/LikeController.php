<?php

namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class LikeController extends Controller
{
    /**
     * Like the specified post.
     */
    public function store(Request $request, Post $post): RedirectResponse
    {
        try {
            $post->likes()->firstOrCreate([
                'user_id' => $request->user()->id,
            ]);
        } catch (UniqueConstraintViolationException) {
            // A concurrent request created the same like first, which is the
            // outcome this request wanted anyway, so treat it as a success.
        }

        return back();
    }

    /**
     * Remove the current user's like from the specified post.
     */
    public function destroy(Request $request, Post $post): RedirectResponse
    {
        $post->likes()
            ->where('user_id', $request->user()->id)
            ->delete();

        return back();
    }
}
