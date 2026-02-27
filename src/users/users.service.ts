import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { User } from '@prisma/client'; 
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  usersRepository: any;
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async create(createUserDto: any) {
  const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

  const user = this.prisma.user.create({
    data: {
      email: createUserDto.email,
      password: hashedPassword,
      role: createUserDto.role || 'user',
    },
  });

  return user;
}
  async findAll() {
    
    return this.prisma.user.findMany();
  }
  async comparePasswords(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}

