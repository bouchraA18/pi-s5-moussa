<?php
use App\Models\Matiere;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Clear existing to avoid duplicates if any partial seed existed
// Matiere::truncate(); // Risky if they added data, let's use firstOrCreate

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
    Matiere::firstOrCreate(['code' => $m['code']], $m);
    echo "Matière ajoutée : " . $m['nom'] . "\n";
}

echo "\nTotal matières : " . Matiere::count() . "\n";
