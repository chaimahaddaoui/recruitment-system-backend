import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  sendEmailValidatedTechnical(email: string, arg1: string, title: string) {
    throw new Error('Method not implemented.');
  }
  private transporter;
  configService: any;

  constructor() {
    // Configuration Gmail (exemple)
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Votre email Gmail
        pass: process.env.EMAIL_PASSWORD, // Mot de passe d'application Gmail
      },
    });
  }

  async sendWelcomeEmail(
    to: string,
    firstName: string,
    lastName: string,
    role: string,
    temporaryPassword: string,
  ) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject: 'Bienvenue sur ATS Recruitment - Vos Identifiants',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .credentials { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 Bienvenue sur ATS Recruitment</h1>
            </div>
            <div class="content">
              <p>Bonjour <strong>${firstName} ${lastName}</strong>,</p>
              
              <p>Votre compte <strong>${role}</strong> a été créé avec succès !</p>
              
              <div class="credentials">
                <h3>📧 Vos identifiants de connexion :</h3>
                <p><strong>Email :</strong> ${to}</p>
                <p><strong>Mot de passe temporaire :</strong> <code style="background: #f0f0f0; padding: 5px 10px; border-radius: 3px;">${temporaryPassword}</code></p>
              </div>
              
              <div class="warning">
                <h4>⚠️ IMPORTANT - Sécurité</h4>
                <p>Pour des raisons de sécurité, vous <strong>DEVEZ changer ce mot de passe</strong> lors de votre première connexion.</p>
              </div>
              
              <p>Cliquez sur le bouton ci-dessous pour vous connecter :</p>
              <a href="${process.env.FRONTEND_URL}/auth/login" class="button">Se connecter</a>
              
              <p style="margin-top: 30px; color: #666; font-size: 14px;">
                Si vous n'avez pas demandé ce compte, veuillez ignorer cet email ou contactez l'administrateur.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email envoyé à ${to}`);
      return true;
    } catch (error) {
      console.error('❌ Erreur envoi email:', error);
      return false;
    }
  }


  async sendApplicationConfirmation(
    candidateEmail: string,
    candidateName: string,
    jobTitle: string,
  ) {
    const subject = '✅ Candidature reçue - ' + jobTitle;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Candidature bien reçue !</h2>
        <p>Bonjour <strong>${candidateName}</strong>,</p>
        <p>Nous avons bien reçu votre candidature pour le poste de <strong>${jobTitle}</strong>.</p>
        <p>Votre dossier sera examiné par notre équipe de recrutement dans les plus brefs délais.</p>
        <p>Vous recevrez un email de notification pour chaque étape du processus de recrutement.</p>
        <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          Cordialement,<br>
          L'équipe Recrutement
        </p>
      </div>
    `;

    await this.sendEmail(candidateEmail, subject, html);
  }

  async sendShortlistNotification(
    candidateEmail: string,
    candidateName: string,
    jobTitle: string,
  ) {
    const subject = '🎯 Candidature pré-sélectionnée - ' + jobTitle;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Félicitations ! Vous êtes pré-sélectionné(e)</h2>
        <p>Bonjour <strong>${candidateName}</strong>,</p>
        <p>Nous avons le plaisir de vous informer que votre candidature pour le poste de <strong>${jobTitle}</strong> a été pré-sélectionnée.</p>
        <p>Votre profil a retenu notre attention et nous souhaitons poursuivre le processus de recrutement avec vous.</p>
        <p>Vous serez contacté(e) prochainement pour planifier un entretien.</p>
        <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          Cordialement,<br>
          L'équipe Recrutement
        </p>
      </div>
    `;

    await this.sendEmail(candidateEmail, subject, html);
  }

  async sendInterviewScheduled(
    candidateEmail: string,
    candidateName: string,
    jobTitle: string,
    interviewType: string,
    scheduledAt: Date,
    location: string ,
    duration: number ,
  ) {
    const typeLabels: Record<string, string> = {
      HR_SCREENING: 'Entretien RH - Screening',
      TECHNICAL: 'Entretien Technique',
      HR_FINAL: 'Entretien RH Final - Négociation',
    };

    const subject = '📅 Entretien planifié - ' + jobTitle;
    const formattedDate = new Date(scheduledAt).toLocaleString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c3aed;">Entretien planifié</h2>
        <p>Bonjour <strong>${candidateName}</strong>,</p>
        <p>Votre entretien pour le poste de <strong>${jobTitle}</strong> a été planifié.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1f2937;">Détails de l'entretien</h3>
          <p><strong>Type :</strong> ${typeLabels[interviewType] || interviewType}</p>
          <p><strong>Date et heure :</strong> ${formattedDate}</p>
          ${duration ? `<p><strong>Durée :</strong> ${duration} minutes</p>` : ''}
          <p><strong>Lieu :</strong> ${location}</p>
        </div>

        <p>Veuillez confirmer votre présence et vous préparer en conséquence.</p>
        <p>En cas d'empêchement, merci de nous prévenir au plus vite.</p>

        <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          Cordialement,<br>
          L'équipe Recrutement
        </p>
      </div>
    `;

    await this.sendEmail(candidateEmail, subject, html);
  }

  async sendInterviewPassed(
    candidateEmail: string,
    candidateName: string,
    jobTitle: string,
    interviewType: string,
    nextStep: string,
  ) {
    const subject = '✅ Entretien validé - ' + jobTitle;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Félicitations !</h2>
        <p>Bonjour <strong>${candidateName}</strong>,</p>
        <p>Nous avons le plaisir de vous informer que vous avez réussi l'entretien pour le poste de <strong>${jobTitle}</strong>.</p>
        <p><strong>Prochaine étape :</strong> ${nextStep}</p>
        <p>Vous serez contacté(e) prochainement pour la suite du processus.</p>
        <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          Cordialement,<br>
          L'équipe Recrutement
        </p>
      </div>
    `;

    await this.sendEmail(candidateEmail, subject, html);
  }

  async sendOfferAccepted(
    candidateEmail: string,
    candidateName: string,
    jobTitle: string,
  ) {
    const subject = '🎉 Félicitations ! Offre d\'emploi - ' + jobTitle;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">🎉 Félicitations ! Vous êtes sélectionné(e) !</h2>
        <p>Bonjour <strong>${candidateName}</strong>,</p>
        <p>Nous avons le grand plaisir de vous annoncer que votre candidature pour le poste de <strong>${jobTitle}</strong> a été retenue !</p>
        <p>Après avoir examiné votre profil et suite à vos entretiens, nous sommes convaincus que vous êtes le/la candidat(e) idéal(e) pour rejoindre notre équipe.</p>
        <p>Vous recevrez prochainement une offre formelle d'emploi avec tous les détails concernant :</p>
        <ul>
          <li>Le salaire et les avantages</li>
          <li>La date de début</li>
          <li>Les conditions contractuelles</li>
        </ul>
        <p>Nous sommes impatients de vous accueillir dans notre entreprise !</p>
        <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          Cordialement,<br>
          L'équipe Recrutement
        </p>
      </div>
    `;

    await this.sendEmail(candidateEmail, subject, html);
  }

  async sendRejection(
    candidateEmail: string,
    candidateName: string,
    jobTitle: string,
  ) {
    const subject = 'Suite de votre candidature - ' + jobTitle;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">Suite de votre candidature</h2>
        <p>Bonjour <strong>${candidateName}</strong>,</p>
        <p>Nous vous remercions de l'intérêt que vous avez porté à notre entreprise et du temps consacré au processus de recrutement pour le poste de <strong>${jobTitle}</strong>.</p>
        <p>Après une étude approfondie de votre dossier, nous avons le regret de vous informer que nous ne pouvons pas donner une suite favorable à votre candidature pour ce poste.</p>
        <p>Cette décision ne remet pas en cause vos qualités professionnelles. Nous avons simplement retenu un profil correspondant davantage aux exigences spécifiques du poste.</p>
        <p>Nous vous encourageons à postuler à d'autres opportunités au sein de notre entreprise qui pourraient mieux correspondre à votre profil.</p>
        <p>Nous vous souhaitons plein succès dans vos recherches.</p>
        <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          Cordialement,<br>
          L'équipe Recrutement
        </p>
      </div>
    `;

    await this.sendEmail(candidateEmail, subject, html);
  }

  private async sendEmail(to: string, subject: string, html: string) {
    try {
      await this.transporter.sendMail({
        from: `"Plateforme Recrutement" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
      });
      console.log('✅ Email envoyé à:', to);
    } catch (error) {
      console.error('❌ Erreur envoi email:', error);
    }
  }




}