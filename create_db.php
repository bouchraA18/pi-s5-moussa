<?php
$host = '127.0.0.1';
$user = 'postgres';
$pass = 'admin123';
try {
    $pdo = new PDO("pgsql:host=$host", $user, $pass);
    $pdo->exec('CREATE DATABASE suivi_enseignements');
    echo "Database created successfully\n";
} catch (PDOException $e) {
    if ($e->getCode() == '42P04') {
        echo "Database already exists\n";
    } else {
        echo "Error: " . $e->getMessage() . "\n";
    }
}
