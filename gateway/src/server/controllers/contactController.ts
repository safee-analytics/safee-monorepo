import { Controller, Get, Post, Route, Tags, Security, Query, Body, SuccessResponse } from "tsoa";

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  type: "LEAD" | "CUSTOMER" | "VENDOR";
  status: "ACTIVE" | "INACTIVE";
}

interface ContactCreateRequest {
  name: string;
  email: string;
  phone: string;
  company?: string;
  type: "LEAD" | "CUSTOMER" | "VENDOR";
}

@Route("contacts")
@Tags("CRM")
export class ContactController extends Controller {
  @Get("/")
  @Security("jwt")
  public async getContacts(
    @Query() page: number = 1,
    @Query() limit: number = 20,
    @Query() type?: string,
  ): Promise<{
    contacts: Contact[];
    total: number;
    page: number;
    limit: number;
  }> {
    throw new Error("Not implemented yet");
  }

  @Post("/")
  @Security("jwt")
  @SuccessResponse("201", "Contact created successfully")
  public async createContact(@Body() request: ContactCreateRequest): Promise<Contact> {
    throw new Error("Not implemented yet");
  }
}
