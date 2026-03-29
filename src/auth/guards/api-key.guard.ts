import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers['x-api-key'] as string;

    if (!apiKey) {
      throw new UnauthorizedException('API Key not found');
    }

    // Check if API key exists in database and is active
    const validApiKey = await this.prisma.apiKey.findFirst({
      where: {
        code: apiKey,
        isActive: true,
      },
    });

    if (!validApiKey) {
      throw new UnauthorizedException('Invalid API Key');
    }

    return true;
  }
}
