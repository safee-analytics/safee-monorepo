"use client";

import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

export interface TableColumn {
  header: string;
  key: string;
  width?: number; // flex value or percentage
  align?: "left" | "center" | "right";
  format?: (value: any) => string;
}

export interface TablePDFData {
  title?: string;
  subtitle?: string;
  columns: TableColumn[];
  data: Record<string, any>[];
  footer?: string;
  orientation?: "portrait" | "landscape";
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },
  subtitle: {
    fontSize: 12,
    color: "#666",
    marginBottom: 10,
  },
  table: {
    marginTop: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#0070C0",
    color: "white",
    padding: 10,
    fontWeight: "bold",
    fontSize: 10,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    padding: 10,
    fontSize: 10,
  },
  tableRowAlt: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    padding: 10,
    fontSize: 10,
    backgroundColor: "#f9f9f9",
  },
  footer: {
    marginTop: 30,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    textAlign: "center",
    fontSize: 9,
    color: "#666",
  },
  pageNumber: {
    position: "absolute",
    bottom: 20,
    right: 40,
    fontSize: 9,
    color: "#999",
  },
});

export interface TablePDFProps {
  data: TablePDFData;
}

export const TablePDF: React.FC<TablePDFProps> = ({ data }) => {
  const getTotalFlex = () => {
    return data.columns.reduce((sum, col) => sum + (col.width || 1), 0);
  };

  const getColumnStyle = (column: TableColumn) => {
    const flex = column.width || 1;
    const textAlign = column.align || "left";
    return {
      flex,
      textAlign,
      paddingHorizontal: 5,
    };
  };

  const formatValue = (value: any, column: TableColumn): string => {
    if (column.format) {
      return column.format(value);
    }
    if (value === null || value === undefined) {
      return "-";
    }
    return String(value);
  };

  return (
    <Document>
      <Page size="A4" orientation={data.orientation || "portrait"} style={styles.page}>
        {/* Header */}
        {(data.title || data.subtitle) && (
          <View style={styles.header}>
            {data.title && <Text style={styles.title}>{data.title}</Text>}
            {data.subtitle && <Text style={styles.subtitle}>{data.subtitle}</Text>}
          </View>
        )}

        {/* Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            {data.columns.map((column, index) => (
              <Text key={index} style={getColumnStyle(column)}>
                {column.header}
              </Text>
            ))}
          </View>

          {/* Table Rows */}
          {data.data.map((row, rowIndex) => (
            <View key={rowIndex} style={rowIndex % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              {data.columns.map((column, colIndex) => (
                <Text key={colIndex} style={getColumnStyle(column)}>
                  {formatValue(row[column.key], column)}
                </Text>
              ))}
            </View>
          ))}
        </View>

        {/* Footer */}
        {data.footer && (
          <View style={styles.footer}>
            <Text>{data.footer}</Text>
          </View>
        )}

        {/* Page Number */}
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
};
