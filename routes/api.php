<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

use App\Http\Controllers\AuthController;
use App\Http\Controllers\PointageController;
use App\Http\Controllers\MatiereController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PushTokenController;
use App\Http\Controllers\TeacherMatiereController;
use App\Http\Controllers\Api\ScheduleController;
use App\Http\Controllers\PasswordResetController;

Route::post('/login', [AuthController::class, 'login'])->name('login');
Route::post('/register', [AuthController::class, 'register']);
Route::post('/forgot-password', [PasswordResetController::class, 'sendResetLinkEmail']);
Route::post('/reset-password', [PasswordResetController::class, 'reset']);


Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'me']);
    
    Route::get('/pointages', [PointageController::class, 'index']);
    Route::post('/pointages', [PointageController::class, 'store']);
    Route::put('/pointages/{id}', [PointageController::class, 'update']);
    Route::delete('/pointages/{id}', [PointageController::class, 'destroy']);

    
    // Agent only routes (ideally with middleware)
    Route::get('/admin/stats', [PointageController::class, 'stats']);
    Route::get('/admin/pending', [PointageController::class, 'pending']);
    Route::get('/admin/validated', [PointageController::class, 'validated']);
    Route::post('/admin/approve/{id}', [PointageController::class, 'approve']);
    Route::post('/admin/reject/{id}', [PointageController::class, 'reject']);
    Route::get('/admin/export-accounting', [PointageController::class, 'exportAccounting']);
    
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);

    Route::post('/push-token', [PushTokenController::class, 'store']);

    // Teacher assignment / semester helpers
    Route::get('/teacher/semesters', [TeacherMatiereController::class, 'mySemesters']);
    Route::get('/teacher/matieres', [TeacherMatiereController::class, 'myMatieres']);

    // Agent/Admin: assign matieres to teachers by semester
    Route::get('/admin/teacher-semester-matieres', [TeacherMatiereController::class, 'getTeacherSemesterMatieres']);
    Route::put('/admin/teacher-semester-matieres', [TeacherMatiereController::class, 'syncTeacherSemesterMatieres']);
    
    // Profile routes
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::put('/profile/password', [ProfileController::class, 'updatePassword']);

    // Admin Routes
    Route::apiResource('users', \App\Http\Controllers\UserController::class);
    Route::apiResource('matieres', \App\Http\Controllers\MatiereController::class);
    
    // Schedule routes
    Route::post('/schedules/import', [ScheduleController::class, 'import']);
    Route::get('/teacher/today-schedules', [ScheduleController::class, 'getTodaySchedules']);
    Route::apiResource('schedules', ScheduleController::class);
});

