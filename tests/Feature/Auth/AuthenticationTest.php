<?php

namespace Tests\Feature\Auth;

use App\Models\Post;
use App\Models\User;
use Illuminate\Cache\RateLimiting\Unlimited;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Laravel\Fortify\Features;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_screen_can_be_rendered()
    {
        $response = $this->get(route('login'));

        $response->assertOk();
    }

    public function test_users_can_authenticate_using_the_login_screen()
    {
        $user = User::factory()->create();

        $response = $this->post(route('login.store'), [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_users_with_two_factor_enabled_are_redirected_to_two_factor_challenge()
    {
        $this->skipUnlessFortifyHas(Features::twoFactorAuthentication());

        Features::twoFactorAuthentication([
            'confirm' => true,
            'confirmPassword' => true,
        ]);

        $user = User::factory()->withTwoFactor()->create();

        $response = $this->post(route('login'), [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertRedirect(route('two-factor.login'));
        $response->assertSessionHas('login.id', $user->id);
        $this->assertGuest();
    }

    public function test_users_can_not_authenticate_with_invalid_password()
    {
        $user = User::factory()->create();

        $response = $this->post(route('login.store'), [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $response->assertSessionHasErrors([
            'email' => __('auth.failed'),
        ]);
        $this->assertGuest();
    }

    public function test_unknown_email_receives_the_same_generic_credentials_error()
    {
        $response = $this->post(route('login.store'), [
            'email' => 'unknown@example.com',
            'password' => 'wrong-password',
        ]);

        $response->assertSessionHasErrors([
            'email' => __('auth.failed'),
        ]);
        $this->assertGuest();
    }

    public function test_users_can_logout()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post(route('logout'));

        $response->assertRedirect(route('home'));

        $this->assertGuest();
    }

    public function test_users_are_rate_limited()
    {
        $user = User::factory()->create();

        RateLimiter::increment(md5('login'.implode('|', [$user->email, '127.0.0.1'])), amount: 5);

        $response = $this->post(route('login.store'), [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $response->assertTooManyRequests();
    }

    public function test_users_are_not_rate_limited_in_the_e2e_environment()
    {
        $environment = app()->environment();
        $limiter = RateLimiter::limiter('login');
        $this->assertNotNull($limiter);

        app()->detectEnvironment(fn () => 'e2e');

        try {
            $limit = $limiter(Request::create('/login', 'POST', [
                'email' => 'demo@instaapp.test',
            ]));

            $this->assertInstanceOf(Unlimited::class, $limit);
        } finally {
            app()->detectEnvironment(fn () => $environment);
        }
    }

    #[DataProvider('protectedPageRoutes')]
    public function test_guests_are_redirected_to_login_from_protected_pages(string $routeName, ?string $parameterType)
    {
        $routeParameter = match ($parameterType) {
            'post' => Post::factory()->create(),
            'user' => User::factory()->create(),
            default => [],
        };

        $response = $this->get(route($routeName, $routeParameter));

        $response->assertRedirect(route('login'));
    }

    /**
     * @return array<string, array{string, string|null}>
     */
    public static function protectedPageRoutes(): array
    {
        return [
            'feed' => ['posts.index', null],
            'create post' => ['posts.create', null],
            'post comments' => ['posts.comments.index', 'post'],
            'profile settings' => ['profile.edit', null],
            'public profile' => ['profile.show', 'user'],
        ];
    }
}
