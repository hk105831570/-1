import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

// 更新时不允许修改工号
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['employeeId'] as const),
) {}
