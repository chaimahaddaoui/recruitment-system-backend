import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userService: UsersService,
  ) {}

  async register(dto: RegisterDto) {
    // Vérifier si l'utilisateur existe
    const existingUser = await this.userService.findByEmail(dto.email);
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    // Créer l'utilisateur avec le rôle (par défaut CANDIDATE)
    const user = await this.userService.create({
      email: dto.email,
      password: dto.password,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      role: dto.role || Role.CANDIDATE,
    });

    // Générer le token
    const token = this.generateToken(user);

    return {
      message: 'User registered successfully',
      user: this.sanitizeUser(user),
      access_token: token,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userService.findByEmail(dto.email);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Vérifier le statut
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

    // Mettre à jour lastLogin
    await this.userService.updateLastLogin(user.id);

    // Générer le token
    const token = this.generateToken(user);

    return {
      access_token: token,
      user: this.sanitizeUser(user),
    };
  }

  private generateToken(user: any): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }

  private sanitizeUser(user: any) {
    const { password, refreshToken, ...sanitized } = user;
    return sanitized;
  }
}