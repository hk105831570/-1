import { IsNotEmpty, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QueryQuestionDto extends PaginationDto {
  @ApiProperty({ description: '课程ID' })
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  courseId: number;
}
