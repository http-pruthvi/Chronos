import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthRepository } from './auth.repository';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;
    const user = await this.authRepository.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role.name,
    );

    // Hash and store the refresh token
    const salt = await bcrypt.genSalt(12);
    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, salt);
    await this.authRepository.updateRefreshToken(user.id, refreshTokenHash);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role.name,
        employeeId: user.employeeId,
      },
    };
  }

  async refresh(
    userId: string,
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.authRepository.findById(userId);

    if (!user || !user.refreshTokenHash || !user.isActive) {
      throw new ForbiddenException('Access Denied');
    }

    const isRefreshTokenValid = await bcrypt.compare(
      refreshToken,
      user.refreshTokenHash,
    );
    if (!isRefreshTokenValid) {
      // Rotation violation or invalid token - revoke immediately
      await this.authRepository.updateRefreshToken(userId, null);
      throw new ForbiddenException('Access Denied');
    }

    // Generate new tokens
    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role.name,
    );

    // Hash and store new refresh token (Rotate)
    const salt = await bcrypt.genSalt(12);
    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, salt);
    await this.authRepository.updateRefreshToken(user.id, refreshTokenHash);

    return tokens;
  }

  async logout(userId: string): Promise<void> {
    await this.authRepository.updateRefreshToken(userId, null);
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const jwtPayload = {
      sub: userId,
      email,
      role,
    };

    const accessTokenSecret =
      this.configService.get<string>('JWT_SECRET') || 'default_secret';
    const refreshTokenSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      'default_refresh_secret';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(jwtPayload, {
        secret: accessTokenSecret,
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(jwtPayload, {
        secret: refreshTokenSecret,
        expiresIn: '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
