import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { LeavesModule } from './modules/leaves/leaves.module';
import { PayrollModule } from './modules/payroll/payroll.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AIModule } from './modules/ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    DepartmentsModule,
    EmployeesModule,
    AuditLogsModule,
    AttendanceModule,
    LeavesModule,
    PayrollModule,
    DashboardModule,
    NotificationsModule,
    AIModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
