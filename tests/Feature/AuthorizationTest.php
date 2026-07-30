<?php

use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('user cannot update another user\'s post', function () {
    Storage::fake('public');

    $owner = User::factory()->create();
    $otherUser = User::factory()->create();
    $post = Post::factory()->for($owner)->create();

    $response = $this
        ->actingAs($otherUser)
        ->patch(route('posts.update', $post), [
            'caption' => 'Hijacked caption',
        ]);

    $response->assertForbidden();

    expect($post->refresh()->caption)->not->toBe('Hijacked caption');
});

test('user cannot delete another user\'s post', function () {
    Storage::fake('public');

    $owner = User::factory()->create();
    $otherUser = User::factory()->create();
    $post = Post::factory()->for($owner)->create();

    $response = $this
        ->actingAs($otherUser)
        ->delete(route('posts.destroy', $post));

    $response->assertForbidden();

    expect(Post::find($post->id))->not->toBeNull();
});

test('user cannot open the edit page for another user\'s post', function () {
    $owner = User::factory()->create();
    $otherUser = User::factory()->create();
    $post = Post::factory()->for($owner)->create();

    $response = $this
        ->actingAs($otherUser)
        ->get(route('posts.edit', $post));

    $response->assertForbidden();
});

test('guest cannot update a post', function () {
    $owner = User::factory()->create();
    $post = Post::factory()->for($owner)->create();

    $response = $this->patch(route('posts.update', $post), [
        'caption' => 'New caption',
    ]);

    $response->assertRedirect(route('login'));
});

test('guest cannot delete a post', function () {
    $owner = User::factory()->create();
    $post = Post::factory()->for($owner)->create();

    $response = $this->delete(route('posts.destroy', $post));

    $response->assertRedirect(route('login'));
});

test('the can flags are true for the owner and false for another user', function () {
    $owner = User::factory()->create();
    $otherUser = User::factory()->create();
    $post = Post::factory()->for($owner)->create();

    // The feed lists every post regardless of author, so it proves the can
    // flags reflect the viewer's relationship to the post for both the owner
    // and another user without relying on the removed post detail page.
    $this
        ->actingAs($owner)
        ->get(route('posts.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('posts/index')
            ->where('posts.data.0.can.update', true)
            ->where('posts.data.0.can.delete', true)
        );

    $this
        ->actingAs($otherUser)
        ->get(route('posts.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('posts/index')
            ->where('posts.data.0.can.update', false)
            ->where('posts.data.0.can.delete', false)
        );
});
