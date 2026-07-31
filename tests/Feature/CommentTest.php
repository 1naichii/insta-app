<?php

use App\Models\Comment;
use App\Models\Post;
use App\Models\User;
use App\Policies\CommentPolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;

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

test('comment body is required when it is missing', function () {
    $user = User::factory()->create();
    $post = Post::factory()->create();

    $response = $this->actingAs($user)->post(route('posts.comments.store', $post), []);

    $response->assertSessionHasErrors('body');
    expect(Comment::count())->toBe(0);
});

test('comment body must be a string', function () {
    $user = User::factory()->create();
    $post = Post::factory()->create();

    $response = $this->actingAs($user)->post(route('posts.comments.store', $post), [
        'body' => ['not', 'a', 'string'],
    ]);

    $response->assertSessionHasErrors('body');
    expect(Comment::count())->toBe(0);
});

test('comment body cannot contain only whitespace', function () {
    $user = User::factory()->create();
    $post = Post::factory()->create();

    $response = $this->actingAs($user)->post(route('posts.comments.store', $post), [
        'body' => " \n\t ",
    ]);

    $response->assertSessionHasErrors('body');
    expect(Comment::count())->toBe(0);
});

test('comment body at the 500 character limit is accepted', function () {
    $user = User::factory()->create();
    $post = Post::factory()->create();
    $body = str_repeat('a', 500);

    $response = $this->actingAs($user)->post(route('posts.comments.store', $post), [
        'body' => $body,
    ]);

    $response->assertSessionHasNoErrors();
    expect(Comment::first()->body)->toBe($body);
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

test('the comments endpoint exposes comments oldest first', function () {
    $viewer = User::factory()->create();
    $post = Post::factory()->create();
    $older = Comment::factory()->for($post)->create(['created_at' => now()->subHour()]);
    $newer = Comment::factory()->for($post)->create(['created_at' => now()]);

    $this->actingAs($viewer)
        ->getJson(route('posts.comments.index', $post))
        ->assertOk()
        ->assertJsonCount(2, 'comments')
        ->assertJsonPath('comments.0.id', $older->id)
        ->assertJsonPath('comments.1.id', $newer->id)
        ->assertJsonPath('comments.0.body', $older->body)
        ->assertJsonPath('comments.0.user.id', $older->user_id);
});

test('the comments endpoint marks can.delete true for the author and false for others', function () {
    $author = User::factory()->create();
    $otherUser = User::factory()->create();
    $post = Post::factory()->create();
    $comment = Comment::factory()->for($author)->for($post)->create();

    $this->actingAs($author)
        ->getJson(route('posts.comments.index', $post))
        ->assertOk()
        ->assertJsonPath('comments.0.id', $comment->id)
        ->assertJsonPath('comments.0.can.delete', true);

    $this->actingAs($otherUser)
        ->getJson(route('posts.comments.index', $post))
        ->assertOk()
        ->assertJsonPath('comments.0.id', $comment->id)
        ->assertJsonPath('comments.0.can.delete', false);
});

test('the comments endpoint loads comment authors without an N plus one query', function () {
    $viewer = User::factory()->create();
    $post = Post::factory()->create();
    Comment::factory()->count(3)->for($post)->create();

    DB::enableQueryLog();

    $this->actingAs($viewer)->getJson(route('posts.comments.index', $post))->assertOk();

    $queries = collect(DB::getQueryLog())
        ->pluck('query')
        ->filter(fn (string $query) => str_starts_with(strtolower(ltrim($query)), 'select'));

    // Three selects total: the route-model-bound post, the post's comments,
    // and the comments' authors (eager loaded via `with('user')`, one query
    // for all of them). Crucially there is exactly one "users" query, not one
    // per comment, so the count stays at 3 regardless of how many comments
    // the post has - that's the proof of no N+1.
    expect($queries)->toHaveCount(3)
        ->and($queries->filter(fn (string $query) => str_starts_with(strtolower(ltrim($query)), 'select * from "comments"')))
        ->toHaveCount(1)
        ->and($queries->filter(fn (string $query) => str_contains($query, 'from "users"')))
        ->toHaveCount(1);
});
