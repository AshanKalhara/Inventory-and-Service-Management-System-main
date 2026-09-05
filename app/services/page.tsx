'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/sidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Edit2, Trash2, CheckCircle, X, Eye, Wrench, Bike, User } from 'lucide-react'
import {
  getServices,
  createService,
  updateService,
  deleteService,
  getServiceRecords,
  createServiceRecord,
  updateServiceRecord,
  deleteServiceRecord,
  createServiceRecordItem,
  deleteServiceRecordItem,
} from '@/app/actions/services'
import { getCustomers } from '@/app/actions/customers'
import { getBikes } from '@/app/actions/customers'
import { getParts } from '@/app/actions/inventory'
import { getBikeImagebyModel } from '@/lib/db/bike-model'
import { getServiceNumberMap } from '@/lib/db/service-number'
import { useMemo } from 'react'

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([])
  const [serviceRecords, setServiceRecords] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [bikes, setBikes] = useState<any[]>([])
  const [parts, setParts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'services' | 'records'>('services')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    estimatedDuration: 0,
    category: 'General Maintenance',
  })
  const serviceNumberMap = useMemo(
    () => getServiceNumberMap(serviceRecords),
    [serviceRecords]
  )
  const [recordFormData, setRecordFormData] = useState({
    customerId: '',
    registrationNumber: '',
    serviceDate: new Date().toISOString().split('T')[0],
    milageOnService: '',
    description: '',
    technician: '',
    notes: '',
  })
  const [usedParts, setUsedParts] = useState(new Map())
  const [showPartsForm, setShowPartsForm] = useState(false)
  const [partSelection, setPartSelection] = useState({ partId: '', quantity: 1, price: 0 })
  const [usedServices, setUsedServices] = useState(new Map())
  const [showServiceForm, setShowServiceForm] = useState(false)
  const [serviceSelection, setServiceSelection] = useState({ serviceId: '', price: 0 })
  const [showServiceRecord, setShowServiceRecord] = useState<any>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [servicesData, recordsData, customersData, bikesData, partsData] = await Promise.all([
        getServices(),
        getServiceRecords(),
        getCustomers(),
        getBikes(),
        getParts(),
      ])
      setServices(servicesData)
      setServiceRecords(recordsData)
      setCustomers(customersData)
      setBikes(bikesData)
      setParts(partsData)
    } catch (error) {
      console.error('Failed to load data:', error)
    }
    setLoading(false)
  }

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingId) {
        await updateService(editingId, formData)
      } else {
        await createService(formData)
      }
      setFormData({
        name: '',
        description: '',
        price: 0,
        estimatedDuration: 0,
        category: 'General Maintenance',
      })
      setEditingId(null)
      setShowForm(false)
      loadData()
    } catch (error) {
      console.error('Failed to save service:', error)
    }
  }

  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const totalServicesCost = Array.from(usedServices.values())
        .reduce((sum, item) => sum + item.price, 0)
      const totalPartsCost = Array.from(usedParts.values())
        .reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)

      const newRecord = await createServiceRecord({
        customerId: parseInt(recordFormData.customerId),
        registrationNumber: recordFormData.registrationNumber,
        serviceDate: new Date(recordFormData.serviceDate),
        milageOnService: recordFormData.milageOnService,
        description: recordFormData.description,
        technician: recordFormData.technician,
        notes: recordFormData.notes,
        cost: totalServicesCost + totalPartsCost,
      })

      // Save used services for the newly created record
      if (usedServices.size > 0 && newRecord?.id) {
        for (const item of usedServices.values()) {
          await createServiceRecordItem({
            serviceRecordId: newRecord.id,
            serviceId: item.serviceId,
            description: item.service.name,
            quantity: 1,
            unitPrice: item.price,
            totalPrice: item.price,
          })
        }
      }

      // Save used parts for the newly created record
      if (usedParts.size > 0 && newRecord?.id) {
        for (const item of usedParts.values()) {
          await createServiceRecordItem({
            serviceRecordId: newRecord.id,
            partId: item.partId,
            description: item.part.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.unitPrice * item.quantity,
          })
        }
      }

      setRecordFormData({
        customerId: '',
        registrationNumber: '',
        serviceDate: new Date().toISOString().split('T')[0],
        milageOnService: '',
        description: '',
        technician: '',
        notes: '',
      })
      setUsedParts(new Map())
      setUsedServices(new Map())
      setShowPartsForm(false)
      setShowServiceForm(false)
      loadData()
    } catch (error) {
      console.error('Failed to save record:', error)
    }
  }

  const handleEditService = (service: any) => {
    setFormData({
      name: service.name,
      description: service.description || '',
      price: parseFloat(service.price),
      estimatedDuration: service.estimatedDuration || 0,
      category: service.category,
    })
    setEditingId(service.id)
    setShowForm(true)
  }

  const handleDeleteService = async (serviceId: number) => {
    if (confirm('Are you sure?')) {
      try {
        await deleteService(serviceId)
        loadData()
      } catch (error) {
        console.error('Failed to delete service:', error)
      }
    }
  }

  const handleUpdateStatus = async (recordId: number, status: string) => {
    try {
      await updateServiceRecord(recordId, {
        status,
        completionDate: status === 'completed' ? new Date() : undefined,
      })
      loadData()
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const handleDeleteRecord = async (recordId: number) => {
    if (confirm('Are you sure?')) {
      try {
        await deleteServiceRecord(recordId)
        loadData()
      } catch (error) {
        console.error('Failed to delete record:', error)
      }
    }
  }

  const handleAddUsedPart = () => {
    if (!partSelection.partId || partSelection.quantity <= 0) {
      alert('Please select a part and enter quantity')
      return
    }
    const selectedPart = parts.find((p) => p.id === parseInt(partSelection.partId))
    if (!selectedPart) return

    const partId = parseInt(partSelection.partId)
    const existing = usedParts.get(partId)
    const requestedTotal = (existing?.quantity || 0) + partSelection.quantity

    if (requestedTotal > selectedPart.quantity) {
      alert(`Only ${selectedPart.quantity} in stock — cannot use ${requestedTotal}.`)
      return
    }

    const newUsedParts = new Map(usedParts)
    newUsedParts.set(partId, {
      partId,
      quantity: requestedTotal,
      unitPrice: partSelection.price,
      part: selectedPart,
    })
    setUsedParts(newUsedParts)
    setPartSelection({ partId: '', quantity: 1, price: 0 })
  }

  const handleRemoveUsedPart = (partId: number) => {
    const newUsedParts = new Map(usedParts)
    newUsedParts.delete(partId)
    setUsedParts(newUsedParts)
  }

  const handleAddUsedService = () => {
    if (!serviceSelection.serviceId || serviceSelection.price < 0) {
      alert('Please select a service and enter a valid price')
      return
    }

    try {
      const selectedService = services.find((s) => s.id === parseInt(serviceSelection.serviceId))
      if (!selectedService) return

      const newUsedServices = new Map(usedServices)
      const serviceKey = `${serviceSelection.serviceId}_${Date.now()}`
      newUsedServices.set(serviceKey, {
        serviceId: parseInt(serviceSelection.serviceId),
        price: serviceSelection.price,
        service: selectedService,
      })
      setUsedServices(newUsedServices)
      setServiceSelection({ serviceId: '', price: 0 })
    } catch (error) {
      console.error('Failed to add used service:', error)
    }
  }

  const handleRemoveUsedService = (serviceKey: string) => {
    const newUsedServices = new Map(usedServices)
    newUsedServices.delete(serviceKey)
    setUsedServices(newUsedServices)
  }

  const handleViewServiceRecord = (record: any) => {
    setShowServiceRecord(record)
    setIsDetailsOpen(true)
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-68 my-4 mr-4 min-h-[calc(100vh-2rem)] rounded-3xl border border-border bg-card p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Services Management</h2>
            <p className="text-muted-foreground">Manage services and service records</p>
          </div>
        </div>

        {/* ----------Tabs------------- */}
        <div className="flex gap-4 mb-8 border-b border-border">
          <Button
            variant={tab === 'services' ? 'default' : 'ghost'}
            onClick={() => setTab('services')}
            className={tab === 'services' ? 'bg-primary text-primary-foreground border-b-2 border-primary rounded-none' : 'rounded-none'}
          >
            Services
          </Button>
          <Button
            variant={tab === 'records' ? 'default' : 'ghost'}
            onClick={() => setTab('records')}
            className={tab === 'records' ? 'bg-primary text-primary-foreground border-b-2 border-primary rounded-none' : 'rounded-none'}
          >
            Service Records
          </Button>
        </div>

        {/* ------------Services Tab--------------- */}
        {tab === 'services' && (
          <>
            <div className="mb-8">
              <Button
                onClick={() => {
                  setEditingId(null)
                  setShowForm(!showForm)
                }}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            </div>

            {showForm && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>{editingId ? 'Edit Service' : 'Add New Service'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleServiceSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-foreground mb-1">Service Name *</label>
                        <Input
                          placeholder="e.g., Bike Tune-Up"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Service Fee *</label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Duration (minutes)</label>
                        <Input
                          type="number"
                          placeholder="30"
                          value={formData.estimatedDuration}
                          onChange={(e) => setFormData({ ...formData, estimatedDuration: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Category</label>
                        <Input
                          placeholder="e.g., Maintenance"
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                        <Input
                          placeholder="Service description"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <Button type="submit" className="bg-primary hover:bg-primary/90">
                        {editingId ? 'Update Service' : 'Add Service'}
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          setShowForm(false)
                          setEditingId(null)
                          setFormData({
                            name: '',
                            description: '',
                            price: 0,
                            estimatedDuration: 0,
                            category: 'General Maintenance',
                          })
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

            <Card>
              <CardHeader>
                <CardTitle>Available Services</CardTitle>
                <CardDescription>{services.length} services available</CardDescription>
              </CardHeader>
              <CardContent>
                {services.length === 0 ? (
                  <p className="text-muted-foreground">No services yet.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {services.map((service) => (
                      <Card key={service.id} className="border border-border">
                        <CardContent className="pt-6">
                          <h3 className="font-semibold text-foreground mb-2">{service.name}</h3>
                          <div className="space-y-1 mb-4 text-sm text-muted-foreground">
                            <p>Service Fee: LKR {parseFloat(service.price).toFixed(2)}</p>
                            <p>Category: {service.category}</p>
                            {service.estimatedDuration && <p>Duration: {service.estimatedDuration} min</p>}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditService(service)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteService(service.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Records Tab */}
        {tab === 'records' && (
          <>
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Create Service Record</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRecordSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Bike License Number *</label>
                      <select
                        value={recordFormData.registrationNumber}
                        onChange={(e) => {
                          const selectedRegNum = e.target.value
                          const selectedBike = bikes.find((b) => b.registrationNumber === selectedRegNum)
                          const associatedCustomerId = selectedBike?.customerId || selectedBike?.customer?.id || ''

                          setRecordFormData({ ...recordFormData, registrationNumber: selectedRegNum, customerId: associatedCustomerId })
                        }}
                        className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-background"
                        required
                      >
                        <option value="">Select bike</option>
                        {bikes.map((c) => (
                          <option key={c.registrationNumber} value={c.registrationNumber}>
                            {c.registrationNumber} ({c.brand} {c.model})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Customer</label>
                      {(() => {
                        const selectedBike = bikes.find((b) => b.registrationNumber === recordFormData.registrationNumber)
                        const matchedCustomer = customers.find((c) => c.id === parseInt(recordFormData.customerId))
                        const customerName = selectedBike?.customerName || selectedBike?.customer?.name || matchedCustomer?.name || 'N/A'

                        return (
                          <input
                            type="text"
                            value={recordFormData.registrationNumber ? customerName : 'Select a bike first'}
                            readOnly
                            disabled
                            className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-muted opacity-75"
                          />
                        )
                      })()}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Service Date *</label>
                    <Input
                      type="date"
                      value={recordFormData.serviceDate}
                      onChange={(e) => setRecordFormData({ ...recordFormData, serviceDate: e.target.value })}
                      required
                    />
                  </div>

                  {/* Services & Parts Section */}
                  <div className="space-y-6 md:col-span-2">
                    {/* Services Section */}
                    <div className="space-y-3">
                      <label className="block text-base font-semibold text-foreground">
                        Services
                      </label>

                      {/* Added Services List */}
                      {usedServices.size > 0 && (
                        <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Added Services
                          </p>
                          <div className="space-y-2">
                            {Array.from(usedServices.entries()).map(([key, item]) => (
                              <div
                                key={key}
                                className="flex items-center justify-between rounded-md border border-border bg-background p-3 shadow-sm transition-colors"
                              >
                                <div className="space-y-0.5">
                                  <p className="text-sm font-medium text-foreground leading-none">
                                    {item.service.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    LKR. {item.price.toFixed(2)}
                                  </p>
                                </div>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleRemoveUsedService(key)}
                                  type="button"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Add Service Form / Toggle */}
                      {!showServiceForm ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowServiceForm(true)}
                          type="button"
                          className="w-full border-dashed"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Service with Custom Fee
                        </Button>
                      ) : (
                        <div className="space-y-4 rounded-lg border border-border bg-card p-4 shadow-sm">
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">
                              Select Service
                            </label>
                            <select
                              value={serviceSelection.serviceId}
                              onChange={(e) => {
                                const selected = services.find(
                                  (s) => s.id === parseInt(e.target.value)
                                )
                                setServiceSelection({
                                  ...serviceSelection,
                                  serviceId: e.target.value,
                                  price: selected ? parseFloat(selected.price) : 0,
                                })
                              }}
                              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            >
                              <option value="">Select a service</option>
                              {services.map((service) => (
                                <option key={service.id} value={service.id}>
                                  {service.name} (Base: LKR. {parseFloat(service.price).toFixed(2)})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">
                              Service Fee (LKR.)
                            </label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={serviceSelection.price}
                              onChange={(e) =>
                                setServiceSelection({
                                  ...serviceSelection,
                                  price: parseFloat(e.target.value) || 0,
                                })
                              }
                              placeholder="0.00"
                            />
                          </div>

                          <div className="flex justify-end gap-2 pt-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setShowServiceForm(false)}
                              type="button"
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleAddUsedService}
                              type="button"
                              className="bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                              Add Service
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Used/Replaced Parts Section */}
                    <div className="space-y-3">
                      <label className="block text-base font-semibold text-foreground">
                        Used / Replaced Parts
                      </label>

                      {/* Added Parts List */}
                      {usedParts.size > 0 && (
                        <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Added Parts
                          </p>
                          <div className="space-y-2">
                            {Array.from(usedParts.values()).map((item) => (
                              <div
                                key={item.partId}
                                className="flex items-center justify-between rounded-md border border-border bg-background p-3 shadow-sm transition-colors"
                              >
                                <div className="space-y-0.5">
                                  <p className="text-sm font-medium text-foreground leading-none">
                                    {item.part.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Qty: {item.quantity} × LKR.{" "}
                                    {item.unitPrice.toFixed(2)} ={" "}
                                    <span className="font-semibold text-foreground">
                                      LKR. {(item.quantity * item.unitPrice).toFixed(2)}
                                    </span>
                                  </p>
                                </div>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleRemoveUsedPart(item.partId)}
                                  type="button"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Add Parts Form / Toggle */}
                      {!showPartsForm ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowPartsForm(true)}
                          type="button"
                          className="w-full border-dashed"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Used/Replaced Part
                        </Button>
                      ) : (
                        <div className="space-y-4 rounded-lg border border-border bg-card p-4 shadow-sm">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="space-y-1.5 md:col-span-2">
                              <label className="text-xs font-medium text-muted-foreground">
                                Select Part
                              </label>
                              <select
                                value={partSelection.partId}
                                onChange={(e) => {
                                  const selected = parts.find((p) => p.id === parseInt(e.target.value))
                                  setPartSelection({
                                    ...partSelection,
                                    partId: e.target.value,
                                    price: selected ? parseFloat(selected.unitPrice) : 0,
                                  })
                                }}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                              >
                                <option value="">Select a part</option>
                                {parts.map((part) => (
                                  <option key={part.id} value={part.id}>
                                    {part.name} (Stock: {part.quantity})
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-muted-foreground">
                                Quantity
                              </label>
                              <Input
                                type="number"
                                min="1"
                                value={partSelection.quantity}
                                onChange={(e) =>
                                  setPartSelection({
                                    ...partSelection,
                                    quantity: parseInt(e.target.value) || 1,
                                  })
                                }
                                placeholder="1"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-muted-foreground">
                                Unit Price (LKR.)
                              </label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={partSelection.price}
                                onChange={(e) =>
                                  setPartSelection({
                                    ...partSelection,
                                    price: parseFloat(e.target.value) || 0,
                                  })
                                }
                                placeholder="0.00"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-muted-foreground">
                                Total
                              </label>
                              <div className="flex h-8 items-center rounded-md border border-input bg-muted/40 px-3 text-sm font-semibold text-foreground">
                                LKR {(partSelection.quantity * partSelection.price).toFixed(2)}
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setShowPartsForm(false)}
                              type="button"
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                handleAddUsedPart()
                                setShowPartsForm(false)
                              }}
                              type="button"
                              className="bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                              Add Part
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Milage On Service</label>
                    <Input
                      placeholder="Mileage"
                      value={recordFormData.milageOnService}
                      onChange={(e) => setRecordFormData({ ...recordFormData, milageOnService: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Technician</label>
                    <Input
                      placeholder="Technician name"
                      value={recordFormData.technician}
                      onChange={(e) => setRecordFormData({ ...recordFormData, technician: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                    <Input
                      placeholder="Service details"
                      value={recordFormData.description}
                      onChange={(e) => setRecordFormData({ ...recordFormData, description: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-1">Notes</label>
                    <Input
                      placeholder="Additional notes"
                      value={recordFormData.notes}
                      onChange={(e) => setRecordFormData({ ...recordFormData, notes: e.target.value })}
                    />
                  </div>

                  <Button type="submit" className="bg-primary hover:bg-primary/90">
                    Create Service Record
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Service Records</CardTitle>
                <CardDescription>{serviceRecords.length} total records</CardDescription>
              </CardHeader>
              <CardContent>
                {serviceRecords.length === 0 ? (
                  <p className="text-muted-foreground">No service records yet.</p>
                ) : (
                  <div className="space-y-4">
                    {serviceRecords.map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground">
                            Service #{serviceNumberMap.get(String(record.id)) ?? '—'} - ({record.registrationNumber})
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(record.serviceDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleViewServiceRecord(record)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <select
                            value={record.status}
                            onChange={(e) => handleUpdateStatus(record.id, e.target.value)}
                            className="px-3 py-1 border border-border rounded text-sm text-foreground bg-background"
                          >
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>
                          <Button size="sm" variant="outline" onClick={() => handleDeleteRecord(record.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {isDetailsOpen && showServiceRecord && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                <Card className="w-full max-w-2xl max-h-[85vh] flex flex-col border-border bg-card shadow-2xl overflow-hidden">
                  {(() => {
                    const modalBike = bikes.find((b) => b.registrationNumber === showServiceRecord.registrationNumber)
                    const modalCustomer = customers.find((c) => c.id === modalBike?.customerId)
                    const modalBikeImg = getBikeImagebyModel(modalBike?.model)

                    const formatDate = (dateVal: any) => {
                      if (!dateVal) return 'N/A'
                      const d = new Date(dateVal)
                      return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                    }

                    const statusStyles: Record<string, string> = {
                      pending: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
                      'in-progress': 'bg-blue-500/15 text-blue-500 border-blue-500/30',
                      completed: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
                    }
                    const statusClass = statusStyles[showServiceRecord.status] || 'bg-muted text-muted-foreground border-border'

                    return (
                      <>
                        <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4 sticky top-0 z-10 bg-card">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                              <CheckCircle className="h-5 w-5" />
                            </div>
                            <div>
                              <CardTitle className="text-xl font-bold text-foreground">Service Record Details</CardTitle>
                              <p className="text-xs text-muted-foreground">
                                Service #{serviceNumberMap.get(String(showServiceRecord.id)) ?? '—'} - ({showServiceRecord.registrationNumber})
                              </p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => setShowServiceRecord(null)}>
                            Close
                          </Button>
                        </CardHeader>

                        <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
                          {/* Bike Details */}
                          <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                              <Bike className="h-4 w-4 text-primary" />
                              Bike Details
                            </h3>
                            <div className="flex gap-4 rounded-xl border border-border bg-muted/30 p-4">
                              <div className="h-24 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-border bg-background">
                                <img
                                  src={modalBikeImg || '/placeholder-bike.png'}
                                  alt={modalBike?.model || 'Bike'}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm flex-1">
                                <div>
                                  <p className="text-xs text-muted-foreground">Registration</p>
                                  <p className="font-medium text-foreground font-mono">{showServiceRecord.registrationNumber}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Customer</p>
                                  <p className="font-medium text-foreground">{modalCustomer?.name || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Brand</p>
                                  <p className="font-medium text-foreground">{modalBike?.brand || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Model</p>
                                  <p className="font-medium text-foreground">{modalBike?.model || 'N/A'}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Service Details */}
                          <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                              <Wrench className="h-4 w-4 text-primary" />
                              Service Details
                            </h3>
                            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-4">
                              <div className="flex items-center justify-between">
                                <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusClass}`}>
                                  {showServiceRecord.status || 'N/A'}
                                </span>
                                <span className="text-lg font-bold text-foreground">
                                  LKR {showServiceRecord.cost ? parseFloat(showServiceRecord.cost).toFixed(2) : '0.00'}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                                <div>
                                  <p className="text-xs text-muted-foreground">Service Date</p>
                                  <p className="font-medium text-foreground">{formatDate(showServiceRecord.serviceDate)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Mileage</p>
                                  <p className="font-medium text-foreground">{showServiceRecord.milageOnService || 'N/A'} km</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Technician</p>
                                  <p className="font-medium text-foreground">{showServiceRecord.technician || 'N/A'}</p>
                                </div>
                              </div>

                              {showServiceRecord.description && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Description</p>
                                  <p className="text-sm text-foreground">{showServiceRecord.description}</p>
                                </div>
                              )}

                              {showServiceRecord.notes && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Notes</p>
                                  <p className="text-sm text-foreground">{showServiceRecord.notes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </>
                    )
                  })()}
                </Card>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}