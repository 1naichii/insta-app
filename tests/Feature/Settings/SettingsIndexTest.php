<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('guests are redirected to login', function () {
    $this->get('/settings')->assertRedirect(route('login'));
});

test('authenticated users can view the settings index', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/settings')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('settings/index'));
});
