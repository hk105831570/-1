import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { hashPassword } from '../common/utils/bcrypt.util';
import { encryptIdNumber, decryptIdNumber } from '../common/utils/crypto.util';
import { maskIdNumber } from '../common/utils/id-mask.util';
import * as XLSX from 'xlsx';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryUserDto) {
    const { page = 1, pageSize = 20, keyword, department, position, status, sortBy, sortOrder } = query;

    const where: Prisma.UserWhereInput = { deletedAt: null };
    if (keyword) {
      where.OR = [
        { employeeId: { contains: keyword } },
        { name: { contains: keyword } },
        { phone: { contains: keyword } },
      ];
    }
    if (department) where.department = department;
    if (position) where.position = position;
    if (status) where.status = status;

    const orderBy: Prisma.UserOrderByWithRelationInput = {};
    if (sortBy && ['employeeId', 'name', 'department', 'position', 'hireDate', 'createdAt'].includes(sortBy)) {
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy,
        select: {
          id: true,
          employeeId: true,
          name: true,
          idNumber: true,
          phone: true,
          department: true,
          position: true,
          hireDate: true,
          status: true,
          isFirstLogin: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    // 解密身份证号并打码
    const maskedItems = items.map((item) => {
      let maskedIdNumber = item.idNumber;
      try {
        const decrypted = decryptIdNumber(item.idNumber);
        maskedIdNumber = maskIdNumber(decrypted);
      } catch {
        maskedIdNumber = '***';
      }
      return { ...item, idNumber: maskedIdNumber };
    });

    return {
      items: maskedItems,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!user) throw new NotFoundException('员工不存在');

    let maskedIdNumber = user.idNumber;
    try {
      const decrypted = decryptIdNumber(user.idNumber);
      maskedIdNumber = maskIdNumber(decrypted);
    } catch {
      maskedIdNumber = '***';
    }

    return { ...user, idNumber: maskedIdNumber, password: undefined };
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { employeeId: dto.employeeId },
    });
    if (existing) {
      throw new ConflictException('工号已存在');
    }

    const encryptedIdNumber = encryptIdNumber(dto.idNumber);
    const initialPassword = dto.idNumber.slice(-6);
    const hashedPassword = await hashPassword(initialPassword);

    const result = await this.prisma.user.create({
      data: {
        employeeId: dto.employeeId,
        name: dto.name,
        idNumber: encryptedIdNumber,
        phone: dto.phone,
        department: dto.department,
        position: dto.position,
        hireDate: dto.hireDate ? new Date(dto.hireDate) : null,
        password: hashedPassword,
        isFirstLogin: true,
      },
    });

    return { id: result.id, employeeId: result.employeeId, name: result.name };
  }

  async update(id: number, dto: UpdateUserDto) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!user) throw new NotFoundException('员工不存在');

    const updateData: any = {};

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.idNumber !== undefined) updateData.idNumber = encryptIdNumber(dto.idNumber);
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.department !== undefined) updateData.department = dto.department;
    if (dto.hireDate !== undefined) updateData.hireDate = new Date(dto.hireDate);

    // 岗位变动时记录历史
    if (dto.position !== undefined && dto.position !== user.position) {
      updateData.position = dto.position;
      await this.prisma.positionChangeHistory.create({
        data: {
          userId: id,
          oldPosition: user.position,
          newPosition: dto.position,
          operator: 'system',
        },
      });
    }

    const result = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    return { id: result.id, employeeId: result.employeeId, name: result.name };
  }

  async deactivate(id: number) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!user) throw new NotFoundException('员工不存在');

    await this.prisma.user.update({
      where: { id },
      data: { status: 'inactive' },
    });

    return { message: '已停用' };
  }

  async activate(id: number) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!user) throw new NotFoundException('员工不存在');

    await this.prisma.user.update({
      where: { id },
      data: { status: 'active' },
    });

    return { message: '已启用' };
  }

  async batchImport(file: Express.Multer.File) {
    if (!file) throw new BadRequestException('请上传文件');

    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);

    if (rows.length === 0) throw new BadRequestException('文件中没有数据');

    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const index = i + 2;
      try {
        const employeeId = String(row['工号'] || '').trim();
        const name = String(row['姓名'] || '').trim();
        const idNumber = String(row['身份证号'] || '').trim();
        const phone = String(row['手机号'] || '').trim();
        const department = String(row['部门'] || '').trim();
        const position = String(row['岗位'] || '').trim();

        if (!employeeId || !name || !idNumber) {
          results.errors.push(`第${index}行: 工号、姓名、身份证号为必填`);
          results.failed++;
          continue;
        }

        await this.create({
          employeeId,
          name,
          idNumber,
          phone: phone || undefined,
          department: department || undefined,
          position: position || undefined,
        });
        results.success++;
      } catch (err: any) {
        results.errors.push(`第${index}行: ${err.message || '导入失败'}`);
        results.failed++;
      }
    }

    return results;
  }

  async resetPassword(id: number) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!user) throw new NotFoundException('员工不存在');

    let idNumber: string;
    try {
      idNumber = decryptIdNumber(user.idNumber);
    } catch {
      throw new BadRequestException('身份证号解密失败');
    }

    const newPassword = idNumber.slice(-6);
    const hashedPassword = await hashPassword(newPassword);

    await this.prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        isFirstLogin: true,
        loginFailCount: 0,
        lockedUntil: null,
      },
    });

    return { message: '密码已重置为身份证后六位' };
  }

  async getPositionHistory(userId: number) {
    const history = await this.prisma.positionChangeHistory.findMany({
      where: { userId },
      orderBy: { changedAt: 'desc' },
    });
    return history;
  }
}
