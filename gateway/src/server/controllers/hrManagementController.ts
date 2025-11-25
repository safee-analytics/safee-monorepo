import { Controller, Get, Post, Put, Delete, Route, Tags, Security, Request, Path, Body, Query } from "tsoa";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { BadRequest, NotFound } from "../errors.js";
import type { ServerContext } from "../serverContext.js";
import {
  createEmployee,
  getEmployeeById,
  getEmployeeByOdooId,
  getEmployeesByOrganization,
  getEmployeesByDepartment,
  getEmployeesByManager,
  updateEmployee,
  deactivateEmployee,
  syncEmployee,
  createDepartment,
  getDepartmentById,
  getDepartmentByOdooId,
  getDepartmentsByOrganization,
  getSubDepartments,
  updateDepartment,
  deleteDepartment,
  syncDepartment,
  getLeaveBalanceByEmployee,
  getLeaveBalanceByLeaveType,
} from "@safee/database";
import { getOdooClientManager } from "../services/odoo/manager.service.js";
import { OdooHRService, parseEmployeeType, parseGender, parseMaritalStatus } from "../services/odoo/hr.service.js";
import { mapEmployeeToResponse, mapDepartmentToResponse } from "./hrManagementController.mappers.js";
import type {
  EmployeeDbResponse,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  DepartmentDbResponse,
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
  LeaveBalanceResponse,
  SyncEmployeeFromOdooRequest,
  SyncDepartmentFromOdooRequest,
  SyncAllEmployeesResponse,
  SyncAllDepartmentsResponse,
} from "../dtos/hrManagement.js";

@Route("hr-management")
@Tags("HR Management")
export class HRManagementController extends Controller {
  private getServerContext(request: AuthenticatedRequest) {
    const userId = request.betterAuthSession?.user.id;
    const organizationId = request.betterAuthSession?.session.activeOrganizationId;

    if (!userId) {
      throw new BadRequest("User not authenticated");
    }

    if (!organizationId) {
      throw new BadRequest("No active organization selected");
    }

    return {
      drizzle: request.drizzle,
      logger: request.logger,
      userId,
      organizationId,
    };
  }

  private async getHRService(request: AuthenticatedRequest): Promise<OdooHRService> {
    const { userId, organizationId } = this.getServerContext(request);
    const odooClientManager = getOdooClientManager();
    const client = await odooClientManager.getClient(userId, organizationId);
    return new OdooHRService(client);
  }

  private async resolveDepartmentUuid(
    ctx: { drizzle: ServerContext["drizzle"]; logger: ServerContext["logger"]; organizationId: string },
    odooDepartmentId: number,
  ): Promise<string | undefined> {
    const department = await getDepartmentByOdooId(
      { drizzle: ctx.drizzle, logger: ctx.logger },
      odooDepartmentId,
      ctx.organizationId,
    );
    return department?.id;
  }

  // ==================== Employee Management ====================

  /**
   * Get all employees in the organization
   */
  @Get("/employees")
  @Security("jwt")
  public async getEmployees(
    @Request() request: AuthenticatedRequest,
    @Query() departmentId?: string,
    @Query() managerId?: string,
  ): Promise<EmployeeDbResponse[]> {
    const ctx = this.getServerContext(request);

    let employees;
    if (departmentId) {
      employees = await getEmployeesByDepartment({ drizzle: ctx.drizzle, logger: ctx.logger }, departmentId);
    } else if (managerId) {
      employees = await getEmployeesByManager({ drizzle: ctx.drizzle, logger: ctx.logger }, managerId);
    } else {
      employees = await getEmployeesByOrganization(
        { drizzle: ctx.drizzle, logger: ctx.logger },
        ctx.organizationId,
      );
    }

    return employees.map(mapEmployeeToResponse);
  }

  /**
   * Get a single employee by ID
   */
  @Get("/employees/{employeeId}")
  @Security("jwt")
  public async getEmployee(
    @Request() request: AuthenticatedRequest,
    @Path() employeeId: string,
  ): Promise<EmployeeDbResponse> {
    const ctx = this.getServerContext(request);

    const employee = await getEmployeeById({ drizzle: ctx.drizzle, logger: ctx.logger }, employeeId);

    if (!employee) {
      throw new NotFound(`Employee with ID ${employeeId} not found`);
    }

    return mapEmployeeToResponse(employee);
  }

  /**
   * Create a new employee
   */
  @Post("/employees")
  @Security("jwt")
  public async createEmployee(
    @Request() request: AuthenticatedRequest,
    @Body() body: CreateEmployeeRequest,
  ): Promise<EmployeeDbResponse> {
    const ctx = this.getServerContext(request);

    const employee = await createEmployee(
      { drizzle: ctx.drizzle, logger: ctx.logger },
      {
        ...body,
        organizationId: ctx.organizationId,
      },
    );

    this.setStatus(201);

    return mapEmployeeToResponse(employee);
  }

