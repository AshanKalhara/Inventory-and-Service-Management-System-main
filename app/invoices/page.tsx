'use client'

import { useState, useEffect, useMemo } from 'react'
import { Sidebar } from '@/components/sidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Download, Eye, Trash2 } from 'lucide-react'
import { getInvoices, createInvoice, updateInvoiceStatus, deleteInvoice, getInvoiceById } from '@/app/actions/invoices'
import { getServiceRecords, getServiceRecordItemsByRecord } from '@/app/actions/services'
import { getCustomers, getBikes } from '@/app/actions/customers'
import { getServiceNumberMap } from '@/lib/db/service-number'
import { generateInvoiceHTML } from '@/lib/invoice-template'
import { downloadInvoicePDF } from '@/lib/invoice-downloader'

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
      await downloadInvoicePDF(invoiceData, customers, serviceRecords, bikes)
    } catch (error) {
      console.error('Failed to download PDF:', error)
    }
  }

  const handleViewInvoiceClick = async (invoice: any) => {
    try {
      const fullInvoice = await getInvoiceById(invoice.id)
      setViewingInvoice(fullInvoice)
    } catch (error) {
      console.error('Failed to load invoice details:', error)
      setViewingInvoice(invoice)
    }
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
                        <Button size="sm" variant="outline" onClick={() => handleViewInvoiceClick(invoice)}>
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
                        <Button size="sm" variant="outline" onClick={() => handleViewInvoiceClick(invoice)}>
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
                <Button size="sm" variant="ghost" onClick={() => setViewingInvoice(null)}>
                  ✕
                </Button>
              </div>
              <div
                className="p-6 bg-[#f8fafc] flex justify-center"
                dangerouslySetInnerHTML={{
                  __html: generateInvoiceHTML(viewingInvoice, customers, serviceRecords, bikes),
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