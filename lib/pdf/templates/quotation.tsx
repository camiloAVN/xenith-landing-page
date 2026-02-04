import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottom: '2 solid #8b5cf6',
  },
  logo: {
    flexDirection: 'column',
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8b5cf6',
    marginBottom: 5,
  },
  companyInfo: {
    fontSize: 9,
    color: '#666666',
    lineHeight: 1.4,
  },
  quotationInfo: {
    alignItems: 'flex-end',
  },
  quotationNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
  },
  quotationMeta: {
    fontSize: 9,
    color: '#666666',
    lineHeight: 1.4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottom: '1 solid #e5e7eb',
  },
  clientInfo: {
    fontSize: 10,
    lineHeight: 1.6,
    color: '#374151',
  },
  table: {
    marginTop: 10,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 8,
    fontWeight: 'bold',
    fontSize: 9,
    borderBottom: '2 solid #8b5cf6',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1 solid #e5e7eb',
    fontSize: 9,
  },
  tableRowInventory: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1 solid #e5e7eb',
    fontSize: 9,
    backgroundColor: '#faf5ff',
  },
  tableCol1: { width: '8%' },
  tableCol2: { width: '42%' },
  tableCol3: { width: '15%', textAlign: 'right' },
  tableCol4: { width: '15%', textAlign: 'right' },
  tableCol5: { width: '20%', textAlign: 'right' },
  itemDescription: {
    fontSize: 9,
    color: '#1f2937',
  },
  itemDetails: {
    fontSize: 7,
    color: '#6b7280',
    marginTop: 2,
  },
  inventoryBadge: {
    fontSize: 6,
    color: '#7c3aed',
    backgroundColor: '#ede9fe',
    padding: '2 4',
    borderRadius: 2,
    marginTop: 2,
  },
  totals: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  totalsRow: {
    flexDirection: 'row',
    width: '40%',
    justifyContent: 'space-between',
    padding: 5,
    fontSize: 10,
  },
  totalRow: {
    flexDirection: 'row',
    width: '40%',
    justifyContent: 'space-between',
    padding: 8,
    backgroundColor: '#8b5cf6',
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
    borderRadius: 4,
    marginTop: 5,
  },
  notes: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
    borderLeft: '4 solid #8b5cf6',
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
  },
  notesText: {
    fontSize: 9,
    color: '#4b5563',
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#9ca3af',
    paddingTop: 15,
    borderTop: '1 solid #e5e7eb',
  },
})

interface QuotationPDFProps {
  quotation: any
}

export function QuotationPDFDocument({ quotation }: QuotationPDFProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const getItemInventoryDetails = (item: any) => {
    if (!item.inventoryItem) return null
    const inv = item.inventoryItem
    const parts = []
    if (inv.product?.sku) parts.push(`SKU: ${inv.product.sku}`)
    if (inv.serialNumber) parts.push(`S/N: ${inv.serialNumber}`)
    if (inv.assetTag) parts.push(`Activo: ${inv.assetTag}`)
    return parts.length > 0 ? parts.join(' | ') : null
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.companyName}>XENITH</Text>
            <Text style={styles.companyInfo}>
              Ingeniería Robótica y Desarrollo de Software{'\n'}
              info@xenith.com{'\n'}
              www.xenith.com
            </Text>
          </View>
          <View style={styles.quotationInfo}>
            <Text style={styles.quotationNumber}>
              {quotation.quotationNumber}
            </Text>
            <Text style={styles.quotationMeta}>
              Fecha: {format(new Date(quotation.createdAt), 'dd MMMM yyyy', { locale: es })}{'\n'}
              Válida hasta: {format(new Date(quotation.validUntil), 'dd MMMM yyyy', { locale: es })}{'\n'}
              Estado: {quotation.status}
            </Text>
          </View>
        </View>

        {/* Client Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cliente</Text>
          <Text style={styles.clientInfo}>
            {quotation.client.name}{'\n'}
            {quotation.client.company && `${quotation.client.company}\n`}
            {quotation.client.email}{'\n'}
            {quotation.client.phone && `${quotation.client.phone}\n`}
            {quotation.client.address && `${quotation.client.address}\n`}
            {quotation.client.city && quotation.client.country &&
              `${quotation.client.city}, ${quotation.client.country}\n`}
            {quotation.client.taxId && `RFC: ${quotation.client.taxId}`}
          </Text>
        </View>

        {/* Quotation Title */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{quotation.title}</Text>
          {quotation.description && (
            <Text style={styles.clientInfo}>{quotation.description}</Text>
          )}
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableCol1}>#</Text>
            <Text style={styles.tableCol2}>Descripción</Text>
            <Text style={styles.tableCol3}>Cantidad</Text>
            <Text style={styles.tableCol4}>Precio Unit.</Text>
            <Text style={styles.tableCol5}>Total</Text>
          </View>
          {quotation.items.map((item: any, index: number) => {
            const inventoryDetails = getItemInventoryDetails(item)
            return (
              <View key={item.id} style={item.inventoryItem ? styles.tableRowInventory : styles.tableRow}>
                <Text style={styles.tableCol1}>{index + 1}</Text>
                <View style={styles.tableCol2}>
                  <Text style={styles.itemDescription}>{item.description}</Text>
                  {inventoryDetails && (
                    <Text style={styles.itemDetails}>{inventoryDetails}</Text>
                  )}
                  {item.inventoryItem && (
                    <Text style={styles.inventoryBadge}>INVENTARIO</Text>
                  )}
                </View>
                <Text style={styles.tableCol3}>{item.quantity}</Text>
                <Text style={styles.tableCol4}>{formatCurrency(Number(item.unitPrice))}</Text>
                <Text style={styles.tableCol5}>{formatCurrency(Number(item.total))}</Text>
              </View>
            )
          })}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalsRow}>
            <Text>Subtotal:</Text>
            <Text>{formatCurrency(Number(quotation.subtotal))}</Text>
          </View>
          {Number(quotation.discount) > 0 && (
            <View style={styles.totalsRow}>
              <Text>Descuento:</Text>
              <Text>-{formatCurrency(Number(quotation.discount))}</Text>
            </View>
          )}
          <View style={styles.totalsRow}>
            <Text>IVA (16%):</Text>
            <Text>{formatCurrency(Number(quotation.tax))}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>TOTAL:</Text>
            <Text>{formatCurrency(Number(quotation.total))}</Text>
          </View>
        </View>

        {/* Notes */}
        {quotation.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>Notas:</Text>
            <Text style={styles.notesText}>{quotation.notes}</Text>
          </View>
        )}

        {/* Terms */}
        {quotation.terms && (
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>Términos y Condiciones:</Text>
            <Text style={styles.notesText}>{quotation.terms}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Generado con XENITH - Sistema de Gestión de Proyectos
        </Text>
      </Page>
    </Document>
  )
}
