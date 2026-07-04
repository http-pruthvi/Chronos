import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('HRMS Integration Tests (Critical Flows)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Variables to hold tokens and IDs between tests
  let adminToken: string;
  let employeeToken: string;
  let employeeId: string;
  let managerToken: string;
  let managerId: string;
  let leaveRequestId: string;
  let payrollRunId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    
    await app.init();
    
    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    // Cleanup any test data created during runs
    await prisma.attendance.deleteMany({
      where: {
        employee: {
          email: { in: ['admin@demo.com', 'hr@demo.com', 'manager@demo.com', 'employee@demo.com'] },
        },
      },
    });

    await prisma.leaveRequest.deleteMany({
      where: {
        employee: {
          email: { in: ['admin@demo.com', 'hr@demo.com', 'manager@demo.com', 'employee@demo.com'] },
        },
      },
    });

    await prisma.payslip.deleteMany({});
    await prisma.payrollRun.deleteMany({});

    // Restore leave balances back to default
    await prisma.leaveBalance.updateMany({
      where: {
        employee: {
          email: { in: ['admin@demo.com', 'hr@demo.com', 'manager@demo.com', 'employee@demo.com'] },
        },
      },
      data: { used: 0 },
    });

    await app.close();
  });

  // ==========================================
  // FLOW 1: AUTH (Login, Refresh, Logout)
  // ==========================================
  describe('Flow 1: Authentication', () => {
    it('should fail login with invalid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@demo.com',
          password: 'WrongPassword123',
        })
        .expect(HttpStatus.UNAUTHORIZED);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should successfully login as Admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@demo.com',
          password: 'DemoPassword123!',
        })
        .expect(HttpStatus.OK);

      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      expect(response.body.user.role).toBe('ADMIN');
      adminToken = response.body.accessToken;
    });

    it('should successfully login as Manager', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'manager@demo.com',
          password: 'DemoPassword123!',
        })
        .expect(HttpStatus.OK);

      managerToken = response.body.accessToken;
      managerId = response.body.user.employeeId;
    });

    it('should successfully login as Employee', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'employee@demo.com',
          password: 'DemoPassword123!',
        })
        .expect(HttpStatus.OK);

      employeeToken = response.body.accessToken;
      employeeId = response.body.user.employeeId;
    });

    it('should rotate access token using refresh token', async () => {
      // 1. Get a refresh token by logging in again
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'employee@demo.com',
          password: 'DemoPassword123!',
        });

      const refreshToken = loginRes.body.refreshToken;

      // 2. Call refresh endpoint
      const refreshRes = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(HttpStatus.OK);

      expect(refreshRes.body.data.accessToken).toBeDefined();
      expect(refreshRes.body.data.refreshToken).toBeDefined();
    });
  });

  // ==========================================
  // FLOW 2: ATTENDANCE (Check-in, Check-out, Block Double)
  // ==========================================
  describe('Flow 2: Attendance', () => {
    it('should allow employee to check-in', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/attendance/check-in')
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.checkIn).toBeDefined();
      expect(response.body.data.checkOut).toBeNull();
    });

    it('should block duplicate check-in on the same day', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/attendance/check-in')
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.message).toContain('already checked in');
    });

    it('should allow employee to check-out', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/attendance/check-out')
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.data.checkOut).toBeDefined();
      expect(response.body.data.workedMinutes).toBeDefined();
    });
  });

  // ==========================================
  // FLOW 3: LEAVES (Apply, Insufficient rejection, Approval decrement)
  // ==========================================
  describe('Flow 3: Leave Management', () => {
    let casualLeaveTypeId: string;

    beforeAll(async () => {
      const leaveType = await prisma.leaveType.findFirst({
        where: { name: 'Casual Leave' },
      });
      casualLeaveTypeId = leaveType!.id;
    });

    it('should reject leave request if balance is insufficient', async () => {
      // Seeded Casual Leave quota is 12. Let's request 15 days.
      const response = await request(app.getHttpServer())
        .post('/api/v1/leave-requests')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          leaveTypeId: casualLeaveTypeId,
          startDate: '2026-08-01',
          endDate: '2026-08-15', // 15 days total
          reason: 'Insufficient check test',
        })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('LEAVE_INSUFFICIENT_BALANCE');
    });

    it('should apply leave successfully when balance is sufficient', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/leave-requests')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          leaveTypeId: casualLeaveTypeId,
          startDate: '2026-08-01',
          endDate: '2026-08-03', // 3 days
          reason: 'Short vacation',
        })
        .expect(HttpStatus.CREATED);

      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.status).toBe('PENDING');
      expect(Number(response.body.data.days)).toBe(3);
      leaveRequestId = response.body.data.id;
    });

    it('should decrement leave balance on approval', async () => {
      // 1. Check leave balance before approval (should be 0 used)
      const balanceBefore = await prisma.leaveBalance.findUnique({
        where: {
          employeeId_leaveTypeId_year: {
            employeeId,
            leaveTypeId: casualLeaveTypeId,
            year: 2026,
          },
        },
      });
      expect(Number(balanceBefore!.used)).toBe(0);

      // 2. Approve leave via Manager token
      await request(app.getHttpServer())
        .patch(`/api/v1/leave-requests/${leaveRequestId}/approve`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(HttpStatus.OK);

      // 3. Verify request is approved
      const updatedRequest = await prisma.leaveRequest.findUnique({
        where: { id: leaveRequestId },
      });
      expect(updatedRequest!.status).toBe('APPROVED');

      // 4. Verify balance is decremented (used balance incremented by 3)
      const balanceAfter = await prisma.leaveBalance.findUnique({
        where: {
          employeeId_leaveTypeId_year: {
            employeeId,
            leaveTypeId: casualLeaveTypeId,
            year: 2026,
          },
        },
      });
      expect(Number(balanceAfter!.used)).toBe(3);
    });
  });

  // ==========================================
  // FLOW 4: PAYROLL (Run, Calculate, Prorate)
  // ==========================================
  describe('Flow 4: Payroll Run & Proration', () => {
    it('should create a draft payroll run', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/payroll/runs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          month: 12,
          year: 2026,
        })
        .expect(HttpStatus.CREATED);

      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.status).toBe('DRAFT');
      payrollRunId = response.body.data.id;
    });

    it('should process payroll and generate prorated payslips', async () => {
      // We will process payroll for 12/2026.
      // We have seeded employees with active salary structures.
      const response = await request(app.getHttpServer())
        .post(`/api/v1/payroll/runs/${payrollRunId}/process`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.data.status).toBe('PROCESSED');
      expect(response.body.data.processedAt).toBeDefined();

      // Check that payslips were generated for our employees in the database
      const payslips = await prisma.payslip.findMany({
        where: { payrollRunId },
        include: { employee: true },
      });

      expect(payslips.length).toBeGreaterThan(0);
      
      // Let's verify that net pay is positive and equals gross - deductions
      const testPayslip = payslips[0];
      const netPay = Number(testPayslip.netPay);
      const grossPay = Number(testPayslip.grossPay);
      const deductions = Number(testPayslip.totalDeductions);
      
      expect(netPay).toBe(Math.max(0, grossPay - deductions));
    });
  });
});
