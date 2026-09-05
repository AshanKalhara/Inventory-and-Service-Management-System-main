'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Sidebar } from '@/components/sidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Download, Eye, Trash2 } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { getInvoices, createInvoice, updateInvoiceStatus, deleteInvoice, getInvoiceById } from '@/app/actions/invoices'
import { getServiceRecords, getServiceRecordItemsByRecord } from '@/app/actions/services'
import { getCustomers, getBikes } from '@/app/actions/customers'
import { getServiceNumberMap } from '@/lib/db/service-number'

type InvoiceLineItem = {
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
  itemType: 'service' | 'part' | 'other'
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [serviceRecords, setServiceRecords] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [bikes, setBikes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [viewingInvoice, setViewingInvoice] = useState<any | null>(null)
  const [formData, setFormData] = useState({
    serviceRecordId: '',
    customerId: '',
    serviceFee: 0,
    discount: 0,
    items: [] as InvoiceLineItem[],
  })

  const serviceNumberMap = useMemo(
    () => getServiceNumberMap(serviceRecords),
    [serviceRecords]
  )

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [invoicesData, recordsData, customersData, bikesData] = await Promise.all([
        getInvoices(),
        getServiceRecords(),
        getCustomers(),
        getBikes(),
      ])
      setInvoices(invoicesData || [])
      setServiceRecords(recordsData || [])
      setCustomers(customersData || [])
      setBikes(bikesData || [])
    } catch (error) {
      console.error('Failed to load data:', error)
    }
    setLoading(false)
  }

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const itemsSubtotal = formData.items.reduce((sum, i) => sum + i.totalPrice, 0)
      const total = itemsSubtotal + formData.serviceFee - formData.discount

      await createInvoice({
        customerId: parseInt(formData.customerId),
        serviceRecordId: parseInt(formData.serviceRecordId),
        subtotal: itemsSubtotal,
        tax: formData.serviceFee, // ⚠️ `tax` column repurposed to store the Service Fee amount
        discount: formData.discount,
        total,
        items: formData.items.length > 0
          ? formData.items
          : [{ description: 'Standard Bike Maintenance', quantity: 1, unitPrice: itemsSubtotal, totalPrice: itemsSubtotal, itemType: 'service' }],
      })
      setFormData({ serviceRecordId: '', customerId: '', serviceFee: 0, discount: 0, items: [] })
      setShowForm(false)
      loadData()
    } catch (error) {
      console.error('Failed to create invoice:', error)
    }
  }

  const handleStartInvoiceFromRecord = async (record: any) => {
  const bike = bikes.find((b: any) => b.registrationNumber === record.registrationNumber)

  let items: InvoiceLineItem[] = []
  try {
    const lineItems = await getServiceRecordItemsByRecord(record.id)
    items = (lineItems || []).map((item: any) => ({
      description: item.description,
      quantity: item.quantity || 1,
      unitPrice: parseFloat(item.unitPrice),
      totalPrice: parseFloat(item.totalPrice),
      itemType: item.serviceId ? 'service' : item.partId ? 'part' : 'other',
    }))
  } catch (error) {
    console.error('Failed to load service record items:', error)
  }

  setFormData({
    serviceRecordId: String(record.id),
    customerId: bike?.customerId ? String(bike.customerId) : '',
    serviceFee: items.length > 0 ? 0 : record.cost ? parseFloat(record.cost) : 0,
    discount: 0,
    items,
  })
  setShowForm(true)
}

  const handleDownloadPDF = async (invoice: any) => {
    try {
      const invoiceData = await getInvoiceById(invoice.id)

      const element = document.createElement('div')
      element.innerHTML = generateInvoiceHTML(invoiceData)

      element.style.position = 'fixed'
      element.style.top = '-9999px'
      element.style.left = '-9999px'
      element.style.width = '210mm'
      document.body.appendChild(element)

      await document.fonts.ready
      await new Promise((resolve) => setTimeout(resolve, 200))

      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
      })

      document.body.removeChild(element)

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const imgData = canvas.toDataURL('image/png')
      const imgWidth = 210
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)

      pdf.save(`invoice-${invoice.invoiceNumber}.pdf`)
    } catch (error) {
      console.error('Failed to download PDF:', error)
    }
  }

  const generateInvoiceHTML = (invoice: any) => {
  if (!invoice) {
    return '<p style="color: #64748b; text-align: center; padding: 20px;">No invoice selected.</p>'
  }

  const colors = {
    dark: '#1a1a1a',
    accent: '#ff650a',
    textMain: '#1e293b',
    textMuted: '#64748b',
    border: '#d0d0d0',
    bgLight: '#f7f7f7',
  }

  const fmt = (n: number) => `LKR ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const customer = customers.find((c) => c.id === invoice.customerId)
  const record = serviceRecords.find((r) => r.id === invoice.serviceRecordId)
  const bike = record ? bikes.find((b) => b.registrationNumber === record.registrationNumber) : null

  const itemsSubtotalAmt = parseFloat(invoice.subtotal || 0)
  const serviceFeeAmt = parseFloat(invoice.tax || 0)
  const discountAmt = parseFloat(invoice.discount || 0)
  const grandTotalAmt = parseFloat(invoice.total || 0)

  const rawItems: any[] = invoice.items && invoice.items.length > 0
    ? invoice.items
    : [{ description: record?.description || 'Standard Maintenance Service', quantity: 1, unitPrice: itemsSubtotalAmt, totalPrice: itemsSubtotalAmt, itemType: 'service' }]

  const serviceItems = rawItems.filter((i) => i.itemType === 'service' || i.itemType === 'other' || !i.itemType)
  const partItems = rawItems.filter((i) => i.itemType === 'part')

  const servicesTotal = serviceItems.reduce((sum, i) => sum + parseFloat(i.totalPrice), 0)
  const partsTotal = partItems.reduce((sum, i) => sum + parseFloat(i.totalPrice), 0)
  const totalPriceBeforeDiscount = servicesTotal + partsTotal + serviceFeeAmt

  const renderRowsService = (list: any[]) => list.map((item, i) => `
    <tr style="border-bottom: 1px solid ${colors.border}; background: ${i % 2 === 0 ? '#ffffff' : colors.bgLight};">
      <td style="padding: 8px 12px;">${item.description}</td>
      <td style="text-align: right; padding: 8px 12px; font-weight: 700;">${fmt(parseFloat(item.totalPrice))}</td>
    </tr>
  `).join('')

  const tableHeaderService = (accentColor: string) => `
    <tr style="background: ${accentColor}; color: white;">
      <th style="text-align: left; padding: 7px 12px; font-size: 10px; font-weight: 700; letter-spacing: 0.4px;">DESCRIPTION</th>
      <th style="text-align: right; padding: 7px 12px; font-size: 10px; font-weight: 700; width: 120px;">SERVICE COST</th>
    </tr>
  `
const renderRowsParts = (list: any[]) => list.map((item, i) => `
    <tr style="border-bottom: 1px solid ${colors.border}; background: ${i % 2 === 0 ? '#ffffff' : colors.bgLight};">
      <td style="padding: 8px 12px;">${item.description}</td>
      <td style="text-align: center; padding: 8px 8px; color: ${colors.textMuted};">${item.quantity}</td>
      <td style="text-align: right; padding: 8px 12px;">${fmt(parseFloat(item.unitPrice))}</td>
      <td style="text-align: right; padding: 8px 12px; font-weight: 700;">${fmt(parseFloat(item.totalPrice))}</td>
    </tr>
  `).join('')

  const tableHeaderParts = (accentColor: string) => `
    <tr style="background: ${accentColor}; color: white;">
      <th style="text-align: left; padding: 7px 12px; font-size: 10px; font-weight: 700; letter-spacing: 0.4px;">DESCRIPTION</th>
      <th style="text-align: center; padding: 7px 8px; font-size: 10px; font-weight: 700; width: 60px;">QTY</th>
      <th style="text-align: right; padding: 7px 12px; font-size: 10px; font-weight: 700; width: 110px;">UNIT PRICE</th>
      <th style="text-align: right; padding: 7px 12px; font-size: 10px; font-weight: 700; width: 120px;">TOTAL PRICE</th>
    </tr>
  `  

  return `
    <div style="width: 210mm; min-height: 297mm; box-sizing: border-box; display: flex; flex-direction: column;">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;800;900&family=Inter:wght@400;500;600;700&display=swap');
        .thm-invoice * { font-family: 'Inter', Arial, sans-serif; }
        .thm-invoice h1, .thm-invoice .thm-heading { font-family: 'Poppins', Arial, sans-serif; }
      </style>

      <div class="thm-invoice" style="padding: 34px 38px; background: white; color: ${colors.textMain}; flex: 1; display: flex; flex-direction: column;">

        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 22px;">
          <div>
            <h1 style="margin: 0; font-size: 27px; font-weight: 900; color: ${colors.dark}; letter-spacing: -0.3px;">
              THEERTHA <span style="color: ${colors.accent};">MOTORS</span>
            </h1>
            <p style="margin: 3px 0 0 0; font-size: 10.5px; font-weight: 700; color: ${colors.textMuted}; text-transform: uppercase; letter-spacing: 0.6px;">
              Electric Bike Repair &amp; Service
            </p>
            <p style="margin: 8px 0 0 0; font-size: 11.5px; color: ${colors.textMain};">📍 138/1 Aluthgoda, Thissamaharama</p>
            <p style="margin: 1px 0 0 0; font-size: 11.5px; color: ${colors.textMain};">📞 071 243 2063 / 071 438 3144</p>
          </div>

          <div style="text-align: right;">
            <div class="thm-heading" style="display: inline-block; background: ${colors.accent}; color: white; font-size: 21px; font-weight: 800; padding: 8px 26px; letter-spacing: 1.5px; clip-path: polygon(12% 0, 100% 0, 100% 100%, 0% 100%);">
              INVOICE
            </div>
            <p style="margin: 8px 0 0 0; font-size: 11.5px;"><strong>Date:</strong> ${invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '--'}</p>
            <p style="margin: 2px 0 0 0; font-size: 11.5px;"><strong>Invoice #:</strong> ${invoice.invoiceNumber || '--'}</p>
          </div>
        </div>

        <!-- Customer & Bike -->
        <div style="border: 1.5px solid ${colors.dark}; border-radius: 6px; overflow: hidden; margin-bottom: 14px;">
          <div class="thm-heading" style="background: ${colors.dark}; color: white; padding: 6px 12px; font-size: 11.5px; font-weight: 700; letter-spacing: 0.5px;">
            CUSTOMER &amp; BIKE DETAILS
          </div>
          <div style="display: flex;">
            <div style="width: 50%; border-right: 1.5px solid ${colors.dark};">
              <div style="background: ${colors.accent}; color: white; padding: 4px 12px; font-size: 9.5px; font-weight: 700; letter-spacing: 0.5px;">CUSTOMER DETAILS</div>
              <div style="padding: 10px 12px; font-size: 12px; line-height: 1.85;">
                <div style="display: flex;"><span style="width: 65px; font-weight: 600;">Name:</span><span>${customer?.name || 'N/A'}</span></div>
                <div style="display: flex;"><span style="width: 65px; font-weight: 600;">Address:</span><span>${customer?.address || 'N/A'}</span></div>
                <div style="display: flex;"><span style="width: 65px; font-weight: 600;">Phone:</span><span>${customer?.phone || 'N/A'}</span></div>
              </div>
            </div>
            <div style="width: 50%;">
              <div style="background: ${colors.accent}; color: white; padding: 4px 12px; font-size: 9.5px; font-weight: 700; letter-spacing: 0.5px;">BIKE DETAILS</div>
              <div style="padding: 10px 12px; font-size: 12px; line-height: 1.85;">
                <div style="display: flex;"><span style="width: 110px; font-weight: 600;">Brand/Model:</span><span>${bike?.brand || 'N/A'} ${bike?.model || ''}</span></div>
                <div style="display: flex;"><span style="width: 110px; font-weight: 600;">Year:</span><span>${bike?.year || 'N/A'}</span></div>
                <div style="display: flex;"><span style="width: 110px; font-weight: 600;">Registration No:</span><span>${bike?.registrationNumber || record?.registrationNumber || '--'}</span></div>
                <div style="display: flex;"><span style="width: 110px; font-weight: 600;">Mileage:</span><span>${record?.milageOnService || 'N/A'} km</span></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Services Performed -->
        ${serviceItems.length > 0 ? `
        <div style="border: 1.5px solid ${colors.dark}; border-radius: 6px; overflow: hidden; margin-bottom: 10px;">
          <div class="thm-heading" style="background: ${colors.dark}; color: white; padding: 6px 12px; font-size: 11.5px; font-weight: 700; letter-spacing: 0.5px;">
            SERVICES PERFORMED
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>${tableHeaderService(colors.accent)}</thead>
            <tbody>${renderRowsService(serviceItems)}</tbody>
          </table>
          <div style="display: flex; justify-content: flex-end; padding: 7px 12px; font-size: 12px; background: ${colors.bgLight}; border-top: 1px solid ${colors.border};">
            <span style="font-weight: 700;">Services Cost: ${fmt(servicesTotal)}</span>
          </div>
        </div>` : ''}

        <!-- Parts Used -->
        ${partItems.length > 0 ? `
        <div style="border: 1.5px solid ${colors.dark}; border-radius: 6px; overflow: hidden; margin-bottom: 14px;">
          <div class="thm-heading" style="background: ${colors.dark}; color: white; padding: 6px 12px; font-size: 11.5px; font-weight: 700; letter-spacing: 0.5px;">
            PARTS USED
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>${tableHeaderParts('#555555')}</thead>
            <tbody>${renderRowsParts(partItems)}</tbody>
          </table>
          <div style="display: flex; justify-content: flex-end; padding: 7px 12px; font-size: 12px; background: ${colors.bgLight}; border-top: 1px solid ${colors.border};">
            <span style="font-weight: 700;">Parts Cost: ${fmt(partsTotal)}</span>
          </div>
        </div>` : ''}

        <!-- Totals: Total Price → Discount → Total Due -->
        <div style="display: flex; justify-content: flex-end; margin-bottom: 22px;">
          <div style="width: 270px; font-size: 12px; border: 1px solid ${colors.border}; border-radius: 6px; overflow: hidden;">
            <div style="display: flex; justify-content: space-between; padding: 7px 12px; border-bottom: 1px solid ${colors.border};">
              <span style="color: ${colors.textMuted};">Total Price</span>
              <span style="font-weight: 700;">${fmt(totalPriceBeforeDiscount)}</span>
            </div>
            ${discountAmt > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 7px 12px; border-bottom: 1px solid ${colors.border}; color: #b91c1c;">
              <span>Discount</span>
              <span style="font-weight: 700;">− ${fmt(discountAmt)}</span>
            </div>` : ''}
            <div class="thm-heading" style="display: flex; justify-content: space-between; background: ${colors.accent}; color: white; padding: 9px 12px; font-weight: 800; font-size: 13px;">
              <span>Total Due</span>
              <span>${fmt(grandTotalAmt)}</span>
            </div>
          </div>
        </div>

        <!-- Pinned to bottom: Authorization + Drive Safe -->
        <div style="margin-top: auto;">
          <div style="border: 1.5px solid ${colors.dark}; border-radius: 6px; overflow: hidden; margin-bottom: 16px;">
            <div class="thm-heading" style="background: ${colors.dark}; color: white; padding: 6px 12px; font-size: 11.5px; font-weight: 700; letter-spacing: 0.5px;">
              OWNER &amp; TECHNICIAN AUTHORIZATION
            </div>
            <div style="display: flex;">
              <div style="width: 50%; border-right: 1.5px solid ${colors.dark}; padding: 12px; font-size: 12px; line-height: 2.3;">
                <p style="margin: 0; font-weight: 700;">BIKE OWNER</p>
                <p style="margin: 0;">Name: ${customer?.name || ''}</p>
                <p style="margin: 0;">Signature: ______________________</p>
                <p style="margin: 0;">Date: ______________</p>
              </div>
              <div style="width: 50%; padding: 12px; font-size: 12px; line-height: 2.3;">
                <p style="margin: 0; font-weight: 700;">TECHNICIAN</p>
                <p style="margin: 0;">Name: ${record?.technician || ''}</p>
                <p style="margin: 0;">Signature: ______________________</p>
                <p style="margin: 0;">Date: ______________</p>
              </div>
            </div>
          </div>

          <p class="thm-heading" style="text-align: center; margin: 0; font-size: 16px; font-weight: 800; font-style: italic; color: ${colors.dark};">
            DRIVE SAFE &amp; <span style="color: ${colors.accent};">ENJOY THE RIDE!</span>
          </p>
        </div>

      </div>
    </div>
  `
}

  const handleDelete = async (invoiceId: number) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      try {
        await deleteInvoice(invoiceId)
        loadData()
      } catch (error) {
        console.error('Failed to delete invoice:', error)
      }
    }
  }

  const handleUpdateStatus = async (invoiceId: number, status: string) => {
    try {
      await updateInvoiceStatus(invoiceId, status)
      loadData()
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-68 my-4 mr-4 min-h-[calc(100vh-2rem)] rounded-3xl border border-border bg-card p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Invoice Management</h2>
            <p className="text-muted-foreground">Create and manage invoices</p>
          </div>
        </div>

        {/* Recent Service Records & Recent Invoices */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Recent Service Records</CardTitle>
              <CardDescription>Latest completed or pending services</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Loading service records...</p>
              ) : serviceRecords.length === 0 ? (
                <p className="text-muted-foreground">No service records yet.</p>
              ) : (
                <div className="space-y-2">
                  {serviceRecords.slice(0, 5).map((record) => {
                    const alreadyInvoiced = invoices.some((inv) => inv.serviceRecordId === record.id)
                    return (
                      <div
                        key={record.id}
                        className="flex items-center justify-between p-3 border border-border rounded-lg"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground">
                            Service #{serviceNumberMap.get(String(record.id)) ?? '—'} — {record.registrationNumber}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(record.serviceDate).toLocaleDateString()} • {record.status}
                            {record.cost ? ` • LKR ${parseFloat(record.cost).toFixed(2)}` : ''}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          disabled={alreadyInvoiced}
                          onClick={() => handleStartInvoiceFromRecord(record)}
                          className="bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {alreadyInvoiced ? 'Invoiced' : 'Create Invoice'}
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Invoices</CardTitle>
              <CardDescription>{invoices.length} total invoices</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Loading invoices...</p>
              ) : invoices.length === 0 ? (
                <p className="text-muted-foreground">No invoices yet.</p>
              ) : (
                <div className="space-y-2">
                  {invoices.slice(0, 5).map((invoice) => {
                    const customer = customers.find((c) => c.id === invoice.customerId)
                    return (
                      <div key={invoice.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground">{invoice.invoiceNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            {customer?.name || 'Unknown Customer'} • LKR. {parseFloat(invoice.total || 0).toFixed(2)}
                          </p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => setViewingInvoice(invoice)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Create Form */}
        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Create New Invoice</CardTitle>
              {formData.items.length > 0 && (
                <CardDescription>
                  {formData.items.length} line item{formData.items.length !== 1 ? 's' : ''} pulled from this service record
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateInvoice} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Customer *</label>
                    <select
                      value={formData.customerId}
                      onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-background"
                      required
                    >
                      <option value="">Select customer</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Service Record *</label>
                    <select
                      value={formData.serviceRecordId}
                      onChange={(e) => setFormData({ ...formData, serviceRecordId: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-background"
                      required
                    >
                      <option value="">Select service record</option>
                      {serviceRecords.map((r) => (
                        <option key={r.id} value={r.id}>
                          Service #{serviceNumberMap.get(String(r.id)) ?? '—'} - {new Date(r.serviceDate).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Service Fee</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.serviceFee || ''}
                      onChange={(e) => setFormData({ ...formData, serviceFee: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Discount</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.discount || ''}
                      onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                {formData.items.length > 0 && (
                  <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                      Line items to be included
                    </p>
                    {formData.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-foreground">
                          {item.description} × {item.quantity}
                          <span className="ml-2 text-xs text-muted-foreground">({item.itemType})</span>
                        </span>
                        <span className="font-medium text-foreground">LKR {item.totalPrice.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-4">
                  <Button type="submit" className="bg-primary hover:bg-primary/90">
                    Create Invoice
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setShowForm(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* All Invoices List */}
        <Card>
          <CardHeader>
            <CardTitle>All Invoices</CardTitle>
            <CardDescription>{invoices.length} total invoices</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading invoices...</p>
            ) : invoices.length === 0 ? (
              <p className="text-muted-foreground">No invoices yet.</p>
            ) : (
              <div className="space-y-3">
                {invoices.map((invoice) => {
                  const customer = customers.find((c) => c.id === invoice.customerId)
                  return (
                    <div key={invoice.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {customer?.name || 'Unknown Customer'} • LKR. {parseFloat(invoice.total || 0).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => setViewingInvoice(await getInvoiceById(invoice.id))}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        <select
                          value={invoice.status}
                          onChange={(e) => handleUpdateStatus(invoice.id, e.target.value)}
                          className="px-3 py-1 border border-border rounded text-sm text-foreground bg-background"
                        >
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <Button size="sm" variant="outline" onClick={() => handleDownloadPDF(invoice)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(invoice.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Modal */}
        {viewingInvoice && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
              <div className="sticky top-0 flex justify-between items-center p-4 border-b border-border bg-background z-10">
                <h3 className="text-lg font-semibold">Invoice {viewingInvoice.invoiceNumber}</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setViewingInvoice(null)}
                >
                  ✕
                </Button>
              </div>
              <div
                className="p-6 bg-[#f8fafc] flex justify-center"
                dangerouslySetInnerHTML={{
                  __html: generateInvoiceHTML(viewingInvoice),
                }}
              />
              <div className="flex gap-2 p-4 border-t border-border bg-background sticky bottom-0 z-10">
                <Button onClick={() => handleDownloadPDF(viewingInvoice)} className="bg-primary hover:bg-primary/90">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button variant="outline" onClick={() => setViewingInvoice(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}