import { Controller, Post, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/strategies/jwt.strategy';

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: '员工/管理员登录' })
  async login(@Body() loginDto: LoginDto, @Req() req: any) {
    const ip = req.ip;
    return this.authService.login(loginDto.username, loginDto.password, ip);
  }

  @Post('change-password')
  @ApiOperation({ summary: '员工修改密码（首次登录强制改密）' })
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.authService.changePassword(
      user.sub,
      dto.oldPassword,
      dto.newPassword,
      dto.confirmPassword,
    );
  }
}
