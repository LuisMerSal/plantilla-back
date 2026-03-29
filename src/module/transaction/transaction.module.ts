import { JwtService } from '@nestjs/jwt';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { PrismaService } from 'src/prisma/prisma.service';

import { Module } from '@nestjs/common';

@Module({
  imports: [],
  controllers: [TransactionController],
  providers: [TransactionService, JwtService, PrismaService],
})
export class TransactionModule {}
