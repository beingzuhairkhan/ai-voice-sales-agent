import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { User } from '../users/user.schema';
export declare class AuthService implements OnModuleInit {
    private userModel;
    private jwtService;
    private config;
    private readonly logger;
    constructor(userModel: Model<User>, jwtService: JwtService, config: ConfigService);
    onModuleInit(): Promise<void>;
    private ensureAdminUser;
    validateUser(email: string, password: string): Promise<User | null>;
    login(user: User): {
        accessToken: string;
        user: {
            id: string;
            email: string;
            name: string;
            role: string;
        };
    };
    hashPassword(password: string): string;
}
