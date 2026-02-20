<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use App\Models\Matiere;

echo "Début de la réparation forcée des matières...\n";

// 1. Force Create Table if not exists (Bypassing Migration Table Check)
if (!Schema::hasTable('matieres')) {
    echo "La table 'matieres' n'existe pas. Création en cours...\n";
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
    echo "Table 'matieres' créée avec succès.\n";
} else {
    echo "La table 'matieres' existe déjà.\n";
}

// 2. Insert Data
$matieres = [
    [
        'code' => 'GEN101',
        'nom' => 'Génie Logiciel',
        'description' => 'Introduction au génie logiciel',
        'niveau' => 'L3',
        'semestre' => 1,
        'nombre_heures_prevu' => 45,
    ],
    [
        'code' => 'ALG201',
        'nom' => 'Algorithmique Avancée',
        'description' => 'Structures de données et complexité',
        'niveau' => 'L3',
        'semestre' => 2,
        'nombre_heures_prevu' => 30,
    ],
    [
        'code' => 'BDD301',
        'nom' => 'Bases de Données',
        'description' => 'SQL et modélisation relationnelle',
        'niveau' => 'L3',
        'semestre' => 1,
        'nombre_heures_prevu' => 40,
    ],
    [
        'code' => 'RES401',
        'nom' => 'Réseaux Informatiques',
        'description' => 'Architecture TCP/IP',
        'niveau' => 'L3',
        'semestre' => 2,
        'nombre_heures_prevu' => 35,
    ]
];

foreach ($matieres as $m) {
    if (Matiere::where('code', $m['code'])->exists()) {
        echo "Matière {$m['nom']} déjà présente.\n";
    } else {
        Matiere::create($m);
        echo "Ajout de : " . $m['nom'] . "\n";
    }
}

echo "Opération terminée. Vous pouvez rafraîchir le dashboard.\n";
