<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Session extends Model
{
    use HasFactory;

    public const TEACHING_HOUR_COEFFICIENTS = [
        'CM' => 1.0,
        'TD' => 2 / 3,
        'TP' => 2 / 3,
    ];

    protected $fillable = [
        'date',
        'heure_debut',
        'heure_fin',
        'duree',
        'type_seance',
        'statut',
        'motif_rejet',
        'preuve_photo',
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

    public static function teachingHourCoefficient(?string $typeSeance): float
    {
        return self::TEACHING_HOUR_COEFFICIENTS[$typeSeance ?? ''] ?? 0.0;
    }

    public static function weightedTeachingHours(?string $typeSeance, $duration): float
    {
        return ((float) $duration) * self::teachingHourCoefficient($typeSeance);
    }
}