  /**
   * Update an employee
   */
  @Put("/employees/{employeeId}")
  @Security("jwt")
  public async updateEmployee(
    @Request() request: AuthenticatedRequest,
    @Path() employeeId: string,
    @Body() body: UpdateEmployeeRequest,
  ): Promise<EmployeeDbResponse> {
    const ctx = this.getServerContext(request);

    const employee = await updateEmployee({ drizzle: ctx.drizzle, logger: ctx.logger }, employeeId, body);

    return mapEmployeeToResponse(employee);
  }

  /**
   * Deactivate an employee
   */
  @Delete("/employees/{employeeId}")
  @Security("jwt")
  public async deactivateEmployee(
    @Request() request: AuthenticatedRequest,
    @Path() employeeId: string,
  ): Promise<{ success: boolean }> {
    const ctx = this.getServerContext(request);

    await deactivateEmployee({ drizzle: ctx.drizzle, logger: ctx.logger }, employeeId);

    return { success: true };
  }

  /**
   * Sync a single employee from Odoo
   */
  @Post("/employees/sync")
  @Security("jwt")
  public async syncEmployeeFromOdoo(
    @Request() request: AuthenticatedRequest,
    @Body() body: SyncEmployeeFromOdooRequest,
  ): Promise<EmployeeDbResponse> {
    const ctx = this.getServerContext(request);
    const hrService = await this.getHRService(request);

    // Fetch employee from Odoo
    const odooEmployee = await hrService.getEmployee(body.odooEmployeeId);

    if (!odooEmployee) {
      throw new NotFound(`Employee with Odoo ID ${body.odooEmployeeId} not found in Odoo`);
    }

    // Resolve foreign keys
    const departmentUuid = odooEmployee.department_id?.[0]
      ? await this.resolveDepartmentUuid(ctx, odooEmployee.department_id[0])
      : undefined;

    const managerUuid = odooEmployee.parent_id?.[0]
      ? (await getEmployeeByOdooId({ drizzle: ctx.drizzle, logger: ctx.logger }, odooEmployee.parent_id[0], ctx.organizationId))?.id
      : undefined;

    // Sync to database
    const employee = await syncEmployee(
      { drizzle: ctx.drizzle, logger: ctx.logger },
      {
        organizationId: ctx.organizationId,
        odooEmployeeId: odooEmployee.id,
        name: odooEmployee.name,
        email: odooEmployee.work_email,
        phone: odooEmployee.work_phone,
        mobile: odooEmployee.mobile_phone,
        workEmail: odooEmployee.work_email,
        workPhone: odooEmployee.work_phone,
        jobTitle: odooEmployee.job_title,
        departmentId: departmentUuid,
        managerId: managerUuid,
        employeeType: parseEmployeeType(odooEmployee.employee_type),
        gender: parseGender(odooEmployee.sex),
        maritalStatus: parseMaritalStatus(odooEmployee.marital),
        birthday: odooEmployee.birthday,
        placeOfBirth: odooEmployee.place_of_birth,
        identificationId: odooEmployee.identification_id,
        passportId: odooEmployee.passport_id,
        emergencyContact: odooEmployee.emergency_contact,
        emergencyPhone: odooEmployee.emergency_phone,
        active: odooEmployee.active ?? true,
      },
    );

    return mapEmployeeToResponse(employee);
  }

