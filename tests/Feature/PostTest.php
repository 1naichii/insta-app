<?php

use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Event;
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

test('a failed post insert rolls back the row and removes the uploaded image', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $image = UploadedFile::fake()->image('photo.jpg');

    Event::listen(QueryExecuted::class, function (QueryExecuted $query): void {
        if (str_starts_with(strtolower(ltrim($query->sql)), 'insert into "posts"')) {
            throw new RuntimeException('Forced post insert failure.');
        }
    });

    try {
        $this->withoutExceptionHandling();

        expect(fn () => $this
            ->actingAs($user)
            ->post(route('posts.store'), [
                'caption' => 'This must roll back',
                'image' => $image,
            ]))->toThrow(RuntimeException::class, 'Forced post insert failure.');
    } finally {
        Event::forget(QueryExecuted::class);
    }

    expect(Post::count())->toBe(0)
        ->and(Storage::disk('public')->allFiles('posts'))->toBeEmpty();
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

test('owner can update a post', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $post = Post::factory()->for($user)->create(['caption' => 'Old caption']);
    $image = UploadedFile::fake()->image('new.jpg');

    $response = $this
        ->actingAs($user)
        ->patch(route('posts.update', $post), [
            'caption' => 'New caption',
            'image' => $image,
        ]);

    $response->assertRedirect(route('posts.show', $post));

    $post->refresh();
    expect($post->caption)->toBe('New caption');
    Storage::disk('public')->assertExists($post->image_path);
});

test('a failed post update removes the new image and keeps the original image path', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $post = Post::factory()->for($user)->create();
    $originalImagePath = $post->image_path;
    Storage::disk('public')->put($originalImagePath, 'original-image-content');

    Event::listen(QueryExecuted::class, function (QueryExecuted $query): void {
        if (str_starts_with(strtolower(ltrim($query->sql)), 'update "posts"')) {
            throw new RuntimeException('Forced post update failure.');
        }
    });

    try {
        $this->withoutExceptionHandling();

        expect(fn () => $this
            ->actingAs($user)
            ->patch(route('posts.update', $post), [
                'caption' => 'This must roll back',
                'image' => UploadedFile::fake()->image('replacement.jpg'),
            ]))->toThrow(RuntimeException::class, 'Forced post update failure.');
    } finally {
        Event::forget(QueryExecuted::class);
    }

    expect($post->refresh()->image_path)->toBe($originalImagePath)
        ->and($post->caption)->not->toBe('This must roll back')
        ->and(Storage::disk('public')->allFiles('posts'))->toBe([$originalImagePath]);
});

test('owner can update only the caption without re-uploading an image', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $post = Post::factory()->for($user)->create(['caption' => 'Old caption']);
    $originalImagePath = $post->image_path;
    Storage::disk('public')->put($originalImagePath, 'fake-image-content');

    $response = $this
        ->actingAs($user)
        ->patch(route('posts.update', $post), [
            'caption' => 'New caption',
        ]);

    $response->assertRedirect(route('posts.show', $post));

    $post->refresh();
    expect($post->caption)->toBe('New caption');
    expect($post->image_path)->toBe($originalImagePath);
    Storage::disk('public')->assertExists($originalImagePath);
});

test('replacing the image deletes the previous file from disk', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $post = Post::factory()->for($user)->create();
    $originalImagePath = $post->image_path;
    Storage::disk('public')->put($originalImagePath, 'fake-image-content');
    $newImage = UploadedFile::fake()->image('new.jpg');

    $this
        ->actingAs($user)
        ->patch(route('posts.update', $post), [
            'image' => $newImage,
        ]);

    $post->refresh();
    expect($post->image_path)->not->toBe($originalImagePath);
    Storage::disk('public')->assertMissing($originalImagePath);
    Storage::disk('public')->assertExists($post->image_path);
});

test('replacing only the image keeps the existing caption', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $post = Post::factory()->for($user)->create(['caption' => 'Keep me']);

    $this
        ->actingAs($user)
        ->patch(route('posts.update', $post), [
            'image' => UploadedFile::fake()->image('new.jpg'),
        ]);

    expect($post->refresh()->caption)->toBe('Keep me');
});

test('submitting an empty caption clears it', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $post = Post::factory()->for($user)->create(['caption' => 'Remove me']);

    $this
        ->actingAs($user)
        ->patch(route('posts.update', $post), [
            'caption' => '',
        ]);

    expect($post->refresh()->caption)->toBeNull();
});

test('owner can delete a post', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $post = Post::factory()->for($user)->create();

    $response = $this
        ->actingAs($user)
        ->delete(route('posts.destroy', $post));

    $response->assertRedirect(route('posts.index'));

    expect(Post::find($post->id))->toBeNull();
});

test('deleting a post removes its image file from disk', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $post = Post::factory()->for($user)->create();
    $imagePath = $post->image_path;
    Storage::disk('public')->put($imagePath, 'fake-image-content');

    $this
        ->actingAs($user)
        ->delete(route('posts.destroy', $post));

    Storage::disk('public')->assertMissing($imagePath);
});
