/* import { Injectable } from '@nestjs/common';

@Injectable()
export class GoogleMeetService {
  // 🆕 Jitsi Meet - pas d'API nécessaire, juste des URLs!
  
  async createMeetingLink(interviewData: {
    title: string;
    candidateName: string;
    candidateEmail: string;
    recruiterEmail: string;
    scheduledDate: Date;
    duration: number;
  }): Promise<{
    meetLink: string;
    meetId: string;
    eventId: string;
  }> {
    try {
      console.log('🎥 Création du lien Jitsi Meet...');

      // 🆕 Générer un ID de réunion aléatoire et unique
      const meetId = `interview-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // 🆕 Créer le lien Jitsi Meet
      const meetLink = `https://meet.jitsi.org/${meetId}`;

      console.log('✅ Jitsi Meet créé:', meetLink);

      return {
        meetLink,
        meetId,
        eventId: meetId, // Jitsi n'a pas d'eventId, on utilise meetId
      };
    } catch (error: any) {
      console.error('❌ Erreur création Jitsi Meet:', error.message);
      throw error;
    }
  }

  async deleteMeeting(eventId: string): Promise<void> {
    // Jitsi Meet n'a pas besoin de suppression
    console.log('✅ Réunion Jitsi terminée');
  }
} */
import { Injectable } from '@nestjs/common';

@Injectable()
export class GoogleMeetService {
  async createMeetingLink(interviewData: {
    title: string;
    candidateName: string;
    candidateEmail: string;
    recruiterEmail: string;
    scheduledDate: Date;
    duration: number;
  }): Promise<{
    meetLink: string;
    meetId: string;
    eventId: string;
  }> {
    try {
      console.log('🎥 Création du lien Jitsi Meet...');

      const meetId = `interview-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 9)}`;

      const domain = process.env.JITSI_DOMAIN || 'https://8x8.vc';

      const meetLink = `${domain}/${meetId}`;

      console.log('✅ Jitsi Meet créé:', meetLink);

      return {
        meetLink,
        meetId,
        eventId: meetId,
      };
    } catch (error: any) {
      console.error('❌ Erreur création Jitsi Meet:', error.message);
      throw error;
    }
  }

  async deleteMeeting(eventId: string): Promise<void> {
    console.log('✅ Réunion Jitsi terminée:', eventId);
  }
}