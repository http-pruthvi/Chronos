import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let repository: jest.Mocked<Partial<AuthRepository>>;
  let jwtService: jest.Mocked<Partial<JwtService>>;
  let configService: jest.Mocked<Partial<ConfigService>>;

  beforeEach(async () => {
    repository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      updateRefreshToken: jest.fn(),
    };

    jwtService = {
      signAsync: jest.fn(),
    };

    configService = {
      get: jest.fn((key: string) => {
        if (key === 'JWT_SECRET') return 'test_secret';
        if (key === 'JWT_REFRESH_SECRET') return 'test_refresh_secret';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthRepository, useValue: repository },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should login and return tokens when credentials are valid', async () => {
      const mockUser = {
        id: 'user-uuid',
        email: 'employee@demo.com',
        passwordHash: 'hashed_password',
        isActive: true,
        roleId: 'role-uuid',
        employeeId: 'employee-uuid',
        role: { name: 'EMPLOYEE' },
        employee: {} as any,
        refreshTokenHash: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      repository.findByEmail.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('new_refresh_hash');
      jwtService.signAsync
        .mockResolvedValueOnce('access_token') // Access Token
        .mockResolvedValueOnce('refresh_token'); // Refresh Token

      const result = await service.login({
        email: 'employee@demo.com',
        password: 'DemoPassword123!',
      });

      expect(repository.findByEmail).toHaveBeenCalledWith('employee@demo.com');
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'DemoPassword123!',
        'hashed_password',
      );
      expect(repository.updateRefreshToken).toHaveBeenCalledWith(
        'user-uuid',
        'new_refresh_hash',
      );
      expect(result).toEqual({
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        user: {
          id: 'user-uuid',
          email: 'employee@demo.com',
          role: 'EMPLOYEE',
          employeeId: 'employee-uuid',
        },
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      repository.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'nonexistent@demo.com',
          password: 'Password123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      const mockInactiveUser = {
        email: 'inactive@demo.com',
        passwordHash: 'hashed_pass',
        isActive: false,
      };

      repository.findByEmail.mockResolvedValue(mockInactiveUser as any);

      await expect(
        service.login({
          email: 'inactive@demo.com',
          password: 'Password123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password comparison fails', async () => {
      const mockUser = {
        email: 'employee@demo.com',
        passwordHash: 'hashed_password',
        isActive: true,
      };

      repository.findByEmail.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({
          email: 'employee@demo.com',
          password: 'WrongPassword!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('should rotate tokens if refresh token is valid', async () => {
      const mockUser = {
        id: 'user-uuid',
        email: 'employee@demo.com',
        isActive: true,
        refreshTokenHash: 'stored_refresh_hash',
        role: { name: 'EMPLOYEE' },
      };

      repository.findById.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('new_refresh_hash');
      jwtService.signAsync
        .mockResolvedValueOnce('new_access_token')
        .mockResolvedValueOnce('new_refresh_token');

      const result = await service.refresh(
        'user-uuid',
        'incoming_refresh_token',
      );

      expect(repository.findById).toHaveBeenCalledWith('user-uuid');
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'incoming_refresh_token',
        'stored_refresh_hash',
      );
      expect(repository.updateRefreshToken).toHaveBeenCalledWith(
        'user-uuid',
        'new_refresh_hash',
      );
      expect(result).toEqual({
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
      });
    });

    it('should clear refresh token hash and throw ForbiddenException if refresh token is invalid (violates rotation)', async () => {
      const mockUser = {
        id: 'user-uuid',
        email: 'employee@demo.com',
        isActive: true,
        refreshTokenHash: 'stored_refresh_hash',
      };

      repository.findById.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false); // token doesn't match

      await expect(
        service.refresh('user-uuid', 'stale_refresh_token'),
      ).rejects.toThrow(ForbiddenException);

      expect(repository.updateRefreshToken).toHaveBeenCalledWith(
        'user-uuid',
        null,
      );
    });
  });

  describe('logout', () => {
    it('should clear refresh token hash', async () => {
      repository.updateRefreshToken.mockResolvedValue({} as any);

      await service.logout('user-uuid');

      expect(repository.updateRefreshToken).toHaveBeenCalledWith(
        'user-uuid',
        null,
      );
    });
  });
});
