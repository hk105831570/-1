import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { comparePassword, hashPassword } from '../common/utils/bcrypt.util';
import { OperationLogService } from '../operation-log/operation-log.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private operationLogService: OperationLogService,
  ) {}

  async login(username: string, password: string, ip?: string) {
    // 先查员工表
    const user = await this.prisma.user.findUnique({
      where: { employeeId: username },
    });

    if (!user || user.deletedAt) {
      // 再查管理员表
      const admin = await this.prisma.admin.findUnique({
        where: { username },
      });
      if (admin && admin.status === 'active') {
        return this.adminLogin(admin, password, ip);
      }
      throw new UnauthorizedException('账号或密码错误');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('账号已被停用');
    }

    // 检查锁定
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException('账号已被锁定，请30分钟后再试');
    }

    // 验证密码
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      const failCount = user.loginFailCount + 1;
      const updateData: any = { loginFailCount: failCount };
      // 连续5次错误，锁定30分钟
      if (failCount >= 5) {
        updateData.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
        updateData.loginFailCount = 0; // 锁定后重置计数
      }
      await this.prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      await this.operationLogService.log({
        operatorId: user.id,
        operatorType: 'employee',
        actionType: 'LOGIN_FAILED',
        detail: `工号 ${username} 登录失败`,
        ip,
      });
      throw new UnauthorizedException('账号或密码错误');
    }

    // 登录成功，重置失败次数
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        loginFailCount: 0,
        lockedUntil: null,
      },
    });

    const payload = { sub: user.id, type: 'employee', username: user.employeeId };
    const token = this.jwtService.sign(payload);

    await this.operationLogService.log({
      operatorId: user.id,
      operatorType: 'employee',
      actionType: 'LOGIN',
      detail: `员工 ${user.name} 登录成功`,
      ip,
    });

    return {
      token,
      user: {
        id: user.id,
        employeeId: user.employeeId,
        name: user.name,
        department: user.department,
        position: user.position,
        isFirstLogin: user.isFirstLogin,
      },
    };
  }

  private async adminLogin(admin: any, password: string, ip?: string) {
    const isPasswordValid = await comparePassword(password, admin.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('账号或密码错误');
    }

    const payload = { sub: admin.id, type: 'admin', username: admin.username };
    const token = this.jwtService.sign(payload);

    await this.operationLogService.log({
      operatorId: admin.id,
      operatorType: 'admin',
      actionType: 'LOGIN',
      detail: `管理员 ${admin.name} 登录成功`,
      ip,
    });

    return {
      token,
      user: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        role: admin.role,
      },
    };
  }

  async changePassword(userId: number, oldPassword: string, newPassword: string, confirmPassword: string) {
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('两次输入的密码不一致');
    }

    if (oldPassword === newPassword) {
      throw new BadRequestException('新密码不能与原密码相同');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    // 验证原密码
    const isOldValid = await comparePassword(oldPassword, user.password);
    if (!isOldValid) {
      throw new BadRequestException('原密码错误');
    }

    const hashed = await hashPassword(newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashed,
        isFirstLogin: false, // 改密后标记为已首次登录
      },
    });

    await this.operationLogService.log({
      operatorId: userId,
      operatorType: 'employee',
      actionType: 'CHANGE_PASSWORD',
      detail: '员工修改密码',
    });

    return { message: '密码修改成功' };
  }
}
