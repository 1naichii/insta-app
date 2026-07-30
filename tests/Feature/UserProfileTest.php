<?php

use App\Models\Like;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('guest is redirected to login', function () {
    $user = User::factory()->create();

    $response = $this->get(route('profile.show', $user));

    $response->assertRedirect(route('login'));
});

test('an unknown username returns 404', function () {
    $viewer = User::factory()->create();

    $response = $this->actingAs($viewer)->get('/@unknown-user');

    $response->assertNotFound();
});

test('a user can view another user\'s profile by username', function () {
    $viewer = User::factory()->create();
    $profileOwner = User::factory()->create(['username' => 'janedoe']);

    $response = $this->actingAs($viewer)->get(route('profile.show', $profileOwner));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        // `false` skips Inertia's "component file exists on disk" check:
        // resources/js/pages/profile/show.tsx is added by a follow-up
        // frontend task and does not exist yet.
        ->component('profile/show')
        ->where('profile.id', $profileOwner->id)
        ->where('profile.username', 'janedoe')
    );
});

test('the profile shows that user\'s posts newest first', function () {
    $viewer = User::factory()->create();
    $profileOwner = User::factory()->create();

    $older = Post::factory()->for($profileOwner)->create(['created_at' => now()->subDay()]);
    $newer = Post::factory()->for($profileOwner)->create(['created_at' => now()]);

    $response = $this->actingAs($viewer)->get(route('profile.show', $profileOwner));

    $response->assertInertia(fn (Assert $page) => $page
        ->component('profile/show')
        ->where('posts.data.0.id', $newer->id)
        ->where('posts.data.1.id', $older->id)
    );
});

test('the profile does not show other users\' posts', function () {
    $viewer = User::factory()->create();
    $profileOwner = User::factory()->create();
    $otherUser = User::factory()->create();

    $ownPost = Post::factory()->for($profileOwner)->create();
    Post::factory()->for($otherUser)->create();

    $response = $this->actingAs($viewer)->get(route('profile.show', $profileOwner));

    $response->assertInertia(fn (Assert $page) => $page
        ->component('profile/show')
        ->has('posts.data', 1)
        ->where('posts.data.0.id', $ownPost->id)
    );
});

test('is_own_profile is true on your own profile', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('profile.show', $user));

    $response->assertInertia(fn (Assert $page) => $page
        ->component('profile/show')
        ->where('profile.is_own_profile', true)
    );
});

test('is_own_profile is false on someone else\'s profile', function () {
    $viewer = User::factory()->create();
    $profileOwner = User::factory()->create();

    $response = $this->actingAs($viewer)->get(route('profile.show', $profileOwner));

    $response->assertInertia(fn (Assert $page) => $page
        ->component('profile/show')
        ->where('profile.is_own_profile', false)
    );
});

test('posts_count and likes_received_count are correct', function () {
    $viewer = User::factory()->create();
    $profileOwner = User::factory()->create();

    $firstPost = Post::factory()->for($profileOwner)->create();
    $secondPost = Post::factory()->for($profileOwner)->create();
    Post::factory()->for(User::factory())->create();

    Like::factory()->for(User::factory())->for($firstPost)->create();
    Like::factory()->for(User::factory())->for($firstPost)->create();
    Like::factory()->for(User::factory())->for($secondPost)->create();

    $response = $this->actingAs($viewer)->get(route('profile.show', $profileOwner));

    $response->assertInertia(fn (Assert $page) => $page
        ->component('profile/show')
        ->where('profile.posts_count', 2)
        ->where('profile.likes_received_count', 3)
    );
});

test('the profile page loads without an N plus one query', function () {
    $viewer = User::factory()->create();
    $profileOwner = User::factory()->create();
    $posts = Post::factory()->count(3)->for($profileOwner)->create();
    Like::factory()->for($viewer)->for($posts->first())->create();

    DB::enableQueryLog();

    $this->actingAs($viewer)->get(route('profile.show', $profileOwner))->assertOk();

    $queries = collect(DB::getQueryLog())
        ->pluck('query')
        ->filter(fn (string $query) => str_starts_with(strtolower(ltrim($query)), 'select'));

    // 1: user lookup (route model binding).
    // 2: combined posts_count + likes_received_count aggregate query.
    // 3: pagination total count query.
    // 4: paginated posts (with likes/comments counts and the liked_by_user
    //    exists subquery baked into the same select).
    // 5: eager loaded "user" relation for the posts on this page.
    expect($queries)->toHaveCount(5);
});
