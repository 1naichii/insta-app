<?php

namespace Database\Seeders;

use App\Models\Comment;
use App\Models\Like;
use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * The size, in pixels, of every generated placeholder image.
     */
    private const int PLACEHOLDER_IMAGE_SIZE = 800;

    /**
     * Base colours used to tint the generated placeholder images so the
     * seeded feed shows visually distinct posts.
     *
     * @var list<array{int, int, int}>
     */
    private const array PLACEHOLDER_COLORS = [
        [236, 72, 153],
        [99, 102, 241],
        [14, 165, 233],
        [16, 185, 129],
        [245, 158, 11],
        [239, 68, 68],
    ];

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->resetPostImageDirectory();

        $demoUsers = [
            User::factory()->create([
                'name' => 'Demo User',
                'username' => 'demo',
                'email' => 'demo@instaapp.test',
                'email_verified_at' => now(),
            ]),
            User::factory()->create([
                'name' => 'Sarah Wijaya',
                'username' => 'sarah',
                'email' => 'sarah@instaapp.test',
                'email_verified_at' => now(),
            ]),
        ];

        $randomUsers = User::factory(fake()->numberBetween(6, 8))->create();

        $users = collect($demoUsers)->concat($randomUsers);

        $postCount = fake()->numberBetween(12, 15);

        $posts = collect(range(0, $postCount - 1))->map(function (int $index) use ($users) {
            return Post::factory()->create([
                'user_id' => $users->random()->id,
                'image_path' => $this->storePlaceholderImage($index),
            ]);
        });

        // Random likes across posts, respecting the unique (user_id, post_id) constraint.
        $posts->each(function (Post $post) use ($users) {
            $likers = $users->random(min($users->count(), fake()->numberBetween(0, 8)));

            collect($likers)->each(function (User $user) use ($post) {
                Like::factory()->create([
                    'user_id' => $user->id,
                    'post_id' => $post->id,
                ]);
            });
        });

        // Random comments across posts.
        $posts->each(function (Post $post) use ($users) {
            $commentCount = fake()->numberBetween(0, 5);

            collect(range(1, $commentCount))->each(function () use ($post, $users) {
                Comment::factory()->create([
                    'user_id' => $users->random()->id,
                    'post_id' => $post->id,
                ]);
            });
        });
    }

    /**
     * The directory holding the placeholder images of the environment
     * currently being seeded.
     *
     * Every environment points at the same `storage/app/public` directory
     * while using its own database, so a single shared directory would make
     * seeding one environment destroy images another environment's database
     * still references. Giving each environment its own subdirectory keeps
     * the reset below destructive only to the data it just replaced.
     */
    private function seedImageDirectory(): string
    {
        return 'posts/seed/'.app()->environment();
    }

    /**
     * Remove any previously seeded post images and recreate an empty
     * directory so repeated seeding doesn't accumulate junk files.
     *
     * Only this environment's own subdirectory is cleared: images uploaded
     * through the interface live directly under `posts/` and every other
     * environment keeps its placeholders elsewhere, so neither is lost.
     */
    private function resetPostImageDirectory(): void
    {
        Storage::disk('public')->deleteDirectory($this->seedImageDirectory());
        Storage::disk('public')->makeDirectory($this->seedImageDirectory());
    }

    /**
     * Write an offline placeholder JPEG to the public disk and return its
     * relative path, ready to be stored on a post's `image_path` column.
     */
    private function storePlaceholderImage(int $index): string
    {
        $path = $this->seedImageDirectory().'/'.Str::random(20).'.jpg';

        Storage::disk('public')->put($path, $this->generatePlaceholderImage($index));

        return $path;
    }

    /**
     * Draw a gradient placeholder JPEG with a caption label. The image is
     * generated locally with GD so seeding never needs a network connection
     * and produces the same result on any machine.
     */
    private function generatePlaceholderImage(int $index): string
    {
        $size = self::PLACEHOLDER_IMAGE_SIZE;
        $image = imagecreatetruecolor($size, $size);

        [$red, $green, $blue] = self::PLACEHOLDER_COLORS[$index % count(self::PLACEHOLDER_COLORS)];

        for ($y = 0; $y < $size; $y++) {
            $shade = 1 - ($y / $size) * 0.55;

            $color = imagecolorallocate(
                $image,
                (int) round($red * $shade),
                (int) round($green * $shade),
                (int) round($blue * $shade),
            );

            imageline($image, 0, $y, $size, $y, $color);
        }

        $this->drawLabel($image, 'InstaApp #'.($index + 1));

        ob_start();
        imagejpeg($image, null, 85);

        return (string) ob_get_clean();
    }

    /**
     * Stamp a centred label onto the image. GD's bitmap fonts are tiny, so the
     * text is drawn small and then scaled up, which keeps the seeder free of
     * any TrueType font file that would differ between machines.
     */
    private function drawLabel(\GdImage $image, string $text): void
    {
        $font = 5;
        $width = imagefontwidth($font) * strlen($text);
        $height = imagefontheight($font);

        $layer = imagecreatetruecolor($width, $height);
        imagealphablending($layer, false);
        imagesavealpha($layer, true);
        imagefill($layer, 0, 0, imagecolorallocatealpha($layer, 0, 0, 0, 127));
        imagestring($layer, $font, 0, 0, $text, imagecolorallocate($layer, 255, 255, 255));

        $scale = 4;
        $size = imagesx($image);

        imagecopyresampled(
            $image,
            $layer,
            (int) (($size - $width * $scale) / 2),
            (int) (($size - $height * $scale) / 2),
            0,
            0,
            $width * $scale,
            $height * $scale,
            $width,
            $height,
        );
    }
}
