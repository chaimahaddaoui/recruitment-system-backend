import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  validateToken(token: string) {
    throw new Error('Method not implemented.');
  }
  constructor(
    private jwtService: JwtService,
    private userService: UsersService,
    private prisma: PrismaService,
  ) {}

  // ================= REGISTER =================
  async register(dto: RegisterDto) {
    const existingUser = await this.userService.findByEmail(dto.email);

    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const user = await this.userService.create({
      email: dto.email,
      password: dto.password,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      role: dto.role || Role.CANDIDATE,
    });

    const token = this.generateToken(user);

    return {
      message: 'User registered successfully',
      user: this.sanitizeUser(user),
      access_token: token,
    };
  }

  // ================= LOGIN =================
  async login(dto: LoginDto) {
    const user = await this.userService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active');
    }

    const isPasswordValid = await this.userService.comparePasswords(
      dto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.userService.updateLastLogin(user.id);

    const token = this.generateToken(user);

    return {
      access_token: token,
      user: this.sanitizeUser(user),
    };
  }

  // ================= TOKEN =================
  private generateToken(user: any): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }

  private sanitizeUser(user: any) {
    const { password, refreshToken, ...rest } = user;
    return rest;
  }

  // ================= REQUEST RESET =================
  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return {
        message:
          'Si cet email existe, un lien de réinitialisation a été envoyé.',
      };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = await bcrypt.hash(resetToken, 10);

    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: resetTokenHash,
        resetTokenExpiry: expiry,
      },
    });

    console.log('RESET TOKEN:', resetToken);

    return {
      message:
        'Si cet email existe, un lien de réinitialisation a été envoyé.',
      resetToken, // ⚠️ enlever en production
    };
  }

  // ================= RESET PASSWORD =================
  async resetPassword(token: string, newPassword: string) {
    const users = (await this.prisma.user.findMany({
      select: {
        id: true,
        resetToken: true,
        resetTokenExpiry: true,
      },
    })) as {
      id: number;
      resetToken: string | null;
      resetTokenExpiry: Date | null;
    }[];

    let matchedUser: { id: number } | null = null;
    const now = new Date();

    for (const user of users) {
      if (user.resetToken && user.resetTokenExpiry) {
        const isValid = await bcrypt.compare(token, user.resetToken);

        if (isValid && user.resetTokenExpiry > now) {
          matchedUser = user;
          break;
        }
      }
    }

    if (!matchedUser) {
      throw new BadRequestException('Token invalide ou expiré');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: matchedUser.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return {
      message: 'Mot de passe réinitialisé avec succès',
    };
  }

  // ================= CHANGE PASSWORD =================
  async changePassword(
  userId: number,
  oldPassword: string,
  newPassword: string,
) {
  if (!userId) {
    throw new BadRequestException('Utilisateur non authentifié');
  }

  const user = await this.prisma.user.findUnique({
    where: { id: Number(userId) },
  });

  if (!user) {
    throw new NotFoundException('Utilisateur introuvable');
  }

  const isOldPasswordValid = await bcrypt.compare(
    oldPassword,
    user.password,
  );

  if (!isOldPasswordValid) {
    throw new BadRequestException('Ancien mot de passe incorrect');
  }

  const isSamePassword = await bcrypt.compare(
    newPassword,
    user.password,
  );

  if (isSamePassword) {
    throw new BadRequestException(
      'Le nouveau mot de passe doit être différent de l’ancien',
    );
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await this.prisma.user.update({
    where: { id: Number(userId) },
    data: {
      password: hashedPassword,
      mustChangePassword: false,
    },
  });

  return {
    message: 'Mot de passe modifié avec succès',
  };
  }
}