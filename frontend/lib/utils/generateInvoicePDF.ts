import { InvoiceStyle } from "../api/hooks/invoiceStyles";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  terms: string;

  companyName: string;
  companyAddress: string;
  companyCity: string;
  companyPhone: string;
  companyEmail: string;

  customerName: string;
  customerAddress: string;
  customerCity: string;

  items: {
    date: string;
    name: string;
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }[];

  subtotal: number;
  tax?: number;
  total: number;
}

export async function generateInvoicePDF(invoice: InvoiceData, style: InvoiceStyle): Promise<Blob> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  };

  const primaryRgb = hexToRgb(style.primaryColor);
  const accentRgb = hexToRgb(style.accentColor);
  const textRgb = hexToRgb(style.textColor);

  const fontSizes = {
    small: { title: 24, heading: 12, body: 9 },
    medium: { title: 28, heading: 14, body: 10 },
    large: { title: 32, heading: 16, body: 11 },
  };
  const sizes = fontSizes[style.fontSize];

  if (style.showLogo && style.logoUrl) {
    try {
      const logoX =
        style.logoPosition === "center"
          ? pageWidth / 2 - 20
          : style.logoPosition === "right"
            ? pageWidth - 50
            : 20;
      doc.addImage(style.logoUrl, "PNG", logoX, yPosition, 40, 20);
      yPosition += 30;
    } catch (e) {
      console.error("Failed to add logo:", e);
    }
  }

  if (style.showCompanyDetails) {
    doc.setFontSize(sizes.body);
    doc.setTextColor(textRgb.r, textRgb.g, textRgb.b);
    doc.text(invoice.companyName, 20, yPosition);
    yPosition += 5;
    doc.text(invoice.companyAddress, 20, yPosition);
    yPosition += 5;
    doc.text(invoice.companyCity, 20, yPosition);
    yPosition += 5;
    doc.text(invoice.companyPhone, 20, yPosition);
    yPosition += 5;
    doc.text(invoice.companyEmail, 20, yPosition);
    yPosition += 10;
  }

  // Invoice title
  doc.setFontSize(sizes.title);
  doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  doc.setFont(style.headingFont.toLowerCase(), "bold");
  doc.text(style.invoiceLabel, 20, yPosition);
  yPosition += 15;

  // Invoice details (left) and Bill To (right)
  const leftColumnX = 20;
  const rightColumnX = pageWidth / 2 + 10;
  let leftY = yPosition;
  let rightY = yPosition;

  // Bill To
  doc.setFontSize(sizes.heading);
  doc.setTextColor(textRgb.r, textRgb.g, textRgb.b);
  doc.setFont(style.headingFont.toLowerCase(), "bold");
  doc.text(style.billToLabel, leftColumnX, leftY);
  leftY += 7;

  doc.setFontSize(sizes.body);
  doc.setFont(style.bodyFont.toLowerCase(), "normal");
  doc.text(invoice.customerName, leftColumnX, leftY);
  leftY += 5;
  doc.text(invoice.customerAddress, leftColumnX, leftY);
  leftY += 5;
  doc.text(invoice.customerCity, leftColumnX, leftY);

  // Invoice info (right side)
  doc.setFontSize(sizes.body);
  doc.setFont(style.bodyFont.toLowerCase(), "normal");

  const addRightAlignedRow = (label: string, value: string, y: number) => {
    doc.text(label, rightColumnX, y);
    doc.text(value, pageWidth - 20, y, { align: "right" });
  };

  addRightAlignedRow("INVOICE", invoice.invoiceNumber, rightY);
  rightY += 6;
  addRightAlignedRow(style.dateLabel, invoice.invoiceDate, rightY);
  rightY += 6;
  addRightAlignedRow("TERMS", invoice.terms, rightY);
  rightY += 6;
  addRightAlignedRow(style.dueLabel, invoice.dueDate, rightY);

  yPosition = Math.max(leftY, rightY) + 15;

  // Items table
  autoTable(doc, {
    startY: yPosition,
    head: [["DATE", style.itemLabel, "DESCRIPTION", style.quantityLabel, style.rateLabel, style.amountLabel]],
    body: invoice.items.map((item) => [
      item.date,
      item.name,
      item.description,
      item.quantity.toString(),
      `$${item.rate.toFixed(2)}`,
      `$${item.amount.toFixed(2)}`,
    ]),
    theme: "plain",
    headStyles: {
      fillColor: [accentRgb.r, accentRgb.g, accentRgb.b],
      textColor: [255, 255, 255],
      fontSize: sizes.body,
      fontStyle: "bold",
      halign: "left",
    },
    bodyStyles: {
      fontSize: sizes.body,
      textColor: [textRgb.r, textRgb.g, textRgb.b],
    },
    columnStyles: {
      3: { halign: "center" },
      4: { halign: "right" },
      5: { halign: "right" },
    },
    margin: { left: 20, right: 20 },
  });

  // autoTable adds finalY property at runtime
  yPosition = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  // Total
  doc.setFontSize(sizes.body);
  doc.setTextColor(textRgb.r, textRgb.g, textRgb.b);
  doc.text(style.totalLabel, pageWidth - 80, yPosition);

  doc.setFontSize(sizes.title);
  doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  doc.setFont(style.headingFont.toLowerCase(), "bold");
  doc.text(`$${invoice.total.toFixed(2)}`, pageWidth - 20, yPosition + 10, { align: "right" });

  // Footer
  if (style.showFooter) {
    doc.setFontSize(sizes.body);
    doc.setTextColor(150, 150, 150);
    doc.setFont(style.bodyFont.toLowerCase(), "normal");
    doc.text(style.footerText, pageWidth / 2, pageHeight - 20, { align: "center" });
  }

  // Page number
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("Page 1 of 1", pageWidth / 2, pageHeight - 10, { align: "center" });

  return doc.output("blob");
}

/**
 * Download invoice PDF
 */
export async function downloadInvoicePDF(invoice: InvoiceData, style: InvoiceStyle, filename?: string) {
  const blob = await generateInvoicePDF(invoice, style);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || `invoice-${invoice.invoiceNumber}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
