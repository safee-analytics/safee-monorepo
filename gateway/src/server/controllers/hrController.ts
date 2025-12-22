import { Controller, Get, Route, Tags, Security, Request, Path, Query, OperationId } from "tsoa";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { odoo } from "@safee/database";
const { getOdooClientManager, OdooHRService } = odoo;
import { BadRequest, NotFound } from "../errors.js";
import type {
  EmployeeResponse,
  DepartmentResponse,
  ContractResponse,
  LeaveTypeResponse,
  LeaveRequestResponse,
  LeaveAllocationResponse,
  PayslipResponse,
  PayslipLineResponse,
} from "./hrController.types.js";
import {
  mapEmployee,
  mapDepartment,
  mapContract,
  mapLeaveType,
  mapLeaveRequest,
  mapLeaveAllocation,
  mapPayslip,
  mapPayslipLine,
} from "./hrController.mappers.js";

@Route("hr")
@Tags("HR & Payroll")
export class HRController extends Controller {
  /**
   * Get the HR service for the current organization
   */
  @Security("jwt")
  private async getHRService(request: AuthenticatedRequest): Promise<odoo.OdooHRService> {
    const userId = request.betterAuthSession?.user.id;
    const organizationId = request.betterAuthSession?.session.activeOrganizationId;

    if (!userId) {
      throw new BadRequest("User not authenticated");
    }

    if (!organizationId) {
      throw new BadRequest("No active organization selected");
    }

    const odooClientManager = getOdooClientManager();
    const client = await odooClientManager.getClient(userId, organizationId);

    return new OdooHRService(client);
  }

  // ==================== Employees ====================

  /**
   * Get list of employees
   */
  @Get("/employees")
  @Security("jwt")
  @OperationId("GetHREmployees")
  public async getEmployees(
    @Request() request: AuthenticatedRequest,
    @Query() departmentId?: number,
    @Query() active?: boolean,
  ): Promise<EmployeeResponse[]> {
    const hrService = await this.getHRService(request);
    const employees = await hrService.getEmployees({ departmentId, active });
    return employees.map(mapEmployee);
  }

  /**
   * Get a single employee by ID
   */
  @Get("/employees/{employeeId}")
  @Security("jwt")
  @OperationId("GetHREmployee")
  public async getEmployee(
    @Request() request: AuthenticatedRequest,
    @Path() employeeId: number,
  ): Promise<EmployeeResponse> {
    const hrService = await this.getHRService(request);
    const employee = await hrService.getEmployee(employeeId);

    if (!employee) {
      throw new NotFound(`Employee with ID ${employeeId} not found`);
    }

    return mapEmployee(employee);
  }

  // ==================== Departments ====================

  /**
   * Get list of departments
   */
  @Get("/departments")
  @Security("jwt")
  @OperationId("GetHRDepartments")
  public async getDepartments(
    @Request() request: AuthenticatedRequest,
    @Query() parentId?: number,
    @Query() active?: boolean,
  ): Promise<DepartmentResponse[]> {
    const hrService = await this.getHRService(request);
    const departments = await hrService.getDepartments({ parentId, active });
    return departments.map(mapDepartment);
  }

  /**
   * Get a single department by ID
   */
  @Get("/departments/{departmentId}")
  @Security("jwt")
  @OperationId("GetHRDepartment")
  public async getDepartment(
    @Request() request: AuthenticatedRequest,
    @Path() departmentId: number,
  ): Promise<DepartmentResponse> {
    const hrService = await this.getHRService(request);
    const department = await hrService.getDepartment(departmentId);

    if (!department) {
      throw new NotFound(`Department with ID ${departmentId} not found`);
    }

    return mapDepartment(department);
  }

  // ==================== Contracts ====================

  /**
   * Get list of contracts
   */
  @Get("/contracts")
  @Security("jwt")
  public async getContracts(
    @Request() request: AuthenticatedRequest,
    @Query() employeeId?: number,
    @Query() state?: string,
  ): Promise<ContractResponse[]> {
    const hrService = await this.getHRService(request);
    const contracts = await hrService.getContracts({ employeeId, state });
    return contracts.map(mapContract);
  }

  /**
   * Get a single contract by ID
   */
  @Get("/contracts/{contractId}")
  @Security("jwt")
  public async getContract(
    @Request() request: AuthenticatedRequest,
    @Path() contractId: number,
  ): Promise<ContractResponse> {
    const hrService = await this.getHRService(request);
    const contract = await hrService.getContract(contractId);

    if (!contract) {
      throw new NotFound(`Contract with ID ${contractId} not found`);
    }

    return mapContract(contract);
  }

  // ==================== Leave Types ====================

