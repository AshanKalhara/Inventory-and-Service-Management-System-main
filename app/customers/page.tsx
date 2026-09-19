'use client'

import { useState, useEffect } from 'react'
import { PermissionWarning } from '@/components/ui/permission-warning'
import { Sidebar } from '@/components/sidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Edit2, Trash2, Search, Eye, User, Bike, Calendar, Mail, Phone, MapPin, History, Download } from 'lucide-react'
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getBikes,
  createBike,
  deleteBike,
} from '@/app/actions/customers'
import { getBikeImagebyModel } from '@/lib/db/bike-model'
import { getBikeServiceHistory, getServiceRecords } from '@/app/actions/services'
import { getInvoices, getInvoiceById } from '@/app/actions/invoices'
import { getServiceNumberMap } from '@/lib/db/service-number'
import { generateInvoiceHTML } from '@/lib/invoice-template'
import { downloadInvoicePDF } from '@/lib/invoice-downloader'

export type ServiceRecord = {
  id: number;
  registrationNumber: string;
  serviceDate: Date | string;
  description?: string | null;
  price?: string | number | null;
  milageOnService?: string | null;
  status?: string;
};

export type Invoice = {
  id: number;
  serviceRecordId: number;
  invoiceNumber: string;
  [key: string]: any;
};

