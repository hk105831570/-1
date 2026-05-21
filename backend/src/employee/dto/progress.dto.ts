import { IsNotEmpty, IsInt, Min, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProgressDto {
  @ApiProperty({ description: '课程ID' })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  courseId: number;

  @ApiProperty({ description: '本次新增秒数' })
  @IsNotEmpty()
  @IsInt()
  @Min(0)
  increment: number;

  @ApiProperty({ description: '当前进度(秒)' })
  @IsNotEmpty()
  @IsInt()
  @Min(0)
  currentProgress: number;

  @ApiProperty({ description: '视频实际总时长(秒，可选)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  videoDuration?: number;
}
