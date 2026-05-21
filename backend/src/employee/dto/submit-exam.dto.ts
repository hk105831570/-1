import { IsNotEmpty, IsInt, IsArray, Min, ArrayNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class AnswerItem {
  @ApiProperty({ description: '题目ID' })
  @IsNotEmpty()
  @IsInt()
  questionId: number;

  @ApiProperty({ description: '考生答案（单选/判断传单个值，多选用逗号分隔排序后传）' })
  @IsNotEmpty()
  answer: string;
}

export class SubmitExamDto {
  @ApiProperty({ description: '课程ID' })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  courseId: number;

  @ApiProperty({ description: '答题列表', type: [AnswerItem] })
  @IsNotEmpty()
  @IsArray()
  @ArrayNotEmpty()
  answers: AnswerItem[];
}
