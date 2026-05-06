import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty()
    @IsString()
    token!: string;

  @IsNotEmpty()
    @IsString()
    @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
    newPassword!: string;
}