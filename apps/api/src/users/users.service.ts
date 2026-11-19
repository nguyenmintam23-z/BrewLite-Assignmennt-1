import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/** Thông tin người dùng trả ra ngoài: không bao giờ có passwordHash. */
export interface PublicUser {
  id: string;
  email: string;
  loyaltyPoints: number;
  createdAt: string;
}

export function toPublicUser(
  u: Pick<User, 'id' | 'email' | 'loyaltyPoints' | 'createdAt'>,
): PublicUser {
  return {
    id: u.id,
    email: u.email,
    loyaltyPoints: u.loyaltyPoints,
    createdAt: u.createdAt.toISOString(),
  };
}

/** Email so sánh không phân biệt hoa thường, bỏ khoảng trắng hai đầu (FR-20). */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email: normalizeEmail(email) } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  /** Đăng ký luôn tạo user thường; tài khoản nhân viên do seed hoặc quản trị tạo. */
  create(data: { email: string; passwordHash: string }): Promise<User> {
    return this.prisma.user.create({
      data: {
        email: normalizeEmail(data.email),
        passwordHash: data.passwordHash,
      },
    });
  }
}
