import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userService: UsersService,
  ) {}

  async register(dto: RegisterDto) {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await this.userService.findByEmail(dto.email);
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    // Assigner un rôle par défaut (user) si non spécifié
    const role = dto.role || 'user';

    // Créer l'utilisateur avec le rôle
    const user = await this.userService.create({
      email: dto.email,
      password: dto.password,
      role,
    });

    return {
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userService.findByEmail(dto.email);
    const isPasswordValid = user && await this.userService.comparePasswords(dto.password, user.password);
    
    if (!user || !isPasswordValid) {
      throw new BadRequestException('Invalid credentials');
    }

    const payload = { 
      sub: user.id, 
      email: user.email,
      role: user.role // Inclure le rôle dans le JWT
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }
}