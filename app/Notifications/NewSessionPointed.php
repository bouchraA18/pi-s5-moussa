<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;

class NewSessionPointed extends Notification
{
    use Queueable;

    protected $session;

    public function __construct($session)
    {
        $this->session = $session;
    }

    public function via($notifiable)
    {
        return ['database'];
    }

    public function toArray($notifiable)
    {
        return [
            'type' => 'new_session',
            'session_id' => $this->session->id,
            'message' => "Nouvel émargement de " . $this->session->teacher->name,
            'details' => $this->session->matiere->nom . ' (' . $this->session->type_seance . ')',
            'time' => now()->toIso8601String()
        ];
    }
}
