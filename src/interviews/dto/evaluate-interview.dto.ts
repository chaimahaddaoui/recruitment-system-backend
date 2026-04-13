import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class EvaluateInterviewDto {
  @IsString()
  evaluation!: string;

  @IsBoolean()
  passed: boolean = false;

  @IsOptional()
  @IsString()
  notes?: string;
}