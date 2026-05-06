import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';

@Controller('uploads')
export class UploadsController {
  @Get('cvs/:filename')
  async getCv(@Param('filename') filename: string, @Res() res: Response) {
    console.log('📄 Demande de CV:', filename);

    // Chemin vers le dossier uploads
    const filePath = path.join(process.cwd(), 'uploads', 'cvs', filename);
    
    console.log('📂 Chemin complet:', filePath);

    // Vérifier si le fichier existe
    if (!fs.existsSync(filePath)) {
      console.error('❌ Fichier introuvable:', filePath);
      throw new NotFoundException('Fichier introuvable');
    }

    console.log('✅ Fichier trouvé, envoi en cours...');

    // Déterminer le type MIME
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain',
    };

    const mimeType = mimeTypes[ext] || 'application/octet-stream';

    // Envoyer le fichier avec les bons headers pour l'affichage dans le navigateur
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');
    
    // Envoyer le fichier
    return res.sendFile(filePath);
  }
}