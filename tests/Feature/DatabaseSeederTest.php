<?php

use App\Models\Post;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

test('every seeded post references an image that exists on disk', function () {
    Storage::fake('public');

    $this->seed(DatabaseSeeder::class);

    $posts = Post::all();

    expect($posts)->not->toBeEmpty();

    $posts->each(function (Post $post) {
        Storage::disk('public')->assertExists($post->image_path);
    });
});

test('seeding leaves uploads and other environments images alone', function () {
    Storage::fake('public');

    Storage::disk('public')->put('posts/an-upload.jpg', 'uploaded through the interface');
    Storage::disk('public')->put('posts/seed/other/placeholder.jpg', 'seeded by another environment');

    $this->seed(DatabaseSeeder::class);

    Storage::disk('public')->assertExists('posts/an-upload.jpg');
    Storage::disk('public')->assertExists('posts/seed/other/placeholder.jpg');
});

test('the factory image state writes the file it points at', function () {
    Storage::fake('public');

    $post = Post::factory()->withImage()->create();

    Storage::disk('public')->assertExists($post->image_path);
});
