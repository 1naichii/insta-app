<?php

namespace Database\Factories;

use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * @extends Factory<Post>
 */
class PostFactory extends Factory
{
    /**
     * The size, in pixels, of the image written by the `withImage` state.
     * Deliberately far smaller than the seeder's 800px placeholders: tests
     * only need the file to exist and decode.
     */
    private const int IMAGE_SIZE = 64;

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

    /**
     * Indicate that the post's image really exists on the public disk.
     *
     * The default state only invents a path, which is enough for tests about
     * ownership, captions or counts but serves a 404 wherever the file is
     * actually requested. Anything that looks at the rendered image needs
     * this state instead.
     */
    public function withImage(): static
    {
        return $this->state(function (array $attributes): array {
            $path = 'posts/'.Str::random(20).'.jpg';

            Storage::disk('public')->put($path, $this->generateImage());

            return ['image_path' => $path];
        });
    }

    /**
     * Draw a plain JPEG with GD, the same offline approach the seeder uses,
     * so building a post never depends on a network call or on a fixture
     * file that would have to be kept in the repository. The canvas is left
     * at its default fill because nothing looks at the pixels: what matters
     * is that a decodable file sits where `image_path` says it does.
     */
    private function generateImage(): string
    {
        $image = imagecreatetruecolor(self::IMAGE_SIZE, self::IMAGE_SIZE);

        ob_start();
        imagejpeg($image, null, 85);

        return (string) ob_get_clean();
    }
}
