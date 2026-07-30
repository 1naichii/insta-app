<?php

use App\Models\Like;
use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('like belongs to a user', function () {
    $user = User::factory()->create();
    $like = Like::factory()->for($user)->create();

    expect($like->user())->toBeInstanceOf(BelongsTo::class)
        ->and($like->user->is($user))->toBeTrue();
});

test('like belongs to a post', function () {
    $post = Post::factory()->create();
    $like = Like::factory()->for($post)->create();

    expect($like->post())->toBeInstanceOf(BelongsTo::class)
        ->and($like->post->is($post))->toBeTrue();
});
