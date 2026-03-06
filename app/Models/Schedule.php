<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Schedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'enseignant_id',
        'matiere_id',
        'jour_semaine',
        'heure_debut',
        'heure_fin',
        'type_seance',
        'groupe',
        'salle',
        'annee_scolaire_id',
    ];

    public function teacher()
    {
        return $this->belongsTo(User::class, 'enseignant_id');
    }

    public function matiere()
    {
        return $this->belongsTo(Matiere::class);
    }

    public function anneeScolaire()
    {
        return $this->belongsTo(AnneeScolaire::class);
    }
}
