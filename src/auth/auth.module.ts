import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { RolesGuard } from './roles.guard';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule,
    UsersModule, 
    JwtModule.register({
      secret: 'SUPER_SECRET_KEY', 
      signOptions: { expiresIn: '1d' },
      
    }),
  ],
  controllers: [AuthController],
  providers: [
  AuthService,
  JwtStrategy,
  RolesGuard,
],
})
export class AuthModule {}