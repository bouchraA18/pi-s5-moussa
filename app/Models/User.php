<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

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

    public function expoPushTokens()
    {
        return $this->hasMany(ExpoPushToken::class);
    }
}
