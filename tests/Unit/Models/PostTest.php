<?php

use App\Models\Comment;
use App\Models\Like;
use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('post belongs to a user', function () {
    $user = User::factory()->create();
    $post = Post::factory()->for($user)->create();

    expect($post->user())->toBeInstanceOf(BelongsTo::class)
        ->and($post->user->is($user))->toBeTrue();
});

test('post has many comments', function () {
    $post = Post::factory()->create();
    $comments = Comment::factory()->count(2)->for($post)->create();
    Comment::factory()->create();

    expect($post->comments())->toBeInstanceOf(HasMany::class);
    $this->assertEqualsCanonicalizing($comments->modelKeys(), $post->comments->modelKeys());
});

test('post has many likes', function () {
    $post = Post::factory()->create();
    $likes = Like::factory()->count(2)->for($post)->create();
    Like::factory()->create();

    expect($post->likes())->toBeInstanceOf(HasMany::class);
    $this->assertEqualsCanonicalizing($likes->modelKeys(), $post->likes->modelKeys());
});
