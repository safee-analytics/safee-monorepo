import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { OdooHRService } from "./hr.service.js";
import { OdooDatabaseService } from "./database.service.js";
import { type OdooClient, createOdooClient } from "./client.service.js";
import { odooClient } from "./client.js";
import { type DrizzleClient, type RedisClient, schema, connectTest } from "@safee/database";
import { eq } from "drizzle-orm";
import { initTestServerContext } from "../../test-helpers/testServerContext.js";
import { getServerContext } from "../../serverContext.js";
import { pino } from "pino";

const ODOO_URL = process.env.ODOO_URL || "http://localhost:18069";
const ODOO_MASTER_PASSWORD = process.env.ODOO_ADMIN_PASSWORD || "admin";

describe("Odoo HR Service Integration Tests", () => {
  let drizzle: DrizzleClient;
  let closeDrizzle: () => Promise<void>;
  let redis: RedisClient;
  let client: OdooClient;
  let hrService: OdooHRService;
  let databaseService: OdooDatabaseService;
  let testOrganizationId: string;
  let testDatabaseName: string;
  let testAdminLogin: string;
  let testAdminPassword: string;
  const createdRecords: { model: string; id: number }[] = [];

  beforeAll(async () => {
    ({ drizzle, close: closeDrizzle } = await connectTest({ appName: "odoo-hr-integration-test" }));
    redis = await initTestServerContext(drizzle);
    const ctx = getServerContext();
    databaseService = new OdooDatabaseService(ctx);

    const [org] = await drizzle
      .insert(schema.organizations)
      .values({
        name: "HR Test Organization",
        slug: "hr-test-org",
      })
      .returning();
    testOrganizationId = org.id;

    const provisionResult = await databaseService.provisionDatabase(testOrganizationId);
    testDatabaseName = provisionResult.databaseName;
    testAdminLogin = provisionResult.adminLogin;
    testAdminPassword = provisionResult.adminPassword;

    // Use admin credentials for testing
    const logger = pino({ level: "silent" });
    client = createOdooClient(
      {
        url: ODOO_URL,
        port: 18069,
        database: testDatabaseName,
        username: testAdminLogin,
        password: testAdminPassword,
      },
      logger,
    );
    await client.authenticate();

    // Install required HR modules
    const modulesToInstall = ["hr", "hr_holidays", "hr_contract", "hr_payroll"];
    for (const moduleName of modulesToInstall) {
      try {
        const moduleIds = await client.search("ir.module.module", [["name", "=", moduleName]]);
        if (moduleIds.length > 0) {
          await client.execute("ir.module.module", "button_immediate_install", [moduleIds]);
        }
      } catch (error) {
        console.warn(`Failed to install module ${moduleName}:`, error);
      }
    }

    hrService = new OdooHRService(client);

    const departmentId = await client.create("hr.department", {
      name: "Test Department",
    });
    createdRecords.push({ model: "hr.department", id: departmentId });

    const employeeId = await client.create("hr.employee", {
      name: "Test Employee",
      work_email: "test@example.com",
      department_id: departmentId,
    });
    createdRecords.push({ model: "hr.employee", id: employeeId });

    const leaveTypeId = await client.create("hr.leave.type", {
      name: "Test Leave Type",
      request_unit: "day",
      time_type: "leave",
      leave_validation_type: "no_validation",
      requires_allocation: false,
      employee_requests: true,
    });
    createdRecords.push({ model: "hr.leave.type", id: leaveTypeId });

    const contractId = await client.create("hr.contract", {
      name: "Test Contract",
      employee_id: employeeId,
      date_start: "2024-01-01",
      state: "open",
      wage: 5000,
      wage_type: "monthly",
    });
    createdRecords.push({ model: "hr.contract", id: contractId });

    const leaveAllocationId = await client.create("hr.leave.allocation", {
      name: "Test Allocation",
      employee_id: employeeId,
      holiday_status_id: leaveTypeId,
      number_of_days: 20,
      state: "validate",
    });
    createdRecords.push({ model: "hr.leave.allocation", id: leaveAllocationId });

    const leaveRequestId = await client.create("hr.leave", {
      employee_id: employeeId,
      holiday_status_id: leaveTypeId,
      date_from: "2024-06-01",
      date_to: "2024-06-05",
      number_of_days: 5,
      state: "validate",
    });
    createdRecords.push({ model: "hr.leave", id: leaveRequestId });

    const payslipId = await client.create("hr.payslip", {
      number: "TEST/001",
      employee_id: employeeId,
      contract_id: contractId,
      date_from: "2024-01-01",
      date_to: "2024-01-31",
      state: "done",
      net_wage: 5000,
    });
    createdRecords.push({ model: "hr.payslip", id: payslipId });

    const payslipLineId = await client.create("hr.payslip.line", {
      slip_id: payslipId,
      name: "Basic Salary",
      code: "BASIC",
      amount: 5000,
      quantity: 1,
      rate: 100,
    });
    createdRecords.push({ model: "hr.payslip.line", id: payslipLineId });
  }, 120000); // 120 second timeout for beforeAll due to Odoo provisioning and module installation

  afterAll(async () => {
    for (const record of createdRecords.reverse()) {
      try {
        await client.unlink(record.model, [record.id]);
      } catch (error) {
        console.warn(`Failed to delete ${record.model} ${record.id}:`, error);
      }
    }

    try {
      await odooClient.dropDatabase(ODOO_MASTER_PASSWORD, testDatabaseName);
    } catch (error) {
      console.warn(`Failed to delete Odoo database ${testDatabaseName}:`, error);
    }

    await drizzle
      .delete(schema.odooDatabases)
      .where(eq(schema.odooDatabases.organizationId, testOrganizationId));
    await drizzle.delete(schema.organizations).where(eq(schema.organizations.id, testOrganizationId));

    await redis.quit();
    await closeDrizzle();
  });

  describe("getEmployees", () => {
    it("should fetch all active employees including test data", async () => {
      const employees = await hrService.getEmployees();

      expect(Array.isArray(employees)).toBe(true);
      expect(employees.length).toBeGreaterThan(0);

      const testEmployee = employees.find((e) => e.name === "Test Employee");
      expect(testEmployee).toBeDefined();
      expect(testEmployee?.work_email).toBe("test@example.com");
    });

    it("should filter employees by department", async () => {
      const testDept = createdRecords.find((r) => r.model === "hr.department");
      const filtered = await hrService.getEmployees({ departmentId: testDept!.id });

      expect(filtered.length).toBeGreaterThan(0);
      const testEmployee = filtered.find((e) => e.name === "Test Employee");
      expect(testEmployee).toBeDefined();
    });
  });

  describe("getEmployee", () => {
    it("should fetch single employee by ID", async () => {
      const testEmp = createdRecords.find((r) => r.model === "hr.employee");
      const employee = await hrService.getEmployee(testEmp!.id);

      expect(employee).not.toBeNull();
      expect(employee?.id).toBe(testEmp!.id);
      expect(employee?.name).toBe("Test Employee");
    });

    it("should return null for non-existent employee", async () => {
      const employee = await hrService.getEmployee(999999);
      expect(employee).toBeNull();
    });
  });

  describe("getDepartments", () => {
    it("should fetch all active departments including test data", async () => {
      const departments = await hrService.getDepartments();

      expect(Array.isArray(departments)).toBe(true);
      expect(departments.length).toBeGreaterThan(0);

      const testDept = departments.find((d) => d.name === "Test Department");
      expect(testDept).toBeDefined();
      expect(testDept?.name).toBe("Test Department");
    });
  });

  describe("getDepartment", () => {
    it("should fetch single department by ID", async () => {
      const testDept = createdRecords.find((r) => r.model === "hr.department");
      const department = await hrService.getDepartment(testDept!.id);

      expect(department).not.toBeNull();
      expect(department?.id).toBe(testDept!.id);
      expect(department?.name).toBe("Test Department");
    });

    it("should return null for non-existent department", async () => {
      const department = await hrService.getDepartment(999999);
      expect(department).toBeNull();
    });
  });

  describe("getContracts", () => {
    it("should fetch all contracts including test data", async () => {
      const contracts = await hrService.getContracts();

      expect(Array.isArray(contracts)).toBe(true);
      expect(contracts.length).toBeGreaterThan(0);

      const testContract = contracts.find((c) => c.name === "Test Contract");
      expect(testContract).toBeDefined();
      expect(testContract?.wage).toBe(5000);
    });

    it("should filter contracts by employee", async () => {
      const testEmp = createdRecords.find((r) => r.model === "hr.employee");
      const filtered = await hrService.getContracts({ employeeId: testEmp!.id });

      expect(filtered.length).toBeGreaterThan(0);
      const testContract = filtered.find((c) => c.name === "Test Contract");
      expect(testContract).toBeDefined();
    });

    it("should filter contracts by state", async () => {
      const filtered = await hrService.getContracts({ state: "open" });

      expect(filtered.length).toBeGreaterThan(0);
      filtered.forEach((contract) => {
        expect(contract.state).toBe("open");
      });
    });
  });

  describe("getContract", () => {
    it("should fetch single contract by ID", async () => {
      const testContract = createdRecords.find((r) => r.model === "hr.contract");
      const contract = await hrService.getContract(testContract!.id);

      expect(contract).not.toBeNull();
      expect(contract?.id).toBe(testContract!.id);
      expect(contract?.name).toBe("Test Contract");
    });

    it("should return null for non-existent contract", async () => {
      const contract = await hrService.getContract(999999);
      expect(contract).toBeNull();
    });
  });

  describe("getLeaveTypes", () => {
    it("should fetch all active leave types including test data", async () => {
      const leaveTypes = await hrService.getLeaveTypes();

      expect(Array.isArray(leaveTypes)).toBe(true);
      expect(leaveTypes.length).toBeGreaterThan(0);

      const testLeaveType = leaveTypes.find((lt) => lt.name === "Test Leave Type");
      expect(testLeaveType).toBeDefined();
      expect(testLeaveType?.name).toBe("Test Leave Type");
    });
  });

  describe("getLeaveType", () => {
    it("should fetch single leave type by ID", async () => {
      const testLeaveType = createdRecords.find((r) => r.model === "hr.leave.type");
      const leaveType = await hrService.getLeaveType(testLeaveType!.id);

      expect(leaveType).not.toBeNull();
      expect(leaveType?.id).toBe(testLeaveType!.id);
      expect(leaveType?.name).toBe("Test Leave Type");
    });

    it("should return null for non-existent leave type", async () => {
      const leaveType = await hrService.getLeaveType(999999);
      expect(leaveType).toBeNull();
    });
  });

  describe("getLeaveRequests", () => {
    it("should fetch all leave requests including test data", async () => {
      const leaves = await hrService.getLeaveRequests();

      expect(Array.isArray(leaves)).toBe(true);
      expect(leaves.length).toBeGreaterThan(0);

      const testLeave = leaves.find((l) => l.number_of_days === 5 && l.state === "validate");
      expect(testLeave).toBeDefined();
    });

    it("should filter leave requests by employee", async () => {
      const testEmp = createdRecords.find((r) => r.model === "hr.employee");
      const filtered = await hrService.getLeaveRequests({ employeeId: testEmp!.id });

      expect(filtered.length).toBeGreaterThan(0);
      filtered.forEach((leave) => {
        expect((leave.employee_id as [number, string])[0]).toBe(testEmp!.id);
      });
    });

    it("should filter leave requests by state", async () => {
      const filtered = await hrService.getLeaveRequests({ state: "validate" });

      expect(filtered.length).toBeGreaterThan(0);
      filtered.forEach((leave) => {
        expect(leave.state).toBe("validate");
      });
    });
  });

  describe("getLeaveRequest", () => {
    it("should fetch single leave request by ID", async () => {
      const testLeave = createdRecords.find((r) => r.model === "hr.leave");
      const leave = await hrService.getLeaveRequest(testLeave!.id);

      expect(leave).not.toBeNull();
      expect(leave?.id).toBe(testLeave!.id);
      expect(leave?.number_of_days).toBe(5);
    });

    it("should return null for non-existent leave request", async () => {
      const leave = await hrService.getLeaveRequest(999999);
      expect(leave).toBeNull();
    });
  });

  describe("getLeaveAllocations", () => {
    it("should fetch all leave allocations including test data", async () => {
      const allocations = await hrService.getLeaveAllocations();

      expect(Array.isArray(allocations)).toBe(true);
      expect(allocations.length).toBeGreaterThan(0);

      const testAllocation = allocations.find((a) => a.number_of_days === 20 && a.state === "validate");
      expect(testAllocation).toBeDefined();
    });

    it("should filter allocations by employee", async () => {
      const testEmp = createdRecords.find((r) => r.model === "hr.employee");
      const filtered = await hrService.getLeaveAllocations({ employeeId: testEmp!.id });

      expect(filtered.length).toBeGreaterThan(0);
      filtered.forEach((allocation) => {
        expect((allocation.employee_id as [number, string])[0]).toBe(testEmp!.id);
      });
    });
  });

  describe("getLeaveAllocation", () => {
    it("should fetch single leave allocation by ID", async () => {
      const testAllocation = createdRecords.find((r) => r.model === "hr.leave.allocation");
      const allocation = await hrService.getLeaveAllocation(testAllocation!.id);

      expect(allocation).not.toBeNull();
      expect(allocation?.id).toBe(testAllocation!.id);
      expect(allocation?.number_of_days).toBe(20);
    });

    it("should return null for non-existent allocation", async () => {
      const allocation = await hrService.getLeaveAllocation(999999);
      expect(allocation).toBeNull();
    });
  });

  describe("getPayslips", () => {
    it("should fetch all payslips including test data", async () => {
      const payslips = await hrService.getPayslips();

      expect(Array.isArray(payslips)).toBe(true);
      expect(payslips.length).toBeGreaterThan(0);

      const testPayslip = payslips.find((p) => p.number === "TEST/001");
      expect(testPayslip).toBeDefined();
      expect(testPayslip?.net_wage).toBe(5000);
    });

    it("should filter payslips by employee", async () => {
      const testEmp = createdRecords.find((r) => r.model === "hr.employee");
      const filtered = await hrService.getPayslips({ employeeId: testEmp!.id });

      expect(filtered.length).toBeGreaterThan(0);
      const testPayslip = filtered.find((p) => p.number === "TEST/001");
      expect(testPayslip).toBeDefined();
    });

    it("should filter payslips by state", async () => {
      const filtered = await hrService.getPayslips({ state: "done" });

      expect(filtered.length).toBeGreaterThan(0);
      filtered.forEach((payslip) => {
        expect(payslip.state).toBe("done");
      });
    });
  });

  describe("getPayslip", () => {
    it("should fetch single payslip by ID", async () => {
      const testPayslip = createdRecords.find((r) => r.model === "hr.payslip");
      const payslip = await hrService.getPayslip(testPayslip!.id);

      expect(payslip).not.toBeNull();
      expect(payslip?.id).toBe(testPayslip!.id);
      expect(payslip?.number).toBe("TEST/001");
    });

    it("should return null for non-existent payslip", async () => {
      const payslip = await hrService.getPayslip(999999);
      expect(payslip).toBeNull();
    });
  });

  describe("getPayslipLines", () => {
    it("should fetch all payslip lines for a payslip", async () => {
      const testPayslip = createdRecords.find((r) => r.model === "hr.payslip");
      const lines = await hrService.getPayslipLines(testPayslip!.id);

      expect(Array.isArray(lines)).toBe(true);
      expect(lines.length).toBeGreaterThan(0);

      const basicSalary = lines.find((l) => l.code === "BASIC");
      expect(basicSalary).toBeDefined();
      expect(basicSalary?.amount).toBe(5000);
    });

    it("should return empty array for payslip with no lines", async () => {
      const lines = await hrService.getPayslipLines(999999);
      expect(Array.isArray(lines)).toBe(true);
      expect(lines.length).toBe(0);
    });
  });
});
