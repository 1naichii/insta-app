<?php

namespace Database\Factories;

use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Post>
 */
class PostFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var class-string<Post>
     */
    protected $model = Post::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'caption' => fake()->sentence(),
            'image_path' => 'posts/'.Str::random(20).'.jpg',
        ];
    }

    /**
     * Indicate that the post has no caption.
     */
    public function withoutCaption(): static
    {
        return $this->state(fn (array $attributes) => [
            'caption' => null,
        ]);
    }
}
