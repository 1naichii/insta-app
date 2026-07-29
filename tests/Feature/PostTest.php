<?php

use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('guest cannot create a post', function () {
    $response = $this->get(route('posts.create'));

    $response->assertRedirect(route('login'));
});

test('guest cannot view the feed', function () {
    $response = $this->get(route('posts.index'));

    $response->assertRedirect(route('login'));
});

test('authenticated user can create a post', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $image = UploadedFile::fake()->image('photo.jpg');

    $response = $this
        ->actingAs($user)
        ->post(route('posts.store'), [
            'caption' => 'Hello world',
            'image' => $image,
        ]);

    $response->assertRedirect(route('posts.index'));

    $post = Post::first();

    expect($post)->not->toBeNull();
    expect($post->user_id)->toBe($user->id);
    expect($post->caption)->toBe('Hello world');

    Storage::disk('public')->assertExists($post->image_path);
});

test('post requires an image', function () {
    Storage::fake('public');

    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->post(route('posts.store'), [
            'caption' => 'Hello world',
        ]);

    $response->assertSessionHasErrors('image');
    expect(Post::count())->toBe(0);
});

test('invalid image type is rejected', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $file = UploadedFile::fake()->create('document.txt', 10, 'text/plain');

    $response = $this
        ->actingAs($user)
        ->post(route('posts.store'), [
            'image' => $file,
        ]);

    $response->assertSessionHasErrors('image');
    expect(Post::count())->toBe(0);
});

test('oversized image is rejected', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $file = UploadedFile::fake()->create('photo.jpg', 6000, 'image/jpeg');

    $response = $this
        ->actingAs($user)
        ->post(route('posts.store'), [
            'image' => $file,
        ]);

    $response->assertSessionHasErrors('image');
    expect(Post::count())->toBe(0);
});

test('caption is optional', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $image = UploadedFile::fake()->image('photo.jpg');

    $response = $this
        ->actingAs($user)
        ->post(route('posts.store'), [
            'image' => $image,
        ]);

    $response->assertSessionHasNoErrors();

    $post = Post::first();
    expect($post->caption)->toBeNull();
});

test('caption longer than 2200 characters is rejected', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $image = UploadedFile::fake()->image('photo.jpg');

    $response = $this
        ->actingAs($user)
        ->post(route('posts.store'), [
            'caption' => str_repeat('a', 2201),
            'image' => $image,
        ]);

    $response->assertSessionHasErrors('caption');
    expect(Post::count())->toBe(0);
});

test('the feed lists posts newest first', function () {
    $user = User::factory()->create();

    $older = Post::factory()->for($user)->create(['created_at' => now()->subDay()]);
    $newer = Post::factory()->for($user)->create(['created_at' => now()]);

    $response = $this->actingAs($user)->get(route('posts.index'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('posts/index')
        ->where('posts.data.0.id', $newer->id)
        ->where('posts.data.1.id', $older->id)
    );
});

test('a user can view a post detail page', function () {
    $user = User::factory()->create();
    $post = Post::factory()->for($user)->create();

    $response = $this->actingAs($user)->get(route('posts.show', $post));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('posts/show')
        ->where('post.id', $post->id)
        ->where('post.user.id', $user->id)
        ->where('post.user.username', $user->username)
        ->where('post.likes_count', 0)
        ->where('post.comments_count', 0)
        ->whereNot('post.image_url', '')
    );
});
