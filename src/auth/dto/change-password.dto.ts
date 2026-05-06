import { IsNotEmpty, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsNotEmpty({ message: 'Ancien mot de passe obligatoire' })
    oldPassword!: string;

  @IsNotEmpty({ message: 'Nouveau mot de passe obligatoire' })
  @MinLength(8, {
    message: 'Le nouveau mot de passe doit contenir au moins 8 caractères',
  })
  newPassword!: string;
}