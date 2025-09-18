import { Controller } from "tsoa";
interface HealthCheck {
    status: "ok" | "error";
    timestamp: string;
    uptime: number;
    version: string;
}
export declare class HealthController extends Controller {
    getHealth(): Promise<HealthCheck>;
}
export {};
