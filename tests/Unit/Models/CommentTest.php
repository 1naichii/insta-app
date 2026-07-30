<?php

use App\Models\Comment;
use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('comment belongs to a user', function () {
    $user = User::factory()->create();
    $comment = Comment::factory()->for($user)->create();

    expect($comment->user())->toBeInstanceOf(BelongsTo::class)
        ->and($comment->user->is($user))->toBeTrue();
});

test('comment belongs to a post', function () {
    $post = Post::factory()->create();
    $comment = Comment::factory()->for($post)->create();

    expect($comment->post())->toBeInstanceOf(BelongsTo::class)
        ->and($comment->post->is($post))->toBeTrue();
});