  /**
   * Get list of leave types
   */
  @Get("/leave-types")
  @Security("jwt")
  public async getLeaveTypes(
    @Request() request: AuthenticatedRequest,
    @Query() active?: boolean,
  ): Promise<LeaveTypeResponse[]> {
    const hrService = await this.getHRService(request);
    const leaveTypes = await hrService.getLeaveTypes({ active });
    return leaveTypes.map(mapLeaveType);
  }

  /**
   * Get a single leave type by ID
   */
  @Get("/leave-types/{leaveTypeId}")
  @Security("jwt")
  public async getLeaveType(
    @Request() request: AuthenticatedRequest,
    @Path() leaveTypeId: number,
  ): Promise<LeaveTypeResponse> {
    const hrService = await this.getHRService(request);
    const leaveType = await hrService.getLeaveType(leaveTypeId);

    if (!leaveType) {
      throw new NotFound(`Leave type with ID ${leaveTypeId} not found`);
    }

    return mapLeaveType(leaveType);
  }

  // ==================== Leave Requests ====================

  /**
   * Get list of leave requests
   */
  @Get("/leave-requests")
  @Security("jwt")
  public async getLeaveRequests(
    @Request() request: AuthenticatedRequest,
    @Query() employeeId?: number,
    @Query() leaveTypeId?: number,
    @Query() state?: string,
    @Query() dateFrom?: string,
    @Query() dateTo?: string,
  ): Promise<LeaveRequestResponse[]> {
    const hrService = await this.getHRService(request);
    const leaveRequests = await hrService.getLeaveRequests({
      employeeId,
      leaveTypeId,
      state,
      dateFrom,
      dateTo,
    });
    return leaveRequests.map(mapLeaveRequest);
  }

  /**
   * Get a single leave request by ID
   */
  @Get("/leave-requests/{leaveId}")
  @Security("jwt")
  public async getLeaveRequest(
    @Request() request: AuthenticatedRequest,
    @Path() leaveId: number,
  ): Promise<LeaveRequestResponse> {
    const hrService = await this.getHRService(request);
    const leaveRequest = await hrService.getLeaveRequest(leaveId);

    if (!leaveRequest) {
      throw new NotFound(`Leave request with ID ${leaveId} not found`);
    }

    return mapLeaveRequest(leaveRequest);
  }

  // ==================== Leave Allocations ====================

  /**
   * Get list of leave allocations
   */
  @Get("/leave-allocations")
  @Security("jwt")
  public async getLeaveAllocations(
    @Request() request: AuthenticatedRequest,
    @Query() employeeId?: number,
    @Query() leaveTypeId?: number,
    @Query() state?: string,
  ): Promise<LeaveAllocationResponse[]> {
    const hrService = await this.getHRService(request);
    const allocations = await hrService.getLeaveAllocations({ employeeId, leaveTypeId, state });
    return allocations.map(mapLeaveAllocation);
  }

  /**
   * Get a single leave allocation by ID
   */
  @Get("/leave-allocations/{allocationId}")
  @Security("jwt")
  public async getLeaveAllocation(
    @Request() request: AuthenticatedRequest,
    @Path() allocationId: number,
  ): Promise<LeaveAllocationResponse> {
    const hrService = await this.getHRService(request);
    const allocation = await hrService.getLeaveAllocation(allocationId);

    if (!allocation) {
      throw new NotFound(`Leave allocation with ID ${allocationId} not found`);
    }

    return mapLeaveAllocation(allocation);
  }

  // ==================== Payslips ====================

  /**
   * Get list of payslips
   */
  @Get("/payslips")
  @Security("jwt")
  public async getPayslips(
    @Request() request: AuthenticatedRequest,
    @Query() employeeId?: number,
    @Query() state?: string,
    @Query() dateFrom?: string,
    @Query() dateTo?: string,
  ): Promise<PayslipResponse[]> {
    const hrService = await this.getHRService(request);
    const payslips = await hrService.getPayslips({ employeeId, state, dateFrom, dateTo });
    return payslips.map(mapPayslip);
  }

  /**
   * Get a single payslip by ID
   */
  @Get("/payslips/{payslipId}")
  @Security("jwt")
  public async getPayslip(
    @Request() request: AuthenticatedRequest,
    @Path() payslipId: number,
  ): Promise<PayslipResponse> {
    const hrService = await this.getHRService(request);
    const payslip = await hrService.getPayslip(payslipId);

    if (!payslip) {
      throw new NotFound(`Payslip with ID ${payslipId} not found`);
    }

    return mapPayslip(payslip);
  }

  /**
   * Get payslip lines for a specific payslip
   */
  @Get("/payslips/{payslipId}/lines")
  @Security("jwt")
  public async getPayslipLines(
    @Request() request: AuthenticatedRequest,
    @Path() payslipId: number,
  ): Promise<PayslipLineResponse[]> {
    const hrService = await this.getHRService(request);
    const lines = await hrService.getPayslipLines(payslipId);
    return lines.map(mapPayslipLine);
  }
}
