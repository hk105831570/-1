import { IsNotEmpty, IsString, IsOptional, IsDateString, Length, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: '工号', example: 'EMP001' })
  @IsNotEmpty({ message: '工号不能为空' })
  @IsString()
  @Length(2, 32)
  employeeId: string;

  @ApiProperty({ description: '姓名', example: '张三' })
  @IsNotEmpty({ message: '姓名不能为空' })
  @IsString()
  @Length(1, 64)
  name: string;

  @ApiProperty({ description: '身份证号', example: '320101199001011234' })
  @IsNotEmpty({ message: '身份证号不能为空' })
  @IsString()
  @Matches(/^\d{17}[\dXx]$/, { message: '身份证号格式不正确' })
  idNumber: string;

  @ApiPropertyOptional({ description: '手机号', example: '13800138000' })
  @IsOptional()
  @IsString()
  @Matches(/^1\d{10}$/, { message: '手机号格式不正确' })
  phone?: string;

  @ApiPropertyOptional({ description: '部门', example: '技术部' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ description: '岗位', example: '前端工程师' })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({ description: '入职日期', example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  hireDate?: string;
}
