import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter;

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
}