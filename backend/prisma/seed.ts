import {
  PrismaClient,
  EmployeeStatus,
  SalaryComponentType,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Hash password
  const passwordHash = bcrypt.hashSync('DemoPassword123!', 12);

  // 1. Seed Permissions
  const permissionsData = [
    // Employee
    { code: 'employee:create', description: 'Create employee profile' },
    { code: 'employee:read', description: 'Read employee profile' },
    { code: 'employee:update', description: 'Update employee profile' },
    { code: 'employee:delete', description: 'Soft delete employee profile' },

    // Department
    { code: 'department:create', description: 'Create department' },
    { code: 'department:read', description: 'Read departments' },
    { code: 'department:update', description: 'Update department' },
    { code: 'department:delete', description: 'Soft delete department' },

    // Attendance
    { code: 'attendance:checkin', description: 'Self check-in/out' },
    { code: 'attendance:read', description: 'Read own attendance' },
    { code: 'attendance:read_team', description: 'Read team attendance' },
    {
      code: 'attendance:read_all',
      description: 'Read all employee attendance',
    },

    // Leave
    { code: 'leave:apply', description: 'Apply for leave' },
    { code: 'leave:read', description: 'Read own leave' },
    { code: 'leave:approve', description: 'Approve/reject team leave' },
    { code: 'leave:read_all', description: 'Read all leaves' },

    // Payroll
    { code: 'payroll:run', description: 'Create payroll runs' },
    { code: 'payroll:process', description: 'Process payslips' },
    { code: 'payroll:read', description: 'Read own payslips' },
    { code: 'payroll:read_all', description: 'Read all payslips' },

    // Audit Logs
    { code: 'audit:read', description: 'Read system audit logs' },
  ];

  const permissions: Record<string, any> = {};
  for (const p of permissionsData) {
    permissions[p.code] = await prisma.permission.upsert({
      where: { code: p.code },
      update: {},
      create: p,
    });
  }

  // 2. Seed Roles
  const rolesData = [
    { name: 'ADMIN', description: 'System Administrator with full access' },
    {
      name: 'HR',
      description:
        'Human Resources with access to employees, departments, and payroll',
    },
    { name: 'MANAGER', description: 'Team Manager with approval access' },
    {
      name: 'EMPLOYEE',
      description: 'Regular employee with self-service access',
    },
  ];

  const roles: Record<string, any> = {};
  for (const r of rolesData) {
    roles[r.name] = await prisma.role.upsert({
      where: { name: r.name },
      update: {},
      create: r,
    });
  }

  // 3. Map Permissions to Roles
  const rolePermissionsMap: Record<string, string[]> = {
    ADMIN: Object.keys(permissions),
    HR: [
      'employee:create',
      'employee:read',
      'employee:update',
      'department:read',
      'attendance:checkin',
      'attendance:read',
      'attendance:read_all',
      'leave:apply',
      'leave:read',
      'leave:approve',
      'leave:read_all',
      'payroll:run',
      'payroll:process',
      'payroll:read',
      'payroll:read_all',
    ],
    MANAGER: [
      'employee:read',
      'attendance:checkin',
      'attendance:read',
      'attendance:read_team',
      'leave:apply',
      'leave:read',
      'leave:approve',
      'payroll:read',
    ],
    EMPLOYEE: [
      'attendance:checkin',
      'attendance:read',
      'leave:apply',
      'leave:read',
      'payroll:read',
    ],
  };

  for (const [roleName, pCodes] of Object.entries(rolePermissionsMap)) {
    const roleId = roles[roleName].id;
    for (const code of pCodes) {
      const permissionId = permissions[code].id;
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId, permissionId },
        },
        update: {},
        create: { roleId, permissionId },
      });
    }
  }

  // 4. Seed Departments (temporarily without heads, we will update heads after seeding employees)
  const departmentsData = [
    { name: 'Engineering' },
    { name: 'Human Resources' },
    { name: 'Management' },
  ];

  const depts: Record<string, any> = {};
  for (const d of departmentsData) {
    depts[d.name] = await prisma.department.create({
      data: d,
    });
  }

  // 5. Seed Employees & Users
  // Employee 1: Admin
  const empAdmin = await prisma.employee.create({
    data: {
      employeeCode: 'EMP-0001',
      firstName: 'System',
      lastName: 'Admin',
      email: 'admin@demo.com',
      phone: '1234567890',
      designation: 'Chief Technology Officer',
      departmentId: depts['Management'].id,
      dateOfJoining: new Date('2025-01-01'),
      status: EmployeeStatus.ACTIVE,
    },
  });

  await prisma.user.create({
    data: {
      email: 'admin@demo.com',
      passwordHash,
      roleId: roles['ADMIN'].id,
      employeeId: empAdmin.id,
    },
  });

  // Employee 2: HR Manager
  const empHR = await prisma.employee.create({
    data: {
      employeeCode: 'EMP-0002',
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'hr@demo.com',
      phone: '2345678901',
      designation: 'HR Director',
      departmentId: depts['Human Resources'].id,
      managerId: empAdmin.id,
      dateOfJoining: new Date('2025-01-15'),
      status: EmployeeStatus.ACTIVE,
    },
  });

  await prisma.user.create({
    data: {
      email: 'hr@demo.com',
      passwordHash,
      roleId: roles['HR'].id,
      employeeId: empHR.id,
    },
  });

  // Update HR department head
  await prisma.department.update({
    where: { id: depts['Human Resources'].id },
    data: { headEmployeeId: empHR.id },
  });

  // Employee 3: Engineering Manager (MANAGER)
  const empManager = await prisma.employee.create({
    data: {
      employeeCode: 'EMP-0003',
      firstName: 'John',
      lastName: 'Smith',
      email: 'manager@demo.com',
      phone: '3456789012',
      designation: 'Engineering Manager',
      departmentId: depts['Engineering'].id,
      managerId: empAdmin.id,
      dateOfJoining: new Date('2025-02-01'),
      status: EmployeeStatus.ACTIVE,
    },
  });

  await prisma.user.create({
    data: {
      email: 'manager@demo.com',
      passwordHash,
      roleId: roles['MANAGER'].id,
      employeeId: empManager.id,
    },
  });

  // Update Engineering department head
  await prisma.department.update({
    where: { id: depts['Engineering'].id },
    data: { headEmployeeId: empManager.id },
  });

  // Employee 4: Software Engineer (EMPLOYEE) under empManager
  const empDeveloper = await prisma.employee.create({
    data: {
      employeeCode: 'EMP-0004',
      firstName: 'Alice',
      lastName: 'Johnson',
      email: 'employee@demo.com',
      phone: '4567890123',
      designation: 'Senior Software Engineer',
      departmentId: depts['Engineering'].id,
      managerId: empManager.id,
      dateOfJoining: new Date('2025-03-01'),
      status: EmployeeStatus.ACTIVE,
    },
  });

  await prisma.user.create({
    data: {
      email: 'employee@demo.com',
      passwordHash,
      roleId: roles['EMPLOYEE'].id,
      employeeId: empDeveloper.id,
    },
  });

  // 4 more employees to make 8 total
  // Employee 5: QA Engineer under empManager
  const empQA = await prisma.employee.create({
    data: {
      employeeCode: 'EMP-0005',
      firstName: 'Bob',
      lastName: 'Brown',
      email: 'bob@demo.com',
      phone: '5678901234',
      designation: 'QA Automation Engineer',
      departmentId: depts['Engineering'].id,
      managerId: empManager.id,
      dateOfJoining: new Date('2025-04-10'),
      status: EmployeeStatus.ACTIVE,
    },
  });
  await prisma.user.create({
    data: {
      email: 'bob@demo.com',
      passwordHash,
      roleId: roles['EMPLOYEE'].id,
      employeeId: empQA.id,
    },
  });

  // Employee 6: DevOps Engineer under empManager
  const empDevOps = await prisma.employee.create({
    data: {
      employeeCode: 'EMP-0006',
      firstName: 'Charlie',
      lastName: 'Davis',
      email: 'charlie@demo.com',
      phone: '6789012345',
      designation: 'DevOps Engineer',
      departmentId: depts['Engineering'].id,
      managerId: empManager.id,
      dateOfJoining: new Date('2025-05-01'),
      status: EmployeeStatus.ACTIVE,
    },
  });
  await prisma.user.create({
    data: {
      email: 'charlie@demo.com',
      passwordHash,
      roleId: roles['EMPLOYEE'].id,
      employeeId: empDevOps.id,
    },
  });

  // Employee 7: HR Recruiter under empHR
  const empHRRecruiter = await prisma.employee.create({
    data: {
      employeeCode: 'EMP-0007',
      firstName: 'Diana',
      lastName: 'Evans',
      email: 'diana@demo.com',
      phone: '7890123456',
      designation: 'Technical Recruiter',
      departmentId: depts['Human Resources'].id,
      managerId: empHR.id,
      dateOfJoining: new Date('2025-06-01'),
      status: EmployeeStatus.ACTIVE,
    },
  });
  await prisma.user.create({
    data: {
      email: 'diana@demo.com',
      passwordHash,
      roleId: roles['EMPLOYEE'].id,
      employeeId: empHRRecruiter.id,
    },
  });

  // Employee 8: Product Manager under empAdmin
  const empProductManager = await prisma.employee.create({
    data: {
      employeeCode: 'EMP-0008',
      firstName: 'Evan',
      lastName: 'Frank',
      email: 'evan@demo.com',
      phone: '8901234567',
      designation: 'Senior Product Manager',
      departmentId: depts['Management'].id,
      managerId: empAdmin.id,
      dateOfJoining: new Date('2025-07-01'),
      status: EmployeeStatus.ACTIVE,
    },
  });
  await prisma.user.create({
    data: {
      email: 'evan@demo.com',
      passwordHash,
      roleId: roles['EMPLOYEE'].id,
      employeeId: empProductManager.id,
    },
  });

  const allEmployees = [
    empAdmin,
    empHR,
    empManager,
    empDeveloper,
    empQA,
    empDevOps,
    empHRRecruiter,
    empProductManager,
  ];

  // 6. Seed Leave Types
  const leaveTypesData = [
    { name: 'Casual Leave', annualQuota: 12, carryForward: false },
    { name: 'Sick Leave', annualQuota: 10, carryForward: false },
    { name: 'Earned Leave', annualQuota: 15, carryForward: true },
    { name: 'Unpaid Leave', annualQuota: 0, carryForward: false },
  ];

  const leaveTypes: Record<string, any> = {};
  for (const lt of leaveTypesData) {
    leaveTypes[lt.name] = await prisma.leaveType.upsert({
      where: { name: lt.name },
      update: {},
      create: lt,
    });
  }

  // 7. Seed Leave Balances for 2026 for all employees
  for (const emp of allEmployees) {
    for (const lt of Object.values(leaveTypes)) {
      await prisma.leaveBalance.create({
        data: {
          employeeId: emp.id,
          leaveTypeId: lt.id,
          year: 2026,
          allocated: lt.annualQuota,
          used: 0,
        },
      });
    }
  }

  // 8. Seed Salary Components
  const componentsData = [
    {
      name: 'Basic Salary',
      type: SalaryComponentType.EARNING,
      isPercentage: false,
      defaultValue: 50000,
    },
    {
      name: 'House Rent Allowance (HRA)',
      type: SalaryComponentType.EARNING,
      isPercentage: false,
      defaultValue: 20000,
    },
    {
      name: 'Special Allowance',
      type: SalaryComponentType.EARNING,
      isPercentage: false,
      defaultValue: 10000,
    },
    {
      name: 'Bonus',
      type: SalaryComponentType.EARNING,
      isPercentage: false,
      defaultValue: 0,
    },
    {
      name: 'Provident Fund (PF)',
      type: SalaryComponentType.DEDUCTION,
      isPercentage: false,
      defaultValue: 6000,
    },
    {
      name: 'Tax Deducted at Source (TDS)',
      type: SalaryComponentType.DEDUCTION,
      isPercentage: false,
      defaultValue: 5000,
    },
    {
      name: 'Professional Tax',
      type: SalaryComponentType.DEDUCTION,
      isPercentage: false,
      defaultValue: 200,
    },
  ];

  const components: Record<string, any> = {};
  for (const comp of componentsData) {
    components[comp.name] = await prisma.salaryComponent.upsert({
      where: { name: comp.name },
      update: {},
      create: comp,
    });
  }

  // 9. Seed Salary Structure for each employee
  // Basic structures based on designation
  const salaryMap: Record<
    string,
    { basic: number; hra: number; allowance: number; pf: number; tds: number }
  > = {
    'Chief Technology Officer': {
      basic: 120000,
      hra: 48000,
      allowance: 20000,
      pf: 14400,
      tds: 25000,
    },
    'HR Director': {
      basic: 70000,
      hra: 28000,
      allowance: 10000,
      pf: 8400,
      tds: 10000,
    },
    'Engineering Manager': {
      basic: 90000,
      hra: 36000,
      allowance: 15000,
      pf: 10800,
      tds: 15000,
    },
    'Senior Software Engineer': {
      basic: 65000,
      hra: 26000,
      allowance: 10000,
      pf: 7800,
      tds: 8000,
    },
    'QA Automation Engineer': {
      basic: 45000,
      hra: 18000,
      allowance: 8000,
      pf: 5400,
      tds: 4000,
    },
    'DevOps Engineer': {
      basic: 55000,
      hra: 22000,
      allowance: 8000,
      pf: 6600,
      tds: 6000,
    },
    'Technical Recruiter': {
      basic: 40000,
      hra: 16000,
      allowance: 5000,
      pf: 4800,
      tds: 3000,
    },
    'Senior Product Manager': {
      basic: 80000,
      hra: 32000,
      allowance: 12000,
      pf: 9600,
      tds: 12000,
    },
  };

  for (const emp of allEmployees) {
    const sal = salaryMap[emp.designation] || {
      basic: 30000,
      hra: 12000,
      allowance: 5000,
      pf: 3600,
      tds: 2000,
    };
    const empStructure = [
      { componentId: components['Basic Salary'].id, value: sal.basic },
      {
        componentId: components['House Rent Allowance (HRA)'].id,
        value: sal.hra,
      },
      { componentId: components['Special Allowance'].id, value: sal.allowance },
      { componentId: components['Provident Fund (PF)'].id, value: sal.pf },
      {
        componentId: components['Tax Deducted at Source (TDS)'].id,
        value: sal.tds,
      },
      { componentId: components['Professional Tax'].id, value: 200 },
    ];

    for (const struct of empStructure) {
      await prisma.employeeSalaryStructure.create({
        data: {
          employeeId: emp.id,
          componentId: struct.componentId,
          value: struct.value,
          effectiveFrom: new Date('2025-01-01'),
        },
      });
    }
  }

  // 10. Seed Leave Requests & Deduct Balances
  console.log('Seeding leave requests...');
  const casualLeaveType = leaveTypes['Casual Leave'];
  const sickLeaveType = leaveTypes['Sick Leave'];

  // Leave Request 1: Approved
  await prisma.leaveRequest.create({
    data: {
      employeeId: empDeveloper.id,
      leaveTypeId: casualLeaveType.id,
      startDate: new Date('2026-06-08'),
      endDate: new Date('2026-06-10'),
      days: 3,
      reason: 'Family event check',
      status: 'APPROVED',
      approverId: empManager.id,
      decidedAt: new Date('2026-06-05'),
    },
  });
  await prisma.leaveBalance.updateMany({
    where: {
      employeeId: empDeveloper.id,
      leaveTypeId: casualLeaveType.id,
      year: 2026,
    },
    data: { used: { increment: 3 } },
  });

  // Leave Request 2: Approved
  await prisma.leaveRequest.create({
    data: {
      employeeId: empQA.id,
      leaveTypeId: sickLeaveType.id,
      startDate: new Date('2026-06-15'),
      endDate: new Date('2026-06-16'),
      days: 2,
      reason: 'Fever recovery',
      status: 'APPROVED',
      approverId: empManager.id,
      decidedAt: new Date('2026-06-14'),
    },
  });
  await prisma.leaveBalance.updateMany({
    where: {
      employeeId: empQA.id,
      leaveTypeId: sickLeaveType.id,
      year: 2026,
    },
    data: { used: { increment: 2 } },
  });

  // Leave Request 3: Pending
  await prisma.leaveRequest.create({
    data: {
      employeeId: empDevOps.id,
      leaveTypeId: casualLeaveType.id,
      startDate: new Date('2026-07-10'),
      endDate: new Date('2026-07-12'),
      days: 3,
      reason: 'Personal travel plans',
      status: 'PENDING',
    },
  });

  // 11. Seed Attendance logs for June 2026
  console.log('Seeding attendance logs...');
  const workdays: Date[] = [];
  const startJune = new Date('2026-06-01');
  const endJune = new Date('2026-06-30');

  for (let d = new Date(startJune); d <= endJune; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // Monday-Friday
      workdays.push(new Date(d));
    }
  }

  for (const emp of allEmployees) {
    for (const date of workdays) {
      // 95% attendance rate
      if (Math.random() > 0.05) {
        // Late probability 15%
        const isLate = Math.random() < 0.15;
        const checkInHour = isLate ? 9 : 8;
        const checkInMin = isLate
          ? Math.floor(Math.random() * 25) + 16
          : Math.floor(Math.random() * 59); // late is post 09:15

        const checkIn = new Date(date);
        checkIn.setHours(checkInHour, checkInMin, 0);

        const checkOut = new Date(date);
        checkOut.setHours(18, Math.floor(Math.random() * 30), 0); // 18:00 to 18:30

        const workedMinutes = Math.floor(
          (checkOut.getTime() - checkIn.getTime()) / 60000,
        );
        const status =
          checkInHour === 9 && checkInMin > 15 ? 'LATE' : 'PRESENT';

        await prisma.attendance.create({
          data: {
            employeeId: emp.id,
            date,
            checkIn,
            checkOut,
            workedMinutes,
            status,
          },
        });
      }
    }
  }

  // 12. Seed Historical Payroll Runs (March, April, May 2026)
  console.log('Seeding historical payroll runs...');
  const runsData = [
    { month: 3, year: 2026, processedAt: new Date('2026-03-31') },
    { month: 4, year: 2026, processedAt: new Date('2026-04-30') },
    { month: 5, year: 2026, processedAt: new Date('2026-05-31') },
  ];

  for (const run of runsData) {
    const pr = await prisma.payrollRun.create({
      data: {
        month: run.month,
        year: run.year,
        status: 'PAID',
        processedAt: run.processedAt,
      },
    });

    for (const emp of allEmployees) {
      const sal = salaryMap[emp.designation] || {
        basic: 30000,
        hra: 12000,
        allowance: 5000,
        pf: 3600,
        tds: 2000,
      };

      const grossPay = sal.basic + sal.hra + sal.allowance;
      const totalDeductions = sal.pf + sal.tds + 200;
      const netPay = grossPay - totalDeductions;

      // JSON breakdown for payslip
      const lineItems = [
        {
          name: 'Basic Salary',
          type: 'EARNING',
          originalValue: sal.basic,
          proratedValue: sal.basic,
        },
        {
          name: 'House Rent Allowance (HRA)',
          type: 'EARNING',
          originalValue: sal.hra,
          proratedValue: sal.hra,
        },
        {
          name: 'Special Allowance',
          type: 'EARNING',
          originalValue: sal.allowance,
          proratedValue: sal.allowance,
        },
        {
          name: 'Provident Fund (PF)',
          type: 'DEDUCTION',
          originalValue: sal.pf,
          proratedValue: sal.pf,
        },
        {
          name: 'Tax Deducted at Source (TDS)',
          type: 'DEDUCTION',
          originalValue: sal.tds,
          proratedValue: sal.tds,
        },
        {
          name: 'Professional Tax',
          type: 'DEDUCTION',
          originalValue: 200,
          proratedValue: 200,
        },
      ];

      await prisma.payslip.create({
        data: {
          payrollRunId: pr.id,
          employeeId: emp.id,
          grossPay,
          totalDeductions,
          netPay,
          lineItems,
        },
      });
    }
  }

  console.log('Seeding complete successfully.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
