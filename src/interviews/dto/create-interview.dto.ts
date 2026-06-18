/* import { IsInt, IsString, IsEnum, IsOptional, IsDateString } from 'class-validator';
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
   @IsOptional()
  @IsEnum(['LOCAL', 'GOOGLE_MEET'])
  interviewMode?: 'LOCAL' | 'GOOGLE_MEET';
  meetingMode: string;
  meetingLink: string;
} */

  import {
  IsInt,
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  IsIn,
} from 'class-validator';
import { InterviewType } from '@prisma/client';

export class CreateInterviewDto {
  @IsInt()
  applicationId!: number;

  @IsEnum(InterviewType)
  type!: InterviewType;

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


  @IsOptional()
  @IsIn(['LOCAL', 'MANUAL_LINK', 'GOOGLE_MEET'])
  meetingMode?: 'LOCAL' | 'MANUAL_LINK' | 'GOOGLE_MEET';
  
}
