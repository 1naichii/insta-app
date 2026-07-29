<?php

use App\Models\Comment;
use App\Models\Post;
use App\Models\User;
use App\Policies\CommentPolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('comment policy is auto-discovered', function () {
    expect(Gate::getPolicyFor(Comment::class))->toBeInstanceOf(CommentPolicy::class);
});

test('user can create a comment', function () {
    $user = User::factory()->create();
    $post = Post::factory()->create();

    $response = $this->actingAs($user)->post(route('posts.comments.store', $post), [
        'body' => 'A thoughtful comment.',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('comments', [
        'user_id' => $user->id,
        'post_id' => $post->id,
        'body' => 'A thoughtful comment.',
    ]);
});

test('comment body is required', function () {
    $user = User::factory()->create();
    $post = Post::factory()->create();

    $response = $this->actingAs($user)->post(route('posts.comments.store', $post), [
        'body' => '',
    ]);

    $response->assertSessionHasErrors('body');
    expect(Comment::count())->toBe(0);
});

test('comment body longer than 500 characters is rejected', function () {
    $user = User::factory()->create();
    $post = Post::factory()->create();

    $response = $this->actingAs($user)->post(route('posts.comments.store', $post), [
        'body' => str_repeat('a', 501),
    ]);

    $response->assertSessionHasErrors('body');
    expect(Comment::count())->toBe(0);
});

test('guest cannot create a comment', function () {
    $post = Post::factory()->create();

    $response = $this->post(route('posts.comments.store', $post), [
        'body' => 'Not allowed.',
    ]);

    $response->assertRedirect(route('login'));
    expect(Comment::count())->toBe(0);
});

test('user can delete their own comment', function () {
    $user = User::factory()->create();
    $comment = Comment::factory()->for($user)->create();

    $response = $this->actingAs($user)->delete(route('comments.destroy', $comment));

    $response->assertRedirect();
    $this->assertModelMissing($comment);
});

test('user cannot delete another user\'s comment', function () {
    $comment = Comment::factory()->create();
    $otherUser = User::factory()->create();

    $response = $this->actingAs($otherUser)->delete(route('comments.destroy', $comment));

    $response->assertForbidden();
    $this->assertModelExists($comment);
});

test('guest cannot delete a comment', function () {
    $comment = Comment::factory()->create();

    $response = $this->delete(route('comments.destroy', $comment));

    $response->assertRedirect(route('login'));
    $this->assertModelExists($comment);
});

test('deleting a post removes related comments', function () {
    Storage::fake('public');

    $owner = User::factory()->create();
    $post = Post::factory()->for($owner)->create();
    $comment = Comment::factory()->for($post)->create();

    $this->actingAs($owner)->delete(route('posts.destroy', $post))->assertRedirect();

    $this->assertModelMissing($comment);
});

test('the detail page exposes comments oldest first', function () {
    $viewer = User::factory()->create();
    $post = Post::factory()->create();
    $older = Comment::factory()->for($post)->create(['created_at' => now()->subHour()]);
    $newer = Comment::factory()->for($post)->create(['created_at' => now()]);

    $this->actingAs($viewer)
        ->get(route('posts.show', $post))
        ->assertInertia(fn (Assert $page) => $page
            ->component('posts/show')
            ->where('post.comments_count', 2)
            ->where('comments.0.id', $older->id)
            ->where('comments.1.id', $newer->id)
            ->where('comments.0.body', $older->body)
            ->has('comments.0.created_at')
            ->where('comments.0.user.id', $older->user_id)
        );
});

test('the detail page marks can.delete true for the author and false for others', function () {
    $author = User::factory()->create();
    $otherUser = User::factory()->create();
    $post = Post::factory()->create();
    $comment = Comment::factory()->for($author)->for($post)->create();

    $this->actingAs($author)
        ->get(route('posts.show', $post))
        ->assertInertia(fn (Assert $page) => $page
            ->where('comments.0.id', $comment->id)
            ->where('comments.0.can.delete', true)
        );

    $this->actingAs($otherUser)
        ->get(route('posts.show', $post))
        ->assertInertia(fn (Assert $page) => $page
            ->where('comments.0.id', $comment->id)
            ->where('comments.0.can.delete', false)
        );
});

test('the detail page loads comment authors without an N plus one query', function () {
    $viewer = User::factory()->create();
    $post = Post::factory()->create();
    Comment::factory()->count(3)->for($post)->create();

    DB::enableQueryLog();

    $this->actingAs($viewer)->get(route('posts.show', $post))->assertOk();

    $queries = collect(DB::getQueryLog())
        ->pluck('query')
        ->filter(fn (string $query) => str_starts_with(strtolower(ltrim($query)), 'select'));

    expect($queries)->toHaveCount(5)
        ->and($queries->filter(fn (string $query) => str_starts_with(strtolower(ltrim($query)), 'select * from "comments"')))
        ->toHaveCount(1)
        ->and($queries->filter(fn (string $query) => str_contains($query, 'from "users"')))
        ->toHaveCount(2);
});
