/* import { Controller, Post, Body, Patch, UseGuards, Req } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {} 

  @Post('register')
  registerUser(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }





   // ✅ NOUVEAU : Demander la réinitialisation du mot de passe
  @Post('request-password-reset')
  requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  // ✅ NOUVEAU : Réinitialiser le mot de passe
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  // ✅ NOUVEAU : Changer le mot de passe (utilisateur connecté)
  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(
    @Body() dto: ChangePasswordDto,
    @Req() request: Request & { user?: any },
  ) {
    const userId = request.user?.userId || request.user?.sub;
    return this.authService.changePassword(userId, dto.oldPassword, dto.newPassword);
  }
}

 */
import { Controller, Post, Body, Patch, UseGuards, Req } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  registerUser(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('request-password-reset')
  requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(
    @Body() dto: ChangePasswordDto,
    @Req() request: Request & { user?: any },
  ) {
    const userId = request.user?.userId || request.user?.sub;

    return this.authService.changePassword(
      userId,
      dto.oldPassword,
      dto.newPassword,
    );
  }
}