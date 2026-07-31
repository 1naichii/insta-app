<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileDeleteRequest;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();
        $previousAvatarPath = $user->avatar;

        $attributes = collect($request->validated())->except('avatar')->all();

        $newAvatarPath = null;

        if ($request->hasFile('avatar')) {
            $newAvatarPath = $request->file('avatar')->store('avatars', 'public');

            if ($newAvatarPath === false) {
                throw new \RuntimeException('Failed to store profile avatar.');
            }
        }

        try {
            DB::transaction(function () use ($user, $attributes, $newAvatarPath): void {
                $user->fill($attributes);

                if ($newAvatarPath !== null) {
                    $user->avatar = $newAvatarPath;
                }

                if ($user->isDirty('email')) {
                    $user->email_verified_at = null;
                }

                $user->save();
            });
        } catch (\Throwable $e) {
            if ($newAvatarPath !== null) {
                Storage::disk('public')->delete($newAvatarPath);
            }

            throw $e;
        }

        if ($newAvatarPath !== null && $previousAvatarPath !== null) {
            Storage::disk('public')->delete($previousAvatarPath);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Profile updated.')]);

        return to_route('profile.edit');
    }

    /**
     * Delete the user's profile.
     */
    public function destroy(ProfileDeleteRequest $request): RedirectResponse
    {
        $user = $request->user();
        $mediaPaths = array_values(array_filter([
            $user->avatar,
            ...$user->posts()->pluck('image_path')->all(),
        ]));

        Auth::logout();

        DB::transaction(function () use ($user): void {
            $user->delete();
        });

        if ($mediaPaths !== [] && ! Storage::disk('public')->delete($mediaPaths)) {
            Log::warning('Failed to delete account media.', [
                'user_id' => $user->getKey(),
                'media_count' => count($mediaPaths),
            ]);
        }

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
