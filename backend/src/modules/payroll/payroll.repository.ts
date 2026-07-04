import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PayrollRunStatus, Prisma } from '@prisma/client';

@Injectable()
export class PayrollRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findRunByMonthYear(month: number, year: number) {
    return this.prisma.payrollRun.findUnique({
      where: {
        month_year: { month, year },
      },
    });
  }

  async findRunById(id: string) {
    return this.prisma.payrollRun.findUnique({
      where: { id },
      include: {
        payslips: {
          include: {
            employee: true,
          },
        },
      },
    });
  }

  async createRun(month: number, year: number) {
    return this.prisma.payrollRun.create({
      data: {
        month,
        year,
        status: PayrollRunStatus.DRAFT,
      },
    });
  }

  async updateRunStatus(
    id: string,
    status: PayrollRunStatus,
    processedAt?: Date | null,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    return client.payrollRun.update({
      where: { id },
      data: {
        status,
        processedAt: processedAt !== undefined ? processedAt : undefined,
      },
    });
  }

  async deletePayslipsByRunId(
    payrollRunId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    return client.payslip.deleteMany({
      where: { payrollRunId },
    });
  }

  async createPayslip(
    data: {
      payrollRunId: string;
      employeeId: string;
      grossPay: number;
      totalDeductions: number;
      netPay: number;
      lineItems: any;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    return client.payslip.create({
      data: {
        payrollRunId: data.payrollRunId,
        employeeId: data.employeeId,
        grossPay: new Prisma.Decimal(data.grossPay),
        totalDeductions: new Prisma.Decimal(data.totalDeductions),
        netPay: new Prisma.Decimal(data.netPay),
        lineItems: data.lineItems,
      },
    });
  }

  async findOwnPayslips(employeeId: string) {
    return this.prisma.payslip.findMany({
      where: { employeeId },
      include: {
        payrollRun: true,
      },
      orderBy: {
        generatedAt: 'desc',
      },
    });
  }

  async findPayslipById(id: string) {
    return this.prisma.payslip.findUnique({
      where: { id },
      include: {
        employee: true,
        payrollRun: true,
      },
    });
  }

  async findAllRuns() {
    return this.prisma.payrollRun.findMany({
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }
}
