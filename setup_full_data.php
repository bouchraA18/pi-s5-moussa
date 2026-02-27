<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use App\Models\User;
use App\Models\Matiere;
use App\Models\AnneeScolaire;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

echo "----- DÉBUT DU SETUP COMPLET -----\n";

// 1. TABLE USERS
if (!Schema::hasTable('users')) {
    echo "Création de la table 'users'...\n";
    Schema::create('users', function (Blueprint $table) {
        $table->id();
        $table->string('name');
        $table->string('email')->unique();
        $table->timestamp('email_verified_at')->nullable();
        $table->string('password');
        $table->rememberToken();
        $table->timestamps();
        $table->string('nom')->nullable();
        $table->string('prenom')->nullable();
        $table->string('telephone')->nullable();
        $table->enum('role', ['ENSEIGNANT', 'AGENT_SCOLARITE', 'ADMINISTRATEUR'])->default('ENSEIGNANT');
    });
}

// 2. TABLE MATIERES
if (!Schema::hasTable('matieres')) {
    echo "Création de la table 'matieres'...\n";
    Schema::create('matieres', function (Blueprint $table) {
        $table->id();
        $table->string('code')->unique();
        $table->string('nom');
        $table->text('description')->nullable();
        $table->string('niveau');
        $table->integer('semestre');
        $table->string('filiale')->nullable();
        $table->integer('credit')->nullable();
        $table->float('nombre_heures_prevu');
        $table->timestamps();
    });
}

// 3. TABLE ANNEE SCOLAIRES
if (!Schema::hasTable('annee_scolaires')) {
    echo "Création de la table 'annee_scolaires'...\n";
    Schema::create('annee_scolaires', function (Blueprint $table) {
        $table->id();
        $table->string('libelle');
        $table->date('date_debut');
        $table->date('date_fin');
        $table->boolean('is_active')->default(true);
        $table->timestamps();
    });
}

// 4. TABLE SESSIONS (Pointages)
if (!Schema::hasTable('sessions')) {
    echo "Création de la table 'sessions'...\n";
    Schema::create('sessions', function (Blueprint $table) {
        $table->id();
        $table->foreignId('enseignant_id')->constrained('users');
        $table->foreignId('matiere_id')->constrained('matieres');
        $table->foreignId('annee_scolaire_id')->constrained('annee_scolaires');
        $table->date('date');
        $table->time('heure_debut');
        $table->time('heure_fin');
        $table->float('duree'); // En heures
        $table->enum('type_seance', ['CM', 'TD', 'TP']);
        $table->enum('statut', ['EN_ATTENTE', 'APPROUVE', 'REJETE'])->default('EN_ATTENTE');
        $table->text('motif_rejet')->nullable();
        $table->timestamp('date_validation')->nullable(); 
        $table->timestamps();
    });
}

// --- INSERTION DES DONNÉES ---

// Année Scolaire
if (AnneeScolaire::count() == 0) {
    AnneeScolaire::create([
        'libelle' => '2025-2026',
        'date_debut' => '2025-09-01',
        'date_fin' => '2026-06-30',
        'is_active' => true,
    ]);
    echo "Année scolaire créée.\n";
}

// Enseignant
$profEmail = 'prof@test.com';
if (!User::where('email', $profEmail)->exists()) {
    User::create([
        'name' => 'Nouveau Professeur',
        'nom' => 'Dupont',
        'prenom' => 'Jean',
        'email' => $profEmail,
        'password' => Hash::make('password123'),
        'role' => 'ENSEIGNANT',
    ]);
    echo "Enseignant créé : $profEmail / password123\n";
} else {
    // Force update password just in case
    $u = User::where('email', $profEmail)->first();
    $u->password = Hash::make('password123');
    $u->save();
    echo "Enseignant existant ($profEmail), mot de passe réinitialisé à 'password123'.\n";
}

// Agent
$agentEmail = 'agent@test.com';
if (!User::where('email', $agentEmail)->exists()) {
    User::create([
        'name' => 'Agent Scolarité',
        'nom' => 'Martin',
        'prenom' => 'Sophie',
        'email' => $agentEmail,
        'password' => Hash::make('password123'),
        'role' => 'AGENT_SCOLARITE',
    ]);
    echo "Agent créé : $agentEmail / password123\n";
}

// Matières
$matieres = [
    ['code' => 'JAVA', 'nom' => 'Programmation Java', 'niveau' => 'L3', 'semestre' => 1, 'nombre_heures_prevu' => 40],
    ['code' => 'WEB', 'nom' => 'Développement Web', 'niveau' => 'L3', 'semestre' => 1, 'nombre_heures_prevu' => 35],
    ['code' => 'MATH', 'nom' => 'Mathématiques', 'niveau' => 'L3', 'semestre' => 2, 'nombre_heures_prevu' => 30],
];

foreach ($matieres as $m) {
    Matiere::firstOrCreate(['code' => $m['code']], $m);
}
echo "Matières insérées.\n";

echo "----- SETUP TERMINÉ AVEC SUCCÈS -----\n";
