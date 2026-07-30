<?php

use App\Models\Comment;
use App\Models\Like;
use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

test('user has many posts', function () {
    $user = User::factory()->create();
    $posts = Post::factory()->count(2)->for($user)->create();
    Post::factory()->create();

    expect($user->posts())->toBeInstanceOf(HasMany::class);
    $this->assertEqualsCanonicalizing($posts->modelKeys(), $user->posts->modelKeys());
});

test('user has many comments', function () {
    $user = User::factory()->create();
    $comments = Comment::factory()->count(2)->for($user)->create();
    Comment::factory()->create();

    expect($user->comments())->toBeInstanceOf(HasMany::class);
    $this->assertEqualsCanonicalizing($comments->modelKeys(), $user->comments->modelKeys());
});

test('user has many likes', function () {
    $user = User::factory()->create();
    $likes = Like::factory()->count(2)->for($user)->create();
    Like::factory()->create();

    expect($user->likes())->toBeInstanceOf(HasMany::class);
    $this->assertEqualsCanonicalizing($likes->modelKeys(), $user->likes->modelKeys());
});

test('avatar url is a full public URL when set and null when absent', function () {
    $userWithAvatar = User::factory()->create(['avatar' => 'avatars/profile.jpg']);
    $userWithoutAvatar = User::factory()->create(['avatar' => null]);

    expect($userWithAvatar->avatar_url)
        ->toBe(Storage::disk('public')->url('avatars/profile.jpg'))
        ->toStartWith(config('app.url'))
        ->and($userWithoutAvatar->avatar_url)->toBeNull();
});

test('post and received like aggregates use the users related records', function () {
    $user = User::factory()->create();
    $posts = Post::factory()->count(2)->for($user)->create();
    $otherPost = Post::factory()->create();
    $receivedLikes = collect([
        Like::factory()->for($posts[0])->create(),
        Like::factory()->for($posts[0])->create(),
        Like::factory()->for($posts[1])->create(),
    ]);
    Like::factory()->for($otherPost)->create();

    expect($user->postLikes())->toBeInstanceOf(HasManyThrough::class);
    $this->assertEqualsCanonicalizing($receivedLikes->pluck('id')->all(), $user->postLikes->modelKeys());

    $user->loadCount(['posts', 'postLikes as likes_received_count']);

    expect($user->posts_count)->toBe(2)
        ->and($user->likes_received_count)->toBe(3);
});
