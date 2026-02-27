<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Session extends Model
{
    use HasFactory;

    protected $fillable = [
        'date',
        'heure_debut',
        'heure_fin',
        'duree',
        'type_seance',
        'statut',
        'motif_rejet',
        'enseignant_id',
        'matiere_id',
        'annee_scolaire_id',
        'date_validation',
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
