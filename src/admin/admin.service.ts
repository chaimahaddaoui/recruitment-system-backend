import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { EmailService } from '../email/email.service';

// TODO: Ajouter un service d'email (NodeMailer)
@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService,
  private emailService: EmailService) {}

  async createUser(createUserDto: CreateUserDto) {
    // Générer un mot de passe temporaire aléatoire
    const temporaryPassword = this.generatePassword();

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // Créer l'utilisateur
    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        password: hashedPassword,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        phone: createUserDto.phone,
        role: createUserDto.role,
        mustChangePassword: true, // ← Important !
      },
    });

     // ← Envoyer l'email
    await this.emailService.sendWelcomeEmail(
      user.email,
      user.firstName,
      user.lastName,
      user.role,
      temporaryPassword,
    );
    // Retourner les infos (sans le mot de passe hashé)
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      temporaryPassword, // ← Pour l'afficher à l'admin
      message: 'Utilisateur créé avec succès. Un email a été envoyé avec les credentials.',
    };
  }

  private generatePassword(): string {
    // Générer un mot de passe aléatoire de 12 caractères
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, charset.length);
      password += charset[randomIndex];
    }
    
    return password;
  }

  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        mustChangePassword: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async deleteUser(id: number) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}