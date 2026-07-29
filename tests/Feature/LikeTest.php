<?php

use App\Models\Like;
use App\Models\Post;
use App\Models\User;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('user can like a post', function () {
    $user = User::factory()->create();
    $post = Post::factory()->create();

    $response = $this->actingAs($user)->post(route('posts.likes.store', $post));

    $response->assertRedirect();
    $this->assertDatabaseHas('likes', [
        'user_id' => $user->id,
        'post_id' => $post->id,
    ]);
});

test('liking a post twice does not create a duplicate', function () {
    $user = User::factory()->create();
    $post = Post::factory()->create();

    $this->actingAs($user)->post(route('posts.likes.store', $post))->assertRedirect();
    $this->actingAs($user)->post(route('posts.likes.store', $post))->assertRedirect();

    expect(Like::query()
        ->where('user_id', $user->id)
        ->where('post_id', $post->id)
        ->count())->toBe(1);
});

test('duplicate like is rejected by PostgreSQL constraint', function () {
    $user = User::factory()->create();
    $post = Post::factory()->create();

    Like::factory()->for($user)->for($post)->create();

    expect(fn () => Like::factory()->for($user)->for($post)->create())
        ->toThrow(UniqueConstraintViolationException::class);
});

test('user can unlike a post', function () {
    $user = User::factory()->create();
    $post = Post::factory()->create();
    Like::factory()->for($user)->for($post)->create();

    $response = $this->actingAs($user)->delete(route('posts.likes.destroy', $post));

    $response->assertRedirect();
    $this->assertDatabaseMissing('likes', [
        'user_id' => $user->id,
        'post_id' => $post->id,
    ]);
});

test('unliking a post that was not liked is a no-op', function () {
    $user = User::factory()->create();
    $post = Post::factory()->create();

    $response = $this->actingAs($user)->delete(route('posts.likes.destroy', $post));

    $response->assertRedirect();
    expect(Like::count())->toBe(0);
});

test('a user cannot remove another user\'s like', function () {
    $owner = User::factory()->create();
    $otherUser = User::factory()->create();
    $post = Post::factory()->create();
    $like = Like::factory()->for($owner)->for($post)->create();

    $response = $this->actingAs($otherUser)->delete(route('posts.likes.destroy', $post));

    $response->assertRedirect();
    $this->assertModelExists($like);
});

test('guest cannot like a post', function () {
    $post = Post::factory()->create();

    $response = $this->post(route('posts.likes.store', $post));

    $response->assertRedirect(route('login'));
    expect(Like::count())->toBe(0);
});

test('the feed exposes liked_by_user for the current user', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $likedPost = Post::factory()->create(['created_at' => now()]);
    $unlikedPost = Post::factory()->create(['created_at' => now()->subMinute()]);
    Like::factory()->for($user)->for($likedPost)->create();

    $this->actingAs($user)
        ->get(route('posts.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('posts/index')
            ->where('posts.data.0.id', $likedPost->id)
            ->where('posts.data.0.liked_by_user', true)
            ->where('posts.data.1.id', $unlikedPost->id)
            ->where('posts.data.1.liked_by_user', false)
        );
});

test('the feed resolves liked status without an N plus one query', function () {
    $user = User::factory()->create();
    $posts = Post::factory()->count(3)->create();
    Like::factory()->for($user)->for($posts->first())->create();

    DB::enableQueryLog();

    $this->actingAs($user)->get(route('posts.index'))->assertOk();

    $queries = collect(DB::getQueryLog())
        ->pluck('query')
        ->filter(fn (string $query) => str_starts_with(strtolower(ltrim($query)), 'select'));

    expect($queries)->toHaveCount(3)
        ->and($queries->filter(fn (string $query) => str_contains($query, 'exists(select * from "likes"')))
        ->toHaveCount(1);
});

test('deleting a post removes related likes', function () {
    Storage::fake('public');

    $owner = User::factory()->create();
    $post = Post::factory()->for($owner)->create();
    $like = Like::factory()->for(User::factory())->for($post)->create();

    $this->actingAs($owner)->delete(route('posts.destroy', $post))->assertRedirect();

    $this->assertModelMissing($like);
});
