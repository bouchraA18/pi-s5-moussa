<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;

class SessionStatusUpdated extends Notification
{
    use Queueable;

    protected $session;
    protected $status;

    public function __construct($session, $status)
    {
        $this->session = $session;
        $this->status = $status;
    }

    public function via($notifiable)
    {
        return ['database', 'mail'];
    }

    public function toMail($notifiable)
    {
        $matiere = $this->session->matiere->nom;
        $date = date('d/m/Y', strtotime($this->session->date));
        $heures = $this->session->heure_debut . ' - ' . $this->session->heure_fin;
        $duree = $this->session->duree . 'h';

        if ($this->status === 'APPROUVE') {
            return (new MailMessage)
                ->subject("✅ Séance Approuvée - {$matiere} - {$date}")
                ->greeting("Bonjour {$notifiable->name},")
                ->line("Nous avons le plaisir de vous informer que votre séance a été **approuvée** par l'agent de scolarité.")
                ->line("**Détails de la séance :**")
                ->line("📚 **Matière :** {$matiere}")
                ->line("📅 **Date :** {$date}")
                ->line("🕐 **Horaires :** {$heures}")
                ->line("⏱️ **Durée :** {$duree}")
                ->line("✅ **Validée le :** " . now()->format('d/m/Y à H:i'))
                ->line("Merci pour votre engagement !")
                ->salutation("Cordialement, L'équipe ClassTrack");
        } else {
            $motif = $this->session->motif_rejet ?? 'Aucun motif spécifié';
            
            return (new MailMessage)
                ->subject("❌ Séance Rejetée - {$matiere} - {$date}")
                ->greeting("Bonjour {$notifiable->name},")
                ->line("Nous vous informons que votre séance a été **rejetée** par l'agent de scolarité.")
                ->line("**Détails de la séance :**")
                ->line("📚 **Matière :** {$matiere}")
                ->line("📅 **Date :** {$date}")
                ->line("🕐 **Horaires :** {$heures}")
                ->line("⏱️ **Durée :** {$duree}")
                ->line("---")
                ->line("**Motif du rejet :**")
                ->line("❗ {$motif}")
                ->line("---")
                ->line("Vous pouvez soumettre une nouvelle séance corrigée via votre tableau de bord.")
                ->action('Accéder au tableau de bord', url('/teacher-dashboard'))
                ->salutation("Cordialement, L'équipe ClassTrack");
        }
    }

    public function toArray($notifiable)
    {
        $statusText = $this->status === 'APPROUVE' ? 'validée' : 'rejetée';
        return [
            'type' => 'status_update',
            'session_id' => $this->session->id,
            'status' => $this->status,
            'message' => "Votre séance a été " . $statusText,
            'details' => $this->session->matiere->nom . ' - ' . date('d/m/Y', strtotime($this->session->date)),
            'time' => now()->toIso8601String()
        ];
    }
}
