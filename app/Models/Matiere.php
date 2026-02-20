<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Matiere extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'nom',
        'description',
        'niveau',
        'semestre',
        'filiale',
        'credit',
        'nombre_heures_prevu',
    ];

    public function sessions()
    {
        return $this->hasMany(Session::class);
    }
}
