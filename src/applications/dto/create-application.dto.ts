import { IsInt, IsString, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateApplicationDto {
  @IsInt()
  @Type(() => Number) 
  jobId!: number;

  @IsString()
  @MinLength(100)
  coverLetter!: string;
   
  
  
}