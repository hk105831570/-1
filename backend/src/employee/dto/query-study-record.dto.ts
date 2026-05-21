import { IsOptional, IsString, IsInt, IsBoolean, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class QueryStudyRecordDto {
  @ApiProperty({ description: '搜索关键词(员工姓名/工号)', required: false })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({ description: '部门', required: false })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiProperty({ description: '课程ID', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  courseId?: number;

  @ApiProperty({ description: '完成状态', required: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isCompleted?: boolean;

  @ApiProperty({ description: '开始日期', required: false })
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiProperty({ description: '结束日期', required: false })
  @IsOptional()
  @IsString()
  dateTo?: string;

  @ApiProperty({ description: '页码', required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ description: '每页条数', required: false, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 20;
}
