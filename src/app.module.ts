import { TransactionModule } from './module/transaction/transaction.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ConsultModule } from './consult/consult.module';
import { DashboardModule } from './dashboard/dashboard.module';

// Determine environment and .env file path
const environment = process.env.NODE_ENV || 'dev';
const envFilePath = `environments/${environment}/.env`;

@Module({
  imports: [
    TransactionModule,
    ConfigModule.forRoot({
      envFilePath,
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    ConsultModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
