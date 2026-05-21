import { IsNotEmpty, IsString, IsInt, Min, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePositionCourseDto {
  @ApiProperty({ description: '岗位名', example: '前端工程师' })
  @IsNotEmpty()
  @IsString()
  position: string;

  @ApiProperty({ description: '课程ID' })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  courseId: number;

  @ApiPropertyOptional({ description: '是否必修', default: true })
  isRequired?: boolean;

  @ApiPropertyOptional({ description: '有效期(月)，0=永久', default: 0 })
  validMonths?: number;
}

export class BatchSetPositionCoursesDto {
  @ApiProperty({ description: '岗位名' })
  @IsNotEmpty()
  @IsString()
  position: string;

  @ApiProperty({ description: '课程ID列表', type: [Number] })
  @IsNotEmpty()
  courseIds: number[];
}
