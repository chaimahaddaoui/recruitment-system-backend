import { IsInt, IsString, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { InterviewType } from '@prisma/client';

export class CreateInterviewDto {
  @IsInt()
  applicationId!: number;

  @IsEnum(InterviewType)
  type: InterviewType = "HR_SCREENING";

  @IsDateString()
  scheduledAt!: string;

  @IsInt()
  @IsOptional()
  duration?: number;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}