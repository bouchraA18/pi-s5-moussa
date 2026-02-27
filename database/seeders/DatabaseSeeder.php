<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Matiere;
use App\Models\AnneeScolaire;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create Annee Scolaire
        $annee = AnneeScolaire::create([
            'libelle' => '2023-2024',
            'date_debut' => '2023-09-01',
            'date_fin' => '2024-06-30',
            'is_active' => true,
        ]);

        // 2. Create Enseignant
        User::create([
            'name' => 'Professeur Moussa',
            'nom' => 'Moussa',
            'prenom' => 'Jean',
            'email' => 'moussa@ecole.edu',
            'password' => Hash::make('password123'),
            'role' => 'ENSEIGNANT',
        ]);

        // 3. Create Agent Scolarite
        User::create([
            'name' => 'Agent Scolarité',
            'nom' => 'Scolarite',
            'prenom' => 'Marie',
            'email' => 'agent@ecole.edu',
            'password' => Hash::make('password123'),
            'role' => 'AGENT_SCOLARITE',
        ]);

        // 4. Create Matieres
        Matiere::create([
            'code' => 'GEN101',
            'nom' => 'Génie Logiciel',
            'description' => 'Introduction au génie logiciel',
            'niveau' => 'L3',
            'semestre' => 1,
            'nombre_heures_prevu' => 45,
        ]);

        Matiere::create([
            'code' => 'ALG201',
            'nom' => 'Algorithmique',
            'description' => 'Algorithmes complexes et structures de données',
            'niveau' => 'L3',
            'semestre' => 2,
            'nombre_heures_prevu' => 30,
        ]);
    }
}