  /**
   * Sync all employees from Odoo
   */
  @Post("/employees/sync-all")
  @Security("jwt")
  public async syncAllEmployees(@Request() request: AuthenticatedRequest): Promise<SyncAllEmployeesResponse> {
    const ctx = this.getServerContext(request);
    const hrService = await this.getHRService(request);

    const odooEmployees = await hrService.getEmployees({ active: true });

    let synced = 0;
    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    // PASS 1: Create/update all employees WITHOUT foreign keys (departmentId, managerId)
    const odooIdToUuidMap = new Map<number, string>();

    for (const odooEmployee of odooEmployees) {
      try {
        const employee = await syncEmployee(
          { drizzle: ctx.drizzle, logger: ctx.logger },
          {
            organizationId: ctx.organizationId,
            odooEmployeeId: odooEmployee.id,
            name: odooEmployee.name,
            email: odooEmployee.work_email,
            phone: odooEmployee.work_phone,
            mobile: odooEmployee.mobile_phone,
            workEmail: odooEmployee.work_email,
            workPhone: odooEmployee.work_phone,
            jobTitle: odooEmployee.job_title,
            // Omit departmentId and managerId in first pass
            employeeType: parseEmployeeType(odooEmployee.employee_type),
            gender: parseGender(odooEmployee.sex),
            maritalStatus: parseMaritalStatus(odooEmployee.marital),
            birthday: odooEmployee.birthday,
            placeOfBirth: odooEmployee.place_of_birth,
            identificationId: odooEmployee.identification_id,
            passportId: odooEmployee.passport_id,
            emergencyContact: odooEmployee.emergency_contact,
            emergencyPhone: odooEmployee.emergency_phone,
            active: odooEmployee.active ?? true,
          },
        );

        odooIdToUuidMap.set(odooEmployee.id, employee.id);
        synced++;
        if (employee.createdAt === employee.updatedAt) {
          created++;
        } else {
          updated++;
        }
      } catch (error) {
        errors.push(`Failed to sync employee ${odooEmployee.name} (pass 1): ${error}`);
      }
    }

    // PASS 2: Update foreign key relationships (departmentId and managerId)
    for (const odooEmployee of odooEmployees) {
      const employeeUuid = odooIdToUuidMap.get(odooEmployee.id);
      if (!employeeUuid) continue;

      try {
        // Resolve department by Odoo ID
        const departmentUuid = odooEmployee.department_id?.[0]
          ? await this.resolveDepartmentUuid(ctx, odooEmployee.department_id[0])
          : undefined;

        // Resolve manager by Odoo employee ID
        const managerUuid = odooEmployee.parent_id?.[0] ? odooIdToUuidMap.get(odooEmployee.parent_id[0]) : undefined;

        if (departmentUuid || managerUuid) {
          await updateEmployee({ drizzle: ctx.drizzle, logger: ctx.logger }, employeeUuid, {
            departmentId: departmentUuid,
            managerId: managerUuid,
          });
        }
      } catch (error) {
        errors.push(`Failed to update employee ${odooEmployee.name} relationships (pass 2): ${error}`);
      }
    }

    return { synced, created, updated, errors };
  }

  // ==================== Department Management ====================

  /**
   * Get all departments in the organization
   */
  @Get("/departments")
  @Security("jwt")
  public async getDepartments(
    @Request() request: AuthenticatedRequest,
    @Query() parentId?: string,
  ): Promise<DepartmentDbResponse[]> {
    const ctx = this.getServerContext(request);

    let departments;
    if (parentId) {
      departments = await getSubDepartments({ drizzle: ctx.drizzle, logger: ctx.logger }, parentId);
    } else {
      departments = await getDepartmentsByOrganization(
        { drizzle: ctx.drizzle, logger: ctx.logger },
        ctx.organizationId,
      );
    }

    return departments.map(mapDepartmentToResponse);
  }

  /**
   * Get a single department by ID
   */
  @Get("/departments/{departmentId}")
  @Security("jwt")
  public async getDepartment(
    @Request() request: AuthenticatedRequest,
    @Path() departmentId: string,
  ): Promise<DepartmentDbResponse> {
    const ctx = this.getServerContext(request);

    const department = await getDepartmentById({ drizzle: ctx.drizzle, logger: ctx.logger }, departmentId);

    if (!department) {
      throw new NotFound(`Department with ID ${departmentId} not found`);
    }

    return mapDepartmentToResponse(department);
  }

  /**
   * Create a new department
   */
  @Post("/departments")
  @Security("jwt")
  public async createDepartment(
    @Request() request: AuthenticatedRequest,
    @Body() body: CreateDepartmentRequest,
  ): Promise<DepartmentDbResponse> {
    const ctx = this.getServerContext(request);

    const department = await createDepartment(
      { drizzle: ctx.drizzle, logger: ctx.logger },
      {
        ...body,
        organizationId: ctx.organizationId,
      },
    );

    this.setStatus(201);

    return mapDepartmentToResponse(department);
  }

  /**
   * Update a department
   */
  @Put("/departments/{departmentId}")
  @Security("jwt")
  public async updateDepartment(
    @Request() request: AuthenticatedRequest,
    @Path() departmentId: string,
    @Body() body: UpdateDepartmentRequest,
  ): Promise<DepartmentDbResponse> {
    const ctx = this.getServerContext(request);

    const department = await updateDepartment({ drizzle: ctx.drizzle, logger: ctx.logger }, departmentId, body);

    return mapDepartmentToResponse(department);
  }

  /**
   * Delete a department
   */
  @Delete("/departments/{departmentId}")
  @Security("jwt")
  public async deleteDepartment(
    @Request() request: AuthenticatedRequest,
    @Path() departmentId: string,
  ): Promise<{ success: boolean }> {
    const ctx = this.getServerContext(request);

    await deleteDepartment({ drizzle: ctx.drizzle, logger: ctx.logger }, departmentId);

    return { success: true };
  }

