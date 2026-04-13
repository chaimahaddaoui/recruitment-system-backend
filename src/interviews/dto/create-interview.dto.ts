import { IsInt, IsEnum, IsDateString, IsString, IsOptional, IsNumber } from 'class-validator';
import { InterviewType } from '@prisma/client';

export class CreateInterviewDto {
  @IsInt()
  applicationId!: number;

  @IsEnum(InterviewType)
  type!: InterviewType;

  @IsDateString()
  scheduledAt!: string;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}