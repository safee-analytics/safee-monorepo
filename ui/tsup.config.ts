import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: {
      index: "src/index.ts",
      // Split into separate chunks to avoid Turbopack bug
      components: "src/components/index.ts",
      utils: "src/utils/index.ts",
      // Heavy components - build separately for direct imports
      "components/Charts": "src/components/Charts.tsx",
      "components/DataGrid": "src/components/DataGrid.tsx",
      "components/ExcelPreview": "src/components/ExcelPreview.tsx",
      "components/InvoicePDF": "src/components/InvoicePDF.tsx",
      "components/PDFDownloadButton": "src/components/PDFDownloadButton.tsx",
      "components/PDFViewer": "src/components/PDFViewer.tsx",
      "components/TablePDF": "src/components/TablePDF.tsx",
      // Heavy utils - build separately for direct imports
      "utils/excel": "src/utils/excel.ts",
      "utils/pdf": "src/utils/pdf.ts",
    },
    format: ["cjs", "esm"],
    dts: true,
    sourcemap: false, // Disabled to fix Turbopack build issue
    clean: true,
    minify: true, // Minify to reduce file size for Turbopack
    external: ["react", "react-dom", "lucide-react"],
    splitting: true, // Enable code splitting
  },
  {
    entry: ["src/tailwind.config.ts"],
    format: ["cjs", "esm"],
    dts: true,
    sourcemap: false,
    external: ["tailwindcss"],
  },
]);
