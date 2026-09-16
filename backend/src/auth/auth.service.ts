import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import { User } from '../users/user.schema';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async onModuleInit() {
    await this.ensureAdminUser();
  }

  private async ensureAdminUser() {
    const email = this.config.get<string>('ADMIN_EMAIL', 'admin@example.com');
    const password = this.config.get<string>('ADMIN_PASSWORD', 'change-me-now');
    const existing = await this.userModel.findOne({ email }).exec();
    if (!existing) {
      const passwordHash = this.hashPassword(password);
      await this.userModel.create({
        email,
        passwordHash,
        name: 'Admin',
        role: 'admin',
        isActive: true,
      });
      this.logger.log(`Bootstrap admin user created: ${email}`);
    }
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userModel.findOne({ email, isActive: true }).exec();
    if (!user) return null;
    const hash = this.hashPassword(password);
    if (hash !== user.passwordHash) return null;
    return user;
  }

  login(user: User): { accessToken: string; user: { id: string; email: string; name: string; role: string } } {
    const payload = { sub: (user._id as any).toString(), email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    return {
      accessToken,
      user: { id: (user._id as any).toString(), email: user.email, name: user.name, role: user.role },
    };
  }

  hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }
}