export function ServiceHistory({
  serviceRecords = [],
  allServiceRecords = [],
  invoices = [],
  onViewInvoice,
}: {
  serviceRecords?: ServiceRecord[];
  allServiceRecords?: ServiceRecord[];
  invoices?: Invoice[];
  onViewInvoice?: (invoice: Invoice) => void;
}) {
  if (!serviceRecords || serviceRecords.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No service history available.
      </p>
    );
  }

  const formatDate = (dateVal: Date | string) => {
    if (!dateVal) return "N/A";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
  };

  const getCostDetails = (
    costVal?: string | number | null,
    status?: string | null
  ) => {
    const normalizedStatus = status?.toLowerCase() || "";
    const isPaidOrBilled =
      normalizedStatus === 'billed' ||
      normalizedStatus === 'paid' ||
      normalizedStatus === 'completed';

    const num = costVal !== null && costVal !== undefined && costVal !== "" ? Number(costVal) : NaN;
    const hasValidCost = !isNaN(num);

    if (isPaidOrBilled || hasValidCost) {
      const formattedAmount = hasValidCost ? `Rs. ${num.toFixed(2)}` : "Paid";
      return { text: formattedAmount, isBilled: true };
    }

    return { text: "Pending", isBilled: false };
  };

  const masterList = allServiceRecords.length > 0 ? allServiceRecords : serviceRecords;
  const serviceNumberMap = getServiceNumberMap(masterList);

  return (
    <div className="space-y-3">
      {serviceRecords.map((record, index) => {
        const rawMileage = record.milageOnService?.trim();
        const mileageNumber = rawMileage ? Number(rawMileage) : NaN;
        const hasValidMileage = !isNaN(mileageNumber) && mileageNumber > 0;
        const { text: costText, isBilled } = getCostDetails(record.price, record.status);

        const serviceNumber = serviceNumberMap.get(String(record.id)) ?? index + 1;

        const isCompleted = record.status?.toLowerCase() === 'completed';
        const matchedInvoice = invoices.find((inv) => inv.serviceRecordId === record.id)

        return (
          <div
            key={record.id ?? `service-record-${index}`}
            className="grid grid-cols-1 p-3 border border-border rounded-lg bg-card text-card-foreground text-sm gap-1 shadow-sm"
          >
            <div className="flex justify-between items-center">
              <p className="font-medium text-foreground">
                Service #{serviceNumber} - ({record.registrationNumber})
              </p>
              {hasValidMileage && <span className="text-xs text-muted-foreground">{rawMileage} km</span>}
            </div>

            <div className="flex justify-between items-center text-xs text-muted-foreground font-medium">
              <span>Date: {formatDate(record.serviceDate)}</span>
            </div>

            <p className="text-muted-foreground text-xs">
              {record.description || "General Service"}
            </p>

            <div className="flex items-center justify-between">
              <p
                className={`font-semibold text-xs ${
                  isBilled ? "text-emerald-500" : "text-muted-foreground"
                }`}
              >
                Status: {costText}
              </p>

              {isCompleted && matchedInvoice && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => onViewInvoice?.(matchedInvoice)}
                >
                  Show Invoice
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [customerBikes, setCustomerBikes] = useState<any[]>([])
  const [allBikes, setAllBikes] = useState<any[]>([])
  const [serviceRecords, setServiceRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showBikeForm, setShowBikeForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null)
  const [viewingProfile, setViewingProfile] = useState<any | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [viewingInvoice, setViewingInvoice] = useState<any | null>(null)
  const [permissionError, setPermissionError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  })

  const [bikeFormData, setBikeFormData] = useState({
    registrationNumber: '',
    brand: '',
    model: '',
    year: String(new Date().getFullYear()),
    mileage: '',
    imageUrl: '',
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('name-asc')

  useEffect(() => {
    loadCustomers()
    loadGlobalInvoiceData()
  }, [])

  const loadCustomers = async () => {
    setLoading(true)
    try {
      const data = await getCustomers()
      setCustomers(data || [])
    } catch (error) {
      console.error('Failed to load customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadGlobalInvoiceData = async () => {
    try {
      const [recordsData, bikesData] = await Promise.all([
        getServiceRecords(),
        getBikes(),
      ])
      setServiceRecords(recordsData || [])
      setAllBikes(bikesData || [])
    } catch (error) {
      console.error('Failed to load global invoice data:', error)
    }
  }

  const loadCustomerBikes = async (customerId: number) => {
    try {
      setSelectedCustomerId(customerId)
      const data = await getBikes()
      const filteredBikes = (data || []).filter((bike: any) => bike.customerId === customerId)
      setCustomerBikes(filteredBikes)
      return filteredBikes
    } catch (error) {
      console.error('Failed to load bikes:', error)
      setCustomerBikes([])
      return []
    }
  }

  const handleViewProfile = async (customer: any) => {
    setLoadingProfile(true)
    setViewingProfile(customer)
    try {
      const fetchedBikes = await loadCustomerBikes(customer.id)

      let historyRecords: ServiceRecord[] = []
      let allRecords: ServiceRecord[] = []

      const [histories, allRecordsResult, invoicesResult] = await Promise.all([
        fetchedBikes.length > 0
          ? Promise.all(fetchedBikes.map((b: any) => getBikeServiceHistory(b.registrationNumber)))
          : Promise.resolve([]),
        getServiceRecords(),
        getInvoices(),
      ])

      historyRecords = histories
        .filter((h): h is NonNullable<typeof h> => Boolean(h))
        .flatMap((h) => h.serviceRecords)

      allRecords = allRecordsResult

      setServiceRecords(allRecords || [])

      setViewingProfile({
        ...customer,
        serviceRecords: historyRecords,
        allServiceRecords: allRecords,
        invoices: invoicesResult || [],
      })
    } catch (error) {
      console.error('Failed to load customer profile details:', error)
    } finally {
      setLoadingProfile(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPermissionError(null)

    if (editingId) {
      const result = await updateCustomer(editingId, formData)
      if (!result.success) {
        setPermissionError(result.error ?? 'Something went wrong. Please try again.')
        return
      }
    } else {
      const result = await createCustomer(formData)
      if (!result.success) {
        setPermissionError(result.error ?? 'Something went wrong. Please try again.')
        return
      }
    }

    setFormData({ name: '', email: '', phone: '', address: '' })
    setEditingId(null)
    setShowForm(false)
    await loadCustomers()
  }

  const handleBikeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomerId) return
    try {
      await createBike({ customerId: selectedCustomerId, ...bikeFormData })
      setBikeFormData({
        registrationNumber: '',
        brand: '',
        model: '',
        year: String(new Date().getFullYear()),
        mileage: '',
        imageUrl: '',
      })
      setShowBikeForm(false)
      await loadCustomerBikes(selectedCustomerId)
      await loadGlobalInvoiceData()
    } catch (error) {
      console.error('Failed to save bike:', error)
    }
  }

  const handleEdit = (customer: any) => {
    setFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
    })
    setEditingId(customer.id)
    setShowForm(true)
  }

  const handleDelete = async (customerId: number) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      const result = await deleteCustomer(customerId)
      if (!result.success) {
        setPermissionError(result.error ?? 'Something went wrong. Please try again.')
        return
      }
      if (selectedCustomerId === customerId) {
        setSelectedCustomerId(null)
        setCustomerBikes([])
      }
      await loadCustomers()
    }
  }

  const handleDeleteBike = async (registrationNumber: string) => {
    if (confirm('Are you sure you want to delete this bike?')) {
      try {
        await deleteBike(registrationNumber)
        if (selectedCustomerId) {
          await loadCustomerBikes(selectedCustomerId)
        }
        await loadGlobalInvoiceData()
      } catch (error) {
        console.error('Failed to delete bike:', error)
      }
    }
  }

  const handleViewInvoiceClick = async (invoice: any) => {
    try {
      const fullInvoice = await getInvoiceById(invoice.id)
      setViewingInvoice(fullInvoice || invoice)
    } catch (error) {
      console.error('Failed to load invoice details:', error)
      setViewingInvoice(invoice)
    }
  }

  const handleDownloadPDF = async (invoice: any) => {
    try {
      const invoiceData = await getInvoiceById(invoice.id)
      await downloadInvoicePDF(invoiceData, customers, serviceRecords, allBikes)
    } catch (error) {
      console.error('Failed to download PDF:', error)
    }
  }

  const filteredCustomers = customers
    .filter((customer) => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        customer.name?.toLowerCase().includes(q) ||
        (customer.email || '').toLowerCase().includes(q) ||
        (customer.phone || '').toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name-desc':
          return b.name.localeCompare(a.name)
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'name-asc':
        default:
          return a.name.localeCompare(b.name)
      }
    })

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-68 my-4 mr-4 min-h-[calc(100vh-2rem)] rounded-3xl border border-border bg-card p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Customers & Bikes</h2>
            <p className="text-muted-foreground">Manage customer information and their bikes</p>
          </div>
          <Button
            onClick={() => {
              setEditingId(null)
              setShowForm(!showForm)
            }}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{editingId ? 'Edit Customer' : 'Add New Customer'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-foreground">Name *</label>
                    <Input
                      type="text"
                      placeholder="Customer name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">Email</label>
                    <Input
                      type="email"
                      placeholder="customer@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">Phone</label>
                    <Input
                      type="tel"
                      placeholder="Phone number"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-foreground">Address</label>
                    <Input
                      type="text"
                      placeholder="Street address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                </div>

                <PermissionWarning message={permissionError} />

                <div className="flex gap-4">
                  <Button type="submit" className="bg-primary hover:bg-primary/90">
                    {editingId ? 'Update Customer' : 'Add Customer'}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setEditingId(null)
                      setFormData({ name: '', email: '', phone: '', address: '' })
                    }}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Customers List</CardTitle>
                <CardDescription>
                  {filteredCustomers.length} of {customers.length} customers
                </CardDescription>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search by name, email, or phone"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                  >
                    <option value="name-asc">Name: A to Z</option>
                    <option value="name-desc">Name: Z to A</option>
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                {!showForm && <PermissionWarning message={permissionError} />}
                {loading ? (
                  <p className="text-muted-foreground">Loading customers...</p>
                ) : filteredCustomers.length === 0 ? (
                  <p className="text-muted-foreground">No customers found.</p>
                ) : (
                  <div className="space-y-2">
                    {filteredCustomers.map((customer) => (
                      <div
                        key={customer.id}
                        className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors ${
                          selectedCustomerId === customer.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:bg-muted'
                        }`}
                        onClick={() => loadCustomerBikes(customer.id)}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-foreground">{customer.name}</p>
                          <p className="truncate text-sm text-muted-foreground">
                            {customer.email || customer.phone || 'No contact'}
                          </p>
                        </div>
                        <div className="ml-4 flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewProfile(customer)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEdit(customer)
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(customer.id)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column Quick Bike Preview */}
          <div>
            {selectedCustomerId ? (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>Bikes</CardTitle>
                    <CardDescription>
                      {customers.find((c) => c.id === selectedCustomerId)?.name}&apos;s bikes
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setShowBikeForm(!showBikeForm)}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {showBikeForm && (
                    <form onSubmit={handleBikeSubmit} className="mb-4 space-y-3 rounded-lg border border-border p-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-foreground">Registration No *</label>
                        <Input
                          type="text"
                          placeholder="e.g. AB-1234"
                          value={bikeFormData.registrationNumber}
                          onChange={(e) => setBikeFormData({ ...bikeFormData, registrationNumber: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-foreground">Brand *</label>
                        <Input
                          type="text"
                          placeholder="Brand"
                          value={bikeFormData.brand}
                          onChange={(e) => setBikeFormData({ ...bikeFormData, brand: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-foreground">Model *</label>
                        <Input
                          type="text"
                          placeholder="Model"
                          value={bikeFormData.model}
                          onChange={(e) => setBikeFormData({ ...bikeFormData, model: e.target.value })}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-foreground">Year</label>
                          <Input
                            type="number"
                            placeholder="YYYY"
                            value={bikeFormData.year}
                            onChange={(e) => setBikeFormData({ ...bikeFormData, year: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-foreground">Mileage *</label>
                          <Input
                            type="text"
                            placeholder="Mileage"
                            value={bikeFormData.mileage}
                            onChange={(e) => setBikeFormData({ ...bikeFormData, mileage: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" size="sm" className="flex-1 bg-primary text-sm hover:bg-primary/90">
                          Add
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setShowBikeForm(false)}
                          className="flex-1 text-sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  )}
                  <div className="space-y-2">
                    {customerBikes.map((bike) => (
                      <div key={bike.registrationNumber} className="rounded-lg border border-border p-2">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground">
                              {bike.registrationNumber} ({bike.brand} {bike.model})
                            </p>
                            <p className="text-xs text-muted-foreground">{bike.year || 'Year N/A'}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteBike(bike.registrationNumber)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {customerBikes.length === 0 && (
                      <p className="text-xs text-muted-foreground">No bikes registered</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-sm text-muted-foreground">
                    Select a customer to view their bikes
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Profile Modal */}
        {viewingProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <Card className="w-full max-w-4xl max-h-[85vh] flex flex-col border-border bg-card shadow-2xl">

              {/*Card Header*/}
              <CardHeader className="flex flex-row pt-4 top-0 items-center justify-between border-b border-border pb-2 sticky top-0 z-10 bg-card overflow-hidden">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-foreground">{viewingProfile.name}</CardTitle>
                    <CardDescription>Customer Profile & Bike History</CardDescription>
                  </div>
                </div>
                <Button variant="outline" onClick={() => setViewingProfile(null)}>
                  Close
                </Button>
              </CardHeader>
              {/*Card Content */}
              <CardContent className="flex-1 overflow-y-auto p-0">
                <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">

                  {/* LEFT SIDE: Customer Details */}
                  <div className="space-y-4">
                    <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      Customer Details
                    </h3>
                    <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4 text-sm">
                      <div className="flex items-start gap-3">
                        <Mail className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-muted-foreground">Email</p>
                          <p className="font-medium text-foreground truncate">{viewingProfile.email || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Phone className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Phone</p>
                          <p className="font-medium text-foreground">{viewingProfile.phone || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-muted-foreground">Address</p>
                          <p className="font-medium text-foreground break-words">{viewingProfile.address || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Customer Since</p>
                          <p className="font-medium text-foreground">
                            {viewingProfile.createdAt
                              ? new Date(viewingProfile.createdAt).toLocaleDateString()
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT SIDE: Bike Details */}
                  <div className="space-y-4 border-t border-border pt-6 md:border-l md:border-t-0 md:pl-6 md:pt-0">
                    <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                      <Bike className="h-4 w-4 text-primary" />
                      Registered Bikes ({customerBikes.length})
                    </h3>

                    <div className="space-y-3">
                      {customerBikes.length > 0 ? (
                        customerBikes.map((bike: any) => {
                          const bikeImgSrc = getBikeImagebyModel(bike.model)
                          return (
                            <div
                              key={bike.registrationNumber}
                              className="flex items-center gap-4 rounded-xl border border-border bg-muted/50 p-3 transition-all hover:bg-muted"
                            >
                              <div className="h-40 w-35 flex-shrink-0 overflow-hidden rounded-lg border border-border bg-background">
                                <img
                                  src={bikeImgSrc || '/placeholder-bike.png'}
                                  alt={`${bike.brand || ''} ${bike.model || ''}`}
                                  className="h-full w-full object-fill"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-foreground">
                                  {bike.brand} {bike.model}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Reg: <span className="font-mono font-medium text-foreground">{bike.registrationNumber}</span>
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {bike.year ? `Year: ${bike.year}` : ''} {bike.mileage ? `| ${bike.mileage} km` : ''}
                                </p>
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <p className="text-sm text-muted-foreground">No bikes registered for this customer.</p>
                      )}
                    </div>
                  </div>

                  {/* Service History Section */}
                  <div className="col-span-1 md:col-span-2 border-t border-border pt-6">
                    <h3 className="mb-3 text-base font-semibold text-foreground flex items-center gap-2">
                      <History className="h-4 w-4 text-primary" />
                      Service History
                    </h3>
                    {loadingProfile ? (
                      <p className="text-sm text-muted-foreground">Loading history...</p>
                    ) : (
                      <ServiceHistory
                        serviceRecords={viewingProfile?.serviceRecords ?? []}
                        allServiceRecords={viewingProfile?.allServiceRecords ?? []}
                        invoices={viewingProfile?.invoices ?? []}
                        onViewInvoice={handleViewInvoiceClick}
                      />
                    )}
                  </div>

                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Invoice View Modal */}
        {viewingInvoice && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
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
                  __html: generateInvoiceHTML(viewingInvoice, customers, serviceRecords, allBikes),
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