import { IsString, IsNotEmpty, IsEnum, IsInt, IsOptional, IsArray, Min } from 'class-validator';
import { ContractType } from '@prisma/client';

export class CreateJobDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsNotEmpty()
  requirements!: string;

  @IsString()
  @IsNotEmpty()
  location!: string;

  @IsEnum(ContractType)
  contractType!: ContractType;

  @IsOptional()
  @IsInt()
  @Min(0)
  salaryMin?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  salaryMax?: number;

  @IsInt()
  @Min(0)
  experienceYears!: number;

  @IsString()
  @IsNotEmpty()
  educationLevel!: string;

  @IsArray()
  @IsString({ each: true })
  skills!: string[];
}