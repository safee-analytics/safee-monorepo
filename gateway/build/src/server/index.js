import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { RegisterRoutes } from "./generated/routes.js";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./generated/swagger.json" with { type: "json" };
import { logger } from "./utils/logger.js";
dotenv.config();
const app = express();
const PORT = Number(process.env.PORT) || 3000;
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
RegisterRoutes(app);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Safee Analytics API Documentation",
}));
app.get("/", (req, res) => {
    res.json({
        message: "Safee Analytics API",
        version: "1.0.0",
        docs: "/docs",
    });
});
app.use((err, req, res, next) => {
    logger.error("Request error: %s", err.message, { err });
    if (err.status) {
        return res.status(err.status).json({
            error: err.message || "An error occurred",
        });
    }
    return res.status(500).json({
        error: "Internal server error",
    });
});
app.use("*", (req, res) => {
    res.status(404).json({ error: "Endpoint not found" });
});
app.listen(PORT, () => {
    logger.info("Server started on port %d", PORT);
    logger.info("API Documentation available at: http://localhost:%d/docs", PORT);
    logger.info("Health Check available at: http://localhost:%d/health", PORT);
});
export default app;
