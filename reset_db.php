<?php
$host = '127.0.0.1';
$user = 'postgres';
$pass = 'admin123';
$dbname = 'suivi_enseignements';

try {
    $pdo = new PDO("pgsql:host=$host;dbname=postgres", $user, $pass);
    
    // Force disconnect all other sessions
    $sql = "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$dbname' AND pid <> pg_backend_pid()";
    $pdo->exec($sql);
    
    // Drop and Recreate
    $pdo->exec("DROP DATABASE IF EXISTS $dbname");
    $pdo->exec("CREATE DATABASE $dbname");
    
    echo "Database reset successfully\n";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
