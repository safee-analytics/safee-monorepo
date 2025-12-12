// Lightweight components barrel export
// NOTE: Heavy components (Charts, DataGrid, PDF/Excel) are NOT exported here
// to avoid memory issues during Next.js compilation. Import them directly:
// import { Charts } from "@safee/ui/components/Charts"
// import { DataGrid } from "@safee/ui/components/DataGrid"
// etc.

export * from "./AnimatedButton";
export * from "./AnimatedList";
export * from "./Button";
export * from "./CalendarScheduler";
export * from "./DragDropList";
export * from "./Dropdown";
export * from "./HoverCard";
export * from "./InlineCreate";
export * from "./Modal";
export * from "./PremiumButton";
export * from "./PremiumCard";
export * from "./QuickActions";
export * from "./Skeleton";
export * from "./Table";
export * from "./Toast";

// Heavy components - DO NOT add to main barrel export
// These components import large dependencies (Recharts, AG Grid, React PDF, ExcelJS)
// and should be imported directly to avoid compilation memory issues:
// - Charts (Recharts ~2MB)
// - DataGrid (AG Grid ~5MB)
// - ExcelPreview (ExcelJS ~2MB)
// - InvoicePDF (React PDF ~3MB)
// - PDFDownloadButton (React PDF ~3MB)
// - PDFViewer (React PDF ~3MB)
// - TablePDF (React PDF ~3MB)
