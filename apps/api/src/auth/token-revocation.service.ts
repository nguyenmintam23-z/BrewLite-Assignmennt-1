import { Injectable } from '@nestjs/common';

/**
 * Danh sách jti đã thu hồi khi đăng xuất, giữ đến lúc token hết hạn (FR-21).
 * Lưu trong bộ nhớ, MVP chạy một instance.
 */
@Injectable()
export class TokenRevocationService {
  private readonly revoked = new Map<string, number>();

  /** exp: thời điểm hết hạn của token (giây, theo claim exp). */
  revoke(jti: string, exp: number): void {
    this.prune();
    this.revoked.set(jti, exp);
  }

  isRevoked(jti: string): boolean {
    const exp = this.revoked.get(jti);
    if (exp === undefined) return false;
    if (exp * 1000 <= Date.now()) {
      this.revoked.delete(jti);
      return false;
    }
    return true;
  }

  private prune(): void {
    const now = Date.now();
    for (const [jti, exp] of this.revoked) {
      if (exp * 1000 <= now) this.revoked.delete(jti);
    }
  }
}
