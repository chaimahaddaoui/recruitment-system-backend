import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async create(createUserDto: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: Role;
  }): Promise<User> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    return this.prisma.user.create({
      data: {
        email: createUserDto.email,
        password: hashedPassword,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        phone: createUserDto.phone,
        role: createUserDto.role || Role.CANDIDATE,
      },
    });
  }

  async findAll(): Promise<User[]> {
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
    }) as Promise<User[]>; 
  }

  async updateLastLogin(userId: number): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLogin: new Date() },
    });
  }

  async comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async updatePassword(userId: number, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await this.prisma.user.update({
      where: { id: userId },
      data: { 
        password: hashedPassword,
        mustChangePassword: false, 
      },
    });
  }
}