  /**
   * Sync a single department from Odoo
   */
  @Post("/departments/sync")
  @Security("jwt")
  public async syncDepartmentFromOdoo(
    @Request() request: AuthenticatedRequest,
    @Body() body: SyncDepartmentFromOdooRequest,
  ): Promise<DepartmentDbResponse> {
    const ctx = this.getServerContext(request);
    const hrService = await this.getHRService(request);

    // Fetch department from Odoo
    const odooDepartment = await hrService.getDepartment(body.odooDepartmentId);

    if (!odooDepartment) {
      throw new NotFound(`Department with Odoo ID ${body.odooDepartmentId} not found in Odoo`);
    }

    // Sync to database
    const department = await syncDepartment(
      { drizzle: ctx.drizzle, logger: ctx.logger },
      {
        organizationId: ctx.organizationId,
        odooDepartmentId: odooDepartment.id,
        name: odooDepartment.name,
        code: odooDepartment.complete_name,
        parentId: odooDepartment.parent_id?.[0]?.toString(),
        managerId: odooDepartment.manager_id?.[0]?.toString(),
        color: odooDepartment.color,
        note: odooDepartment.note,
      },
    );

    return mapDepartmentToResponse(department);
  }

  /**
   * Sync all departments from Odoo
   */
  @Post("/departments/sync-all")
  @Security("jwt")
  public async syncAllDepartments(@Request() request: AuthenticatedRequest): Promise<SyncAllDepartmentsResponse> {
    const ctx = this.getServerContext(request);
    const hrService = await this.getHRService(request);

    const odooDepartments = await hrService.getDepartments({ active: true });

    let synced = 0;
    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    // PASS 1: Create/update all departments WITHOUT foreign keys
    const odooIdToUuidMap = new Map<number, string>();

    for (const odooDepartment of odooDepartments) {
      try {
        const department = await syncDepartment(
          { drizzle: ctx.drizzle, logger: ctx.logger },
          {
            organizationId: ctx.organizationId,
            odooDepartmentId: odooDepartment.id,
            name: odooDepartment.name,
            code: odooDepartment.complete_name,
            // Omit parentId and managerId in first pass
            color: odooDepartment.color,
            note: odooDepartment.note,
          },
        );

        odooIdToUuidMap.set(odooDepartment.id, department.id);
        synced++;
        if (department.createdAt === department.updatedAt) {
          created++;
        } else {
          updated++;
        }
      } catch (error) {
        errors.push(`Failed to sync department ${odooDepartment.name} (pass 1): ${error}`);
      }
    }

    // PASS 2: Update foreign key relationships (parentId only - managerId requires employees)
    for (const odooDepartment of odooDepartments) {
      const departmentUuid = odooIdToUuidMap.get(odooDepartment.id);
      if (!departmentUuid) continue;

      try {
        const parentUuid = odooDepartment.parent_id?.[0] ? odooIdToUuidMap.get(odooDepartment.parent_id[0]) : undefined;

        if (parentUuid) {
          await updateDepartment({ drizzle: ctx.drizzle, logger: ctx.logger }, departmentUuid, {
            parentId: parentUuid,
          });
        }
      } catch (error) {
        errors.push(`Failed to update department ${odooDepartment.name} relationships (pass 2): ${error}`);
      }
    }

    return { synced, created, updated, errors };
  }

  // ==================== Leave Balance Tracking ====================

  /**
   * Get leave balances for an employee
   */
  @Get("/employees/{employeeId}/leave-balances")
  @Security("jwt")
  public async getEmployeeLeaveBalances(
    @Request() request: AuthenticatedRequest,
    @Path() employeeId: string,
  ): Promise<LeaveBalanceResponse[]> {
    const ctx = this.getServerContext(request);

    const balances = await getLeaveBalanceByEmployee(
      { drizzle: ctx.drizzle, logger: ctx.logger },
      employeeId,
      ctx.organizationId,
    );

    return balances;
  }

  /**
   * Get leave balance for a specific leave type
   */
  @Get("/employees/{employeeId}/leave-balances/{leaveTypeId}")
  @Security("jwt")
  public async getEmployeeLeaveBalanceByType(
    @Request() request: AuthenticatedRequest,
    @Path() employeeId: string,
    @Path() leaveTypeId: string,
  ): Promise<LeaveBalanceResponse> {
    const ctx = this.getServerContext(request);

    const balance = await getLeaveBalanceByLeaveType(
      { drizzle: ctx.drizzle, logger: ctx.logger },
      employeeId,
      leaveTypeId,
    );

    if (!balance) {
      throw new NotFound(`Leave balance not found for employee ${employeeId} and leave type ${leaveTypeId}`);
    }

    return balance;
  }
}
