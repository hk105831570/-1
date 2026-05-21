import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ description: '原密码（首次改密时为身份证后六位）' })
  @IsNotEmpty({ message: '原密码不能为空' })
  @IsString()
  oldPassword: string;

  @ApiProperty({ description: '新密码（8-16位，包含字母和数字）' })
  @IsNotEmpty({ message: '新密码不能为空' })
  @IsString()
  @Length(8, 16, { message: '密码长度8-16位' })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)/, { message: '密码必须包含字母和数字' })
  newPassword: string;

  @ApiProperty({ description: '确认新密码' })
  @IsNotEmpty({ message: '确认密码不能为空' })
  @IsString()
  confirmPassword: string;
}
