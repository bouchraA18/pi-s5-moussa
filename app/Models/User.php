<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Contracts\Auth\CanResetPassword as CanResetPasswordContract;
use Illuminate\Auth\Passwords\CanResetPassword;
use App\Notifications\ResetPasswordNotification;

class User extends Authenticatable implements CanResetPasswordContract
{
    use HasApiTokens, HasFactory, Notifiable, CanResetPassword;

    protected $fillable = [
        'name',
        'nom',
        'prenom',
        'telephone',
        'role',
        'email',
        'password',
    ];

    public function sessions()
    {
        return $this->hasMany(Session::class, 'enseignant_id');
    }

    public function matieres()
    {
        return $this->belongsToMany(Matiere::class, 'teacher_matieres', 'teacher_id', 'matiere_id')
            ->withTimestamps();
    }

    public function schedules()
    {
        return $this->hasMany(Schedule::class, 'enseignant_id');
    }

    public function expoPushTokens()
    {
        return $this->hasMany(ExpoPushToken::class);
    }

    public function sendPasswordResetNotification($token)
    {
        $this->notify(new ResetPasswordNotification($token));
    }
}
