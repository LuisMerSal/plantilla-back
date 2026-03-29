import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, name, role } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Buscar el rol en la tabla Role (por name)
    let roleId: string | undefined = undefined;
    if (role) {
      const foundRole = await this.prisma.role.findFirst({
        where: { name: role },
      });
      if (foundRole) {
        roleId = foundRole.id;
      }
    } else {
      // Si no se envía rol, buscar el rol 'USER' por defecto
      const defaultRole = await this.prisma.role.findFirst({
        where: { name: 'USER' },
      });
      if (defaultRole) {
        roleId = defaultRole.id;
      }
    }

    // Create user
    const user = await this.prisma.user.create({
      data: {
        dni: `DNI_${Date.now()}`,
        firstName: name.split(' ')[0] || name,
        lastName: name.split(' ')[1] || 'User',
        email,
        password: hashedPassword,
        name,
        roleId,
      },
    });

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role?.name || 'USER',
    };

    const access_token = await this.jwtService.signAsync(payload, {
      expiresIn: '15m',
    });
    const refresh_token = await this.jwtService.signAsync(payload, {
      expiresIn: '7d',
    });

    // Store refresh token in database
    await this.storeRefreshToken(user.id, refresh_token);

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      // Verify refresh token
      const payload = await this.jwtService.verifyAsync(refreshToken);

      // Check if refresh token exists in database and is active
      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: { include: { role: true } } },
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new access token
      const newPayload = {
        sub: storedToken.user.id,
        email: storedToken.user.email,
        role: storedToken.user.role?.name || 'USER',
      };

      const access_token = await this.jwtService.signAsync(newPayload, {
        expiresIn: '15m',
      });

      return {
        access_token,
        user: {
          id: storedToken.user.id,
          email: storedToken.user.email,
          name: storedToken.user.name,
          role: storedToken.user.role,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      // Deactivate specific refresh token
      // Delete specific refresh token
      await this.prisma.refreshToken.deleteMany({
        where: {
          userId,
          token: refreshToken,
        },
      });
    } else {
      // Delete all refresh tokens for user
      await this.prisma.refreshToken.deleteMany({
        where: { userId },
      });
    }
  }

  private async storeRefreshToken(userId: string, token: string) {
    // Clean up expired tokens
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId,
        expiresAt: { lt: new Date() },
      },
    });

    // Store new refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
  }
}
