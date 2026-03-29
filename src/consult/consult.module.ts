import { Module } from '@nestjs/common';
import { ConsultService } from './consult.service';
import { ConsultController } from './consult.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { GenericConnectionModule } from '../external-services/generic-connection/generic-connection.module';
import { TransactionService } from '../module/transaction/transaction.service';

@Module({
  imports: [PrismaModule, AuthModule, GenericConnectionModule],
  controllers: [ConsultController],
  providers: [ConsultService, TransactionService],
  exports: [ConsultService],
})
export class ConsultModule {}
