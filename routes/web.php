<?php

use App\Http\Controllers\CommentController;
use App\Http\Controllers\LikeController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\UserProfileController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/login')->name('home');

Route::middleware(['auth', 'auth.session', 'verified'])->group(function () {
    Route::redirect('dashboard', '/feed')->name('dashboard');

    Route::get('feed', [PostController::class, 'index'])->name('posts.index');
    Route::get('posts/create', [PostController::class, 'create'])->name('posts.create');
    Route::post('posts', [PostController::class, 'store'])
        ->middleware('throttle:posts')
        ->name('posts.store');
    Route::get('posts/{post}/edit', [PostController::class, 'edit'])->name('posts.edit');
    Route::patch('posts/{post}', [PostController::class, 'update'])
        ->middleware('throttle:posts')
        ->name('posts.update');
    Route::delete('posts/{post}', [PostController::class, 'destroy'])->name('posts.destroy');
    Route::post('posts/{post}/likes', [LikeController::class, 'store'])
        ->middleware('throttle:likes')
        ->name('posts.likes.store');
    Route::delete('posts/{post}/likes', [LikeController::class, 'destroy'])
        ->middleware('throttle:likes')
        ->name('posts.likes.destroy');
    Route::get('posts/{post}/comments', [CommentController::class, 'index'])->name('posts.comments.index');
    Route::post('posts/{post}/comments', [CommentController::class, 'store'])
        ->middleware('throttle:comments')
        ->name('posts.comments.store');
    Route::delete('comments/{comment}', [CommentController::class, 'destroy'])->name('comments.destroy');

    Route::get('@{user:username}', [UserProfileController::class, 'show'])->name('profile.show');
});

require __DIR__.'/settings.php';
