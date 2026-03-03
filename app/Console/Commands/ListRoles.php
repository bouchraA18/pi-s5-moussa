<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class ListRoles extends Command
{
    protected $signature = 'user:roles';
    protected $description = 'List available user roles';

    public function handle(): int
    {
        $this->info('Available roles (canonical values):');
        $this->line('- ENSEIGNANT (teacher)');
        $this->line('- AGENT_SCOLARITE (agent scolarité)');
        $this->line('- ADMINISTRATEUR (admin)');
        $this->newLine();

        $this->info('Aliases accepted by user:create:');
        $this->line('- teacher => ENSEIGNANT');
        $this->line('- agent, AGENT => AGENT_SCOLARITE');
        $this->line('- admin, ADMIN => ADMINISTRATEUR');

        return self::SUCCESS;
    }
}

