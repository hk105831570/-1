import { IsNotEmpty, IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCourseDto {
  @ApiProperty({ description: '课程名', example: '公司制度培训' })
  @IsNotEmpty({ message: '课程名不能为空' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: '分类', example: '制度培训' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: '视频地址' })
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiPropertyOptional({ description: '视频时长(秒)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  videoDuration?: number;

  @ApiPropertyOptional({ description: '通过分数线', default: 80 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  passingScore?: number;

  @ApiPropertyOptional({ description: '说明文档地址' })
  @IsOptional()
  @IsString()
  docUrl?: string;
}
