import { IsNotEmpty, IsString, IsInt, Min, IsIn, IsArray, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateQuestionDto {
  @ApiProperty({ description: '课程ID' })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  courseId: number;

  @ApiProperty({ description: '题型', enum: ['single', 'multiple', 'judge'] })
  @IsNotEmpty()
  @IsString()
  @IsIn(['single', 'multiple', 'judge'])
  questionType: string;

  @ApiProperty({ description: '题干' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ description: '选项列表', example: ['选项A', '选项B', '选项C', '选项D'] })
  @IsNotEmpty()
  @IsArray()
  options: string[];

  @ApiProperty({ description: '正确答案（单选/判断为单个值，多选题用逗号分隔）', example: 'A' })
  @IsNotEmpty()
  @IsString()
  answer: string;

  @ApiProperty({ description: '分值', default: 10 })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  score: number;

  @ApiProperty({ description: '排序', default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder: number;
}
