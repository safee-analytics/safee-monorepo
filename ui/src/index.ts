// Components
export { Button, type ButtonProps } from "./components/Button";
export { Table, Pagination } from "./components/Table";

// UI Components
export { Modal, ModalFooter, type ModalProps, type ModalFooterProps } from "./components/Modal";
export { Dropdown, DropdownButton, type DropdownProps, type DropdownButtonProps, type DropdownItem } from "./components/Dropdown";
export { AnimatedButton, ExpandButton, type AnimatedButtonProps, type ExpandButtonProps } from "./components/AnimatedButton";
export { HoverCard, HoverCardGrid, type HoverCardProps, type HoverCardGridProps } from "./components/HoverCard";
export { AnimatedList, SimpleListItem, CompactList, type AnimatedListProps, type SimpleListItemProps, type CompactListProps } from "./components/AnimatedList";

// Premium Components
export { PremiumButton, FAB, type PremiumButtonProps, type FABProps } from "./components/PremiumButton";
export { PremiumCard, GlassCard, StatCard, type PremiumCardProps, type GlassCardProps, type StatCardProps } from "./components/PremiumCard";
export { Skeleton, SkeletonText, SkeletonCard, SkeletonTable, SkeletonList, LoadingScreen, ProgressBar, type SkeletonProps, type SkeletonTextProps, type SkeletonCardProps, type SkeletonTableProps, type SkeletonListProps, type LoadingScreenProps, type ProgressBarProps } from "./components/Skeleton";
export { ToastProvider, useToast, type Toast } from "./components/Toast";
export { DragDropList, KanbanBoard, type DragDropItem, type DragDropListProps, type KanbanColumn, type KanbanBoardProps } from "./components/DragDropList";
export { InlineCreateRow, InlineCreateCard, QuickAddButton, type InlineCreateRowProps, type InlineCreateCardProps, type QuickAddButtonProps } from "./components/InlineCreate";
export { QuickActions, useQuickActions, type QuickAction, type QuickActionsProps } from "./components/QuickActions";

// Animation Utilities
export { springs, easings, transitions, fadeInUp, fadeInDown, scaleIn, slideInRight, slideInLeft, staggerContainer, staggerItem, hoverScale, hoverLift, tapScale, tapShrink, pulse, shimmer, spin, buttonPress, cardHover, notificationSlideIn, toastPop, pageTransitions } from "./utils/animations";

// PDF Components
export { InvoicePDF, type InvoicePDFProps, type InvoiceData, type InvoiceItem } from "./components/InvoicePDF";
export { TablePDF, type TablePDFProps, type TablePDFData, type TableColumn } from "./components/TablePDF";
export { PDFDownloadButton, type PDFDownloadButtonProps } from "./components/PDFDownloadButton";
export { PDFViewer, type PDFViewerProps } from "./components/PDFViewer";
export { ExcelPreview, type ExcelPreviewProps } from "./components/ExcelPreview";

// Data Grid Component
export { DataGrid, type DataGridProps, type ColDef, type ValueFormatterParams, type CellStyle } from "./components/DataGrid";

// Chart Components
export {
  LineChart,
  BarChart,
  PieChart,
  AreaChart,
  type LineChartProps,
  type BarChartProps,
  type PieChartProps,
  type AreaChartProps,
  type ChartDataPoint,
  type PieChartData,
} from "./components/Charts";

// Calendar Component
export {
  CalendarScheduler,
  type CalendarSchedulerProps,
  type CalendarEventData,
  type View,
  type Views,
  type SlotInfo,
} from "./components/CalendarScheduler";

// Utils
export { cn } from "./utils/cn";

// Excel Utils
export {
  exportToExcel,
  simpleExportToExcel,
  exportWithConditionalFormatting,
  importFromExcel,
  formatCurrency,
  formatDate,
  type ExcelColumn,
  type ExcelExportOptions,
} from "./utils/excel";

// PDF Utils
export {
  generatePDFBlob,
  downloadPDF,
  openPDFInNewTab,
  commonPDFStyles,
  formatCurrencyForPDF,
  formatDateForPDF,
} from "./utils/pdf";

// Tailwind config
export { safeeConfig, safeeColors } from "./tailwind.config";
