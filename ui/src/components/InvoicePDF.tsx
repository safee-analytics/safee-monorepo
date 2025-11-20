import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate: string;

  // Company info
  companyName: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;

  // Client info
  clientName: string;
  clientAddress?: string;
  clientPhone?: string;
  clientEmail?: string;

  // Items
  items: InvoiceItem[];

  // Totals
  subtotal: number;
  taxRate?: number;
  taxAmount?: number;
  total: number;

  // Optional
  notes?: string;
  currency?: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0070C0",
  },
  invoiceInfo: {
    textAlign: "right",
  },
  infoLabel: {
    fontSize: 10,
    color: "#666",
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 8,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  addressBlock: {
    fontSize: 10,
    lineHeight: 1.5,
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#0070C0",
    color: "white",
    padding: 8,
    fontWeight: "bold",
    fontSize: 10,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    padding: 8,
    fontSize: 10,
  },
  descriptionCol: {
    flex: 3,
  },
  quantityCol: {
    flex: 1,
    textAlign: "right",
  },
  priceCol: {
    flex: 1.5,
    textAlign: "right",
  },
  totalCol: {
    flex: 1.5,
    textAlign: "right",
  },
  totalsSection: {
    marginLeft: "auto",
    width: "40%",
    marginTop: 20,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    fontSize: 10,
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: "bold",
    borderTopWidth: 2,
    borderTopColor: "#333",
    marginTop: 5,
  },
  notes: {
    marginTop: 30,
    padding: 15,
    backgroundColor: "#f9f9f9",
    borderRadius: 4,
  },
  notesTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 5,
  },
  notesText: {
    fontSize: 9,
    color: "#666",
    lineHeight: 1.4,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 9,
    color: "#999",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingTop: 10,
  },
});

export interface InvoicePDFProps {
  invoice: InvoiceData;
}

export const InvoicePDF: React.FC<InvoicePDFProps> = ({ invoice }) => {
  const currency = invoice.currency || "USD";
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>INVOICE</Text>
            <Text style={{ fontSize: 12, marginTop: 5 }}>{invoice.companyName}</Text>
            {invoice.companyAddress && (
              <Text style={{ fontSize: 9, color: "#666", marginTop: 3 }}>{invoice.companyAddress}</Text>
            )}
          </View>
          <View style={styles.invoiceInfo}>
            <Text style={styles.infoLabel}>Invoice Number</Text>
            <Text style={styles.infoValue}>{invoice.invoiceNumber}</Text>

            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>{invoice.date}</Text>

            <Text style={styles.infoLabel}>Due Date</Text>
            <Text style={styles.infoValue}>{invoice.dueDate}</Text>
          </View>
        </View>

        {/* Bill To Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill To:</Text>
          <View style={styles.addressBlock}>
            <Text style={{ fontWeight: "bold" }}>{invoice.clientName}</Text>
            {invoice.clientAddress && <Text>{invoice.clientAddress}</Text>}
            {invoice.clientPhone && <Text>Phone: {invoice.clientPhone}</Text>}
            {invoice.clientEmail && <Text>Email: {invoice.clientEmail}</Text>}
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.descriptionCol}>Description</Text>
            <Text style={styles.quantityCol}>Qty</Text>
            <Text style={styles.priceCol}>Unit Price</Text>
            <Text style={styles.totalCol}>Total</Text>
          </View>

          {invoice.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.descriptionCol}>{item.description}</Text>
              <Text style={styles.quantityCol}>{item.quantity}</Text>
              <Text style={styles.priceCol}>{formatCurrency(item.unitPrice)}</Text>
              <Text style={styles.totalCol}>{formatCurrency(item.total)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text>Subtotal:</Text>
            <Text>{formatCurrency(invoice.subtotal)}</Text>
          </View>

          {invoice.taxRate && invoice.taxAmount && (
            <View style={styles.totalRow}>
              <Text>Tax ({invoice.taxRate}%):</Text>
              <Text>{formatCurrency(invoice.taxAmount)}</Text>
            </View>
          )}

          <View style={styles.grandTotalRow}>
            <Text>Total:</Text>
            <Text>{formatCurrency(invoice.total)}</Text>
          </View>
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>Notes:</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Thank you for your business!
          {invoice.companyEmail && ` | ${invoice.companyEmail}`}
          {invoice.companyPhone && ` | ${invoice.companyPhone}`}
        </Text>
      </Page>
    </Document>
  );
};
