<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Fortify\Features;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->skipUnlessFortifyHas(Features::registration());
    }

    public function test_registration_screen_can_be_rendered()
    {
        $response = $this->get(route('register'));

        $response->assertOk();
    }

    public function test_new_users_can_register()
    {
        $response = $this->post(route('register.store'), [
            'name' => 'Test User',
            'username' => 'testuser',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_registration_requires_name_username_email_and_password()
    {
        $response = $this->post(route('register.store'), []);

        $response->assertSessionHasErrors(['name', 'username', 'email', 'password']);
        $this->assertGuest();
        $this->assertDatabaseCount('users', 0);
    }

    public function test_registration_rejects_a_duplicate_email()
    {
        $existingUser = User::factory()->create();

        $response = $this->post(route('register.store'), [
            'name' => 'Test User',
            'username' => 'differentuser',
            'email' => $existingUser->email,
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertGuest();
        $this->assertDatabaseCount('users', 1);
    }

    public function test_registration_rejects_a_duplicate_username()
    {
        $existingUser = User::factory()->create();

        $response = $this->post(route('register.store'), [
            'name' => 'Test User',
            'username' => $existingUser->username,
            'email' => 'different@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response->assertSessionHasErrors('username');
        $this->assertGuest();
        $this->assertDatabaseCount('users', 1);
    }

    public function test_registration_rejects_a_username_with_invalid_characters()
    {
        $response = $this->post(route('register.store'), [
            'name' => 'Test User',
            'username' => 'Invalid Username!',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response->assertSessionHasErrors('username');
        $this->assertGuest();
        $this->assertDatabaseCount('users', 0);
    }

    public function test_registration_rejects_a_username_longer_than_fifty_characters()
    {
        $response = $this->post(route('register.store'), [
            'name' => 'Test User',
            'username' => str_repeat('a', 51),
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response->assertSessionHasErrors('username');
        $this->assertGuest();
        $this->assertDatabaseCount('users', 0);
    }

    public function test_registration_requires_matching_password_confirmation()
    {
        $response = $this->post(route('register.store'), [
            'name' => 'Test User',
            'username' => 'testuser',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'different-password',
        ]);

        $response->assertSessionHasErrors('password');
        $this->assertGuest();
        $this->assertDatabaseCount('users', 0);
    }
}
