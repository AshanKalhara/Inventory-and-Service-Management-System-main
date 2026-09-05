'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/sidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Edit2, Trash2, AlertCircle, ShoppingBag } from 'lucide-react'
import { getParts, createPart, updatePart, deletePart, getLowStockParts } from '@/app/actions/inventory'

export default function InventoryPage() {
  const [tab, setTab] = useState<'inventory' | 'buy parts'>('inventory')
  const [parts, setParts] = useState<any[]>([])
  const [lowStockParts, setLowStockParts] = useState<any[]>([])
  const [purchases, setPurchases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const initialFormData = {
    name: '',
    sku: '',
    category: 'General',
    quantity: 0,
    minStock: 5,
    unitPrice: 0,
    supplier: '',
    notes: '',
  }

  const [formData, setFormData] = useState(initialFormData)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [allParts, lowStock] = await Promise.all([
        getParts(),
        getLowStockParts(),
      ])
      setParts(allParts)
      setLowStockParts(lowStock)
    } catch (error) {
      console.error('Failed to load inventory data:', error)
    }
    setLoading(false)
  }

  const resetForm = () => {
    setFormData(initialFormData)
    setEditingId(null)
    setShowForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingId) {
        await updatePart(editingId, formData)
      } else {
        await createPart(formData)
      }
      resetForm()
      loadData()
    } catch (error) {
      console.error('Failed to save part:', error)
    }
  }

  const handleEdit = (part: any) => {
    setFormData({
      name: part.name,
      sku: part.sku,
      category: part.category,
      quantity: parseInt(part.quantity),
      minStock: parseInt(part.minStock),
      unitPrice: parseFloat(part.unitPrice),
      supplier: part.supplier || '',
      notes: part.notes || '',
    })
    setEditingId(part.id)
    setShowForm(true)
  }

  const handleDelete = async (partId: number) => {
    if (confirm('Are you sure you want to delete this part?')) {
      try {
        await deletePart(partId)
        loadData()
      } catch (error) {
        console.error('Failed to delete part:', error)
      }
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-68 my-4 mr-4 min-h-[calc(100vh-2rem)] rounded-3xl border border-border bg-card p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Inventory Management</h2>
            <p className="text-muted-foreground">Manage bike parts and supplies</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b border-border">
          <Button
            variant={tab === 'inventory' ? 'default' : 'ghost'}
            onClick={() => setTab('inventory')}
            className={
              tab === 'inventory'
                ? 'bg-primary text-primary-foreground border-b-2 border-primary rounded-none'
                : 'rounded-none'
            }
          >
            Inventory
          </Button>
          <Button
            variant={tab === 'buy parts' ? 'default' : 'ghost'}
            onClick={() => setTab('buy parts')}
            className={
              tab === 'buy parts'
                ? 'bg-primary text-primary-foreground border-b-2 border-primary rounded-none'
                : 'rounded-none'
            }
          >
            Buy Parts
          </Button>
        </div>

        {/* Inventory Tab View */}
        {tab === 'inventory' && (
          <div className="space-y-6">
            {/* Low Stock Warning */}
            {lowStockParts.length > 0 && (
              <Card className="mb-8 border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-900 dark:text-orange-100">
                    <AlertCircle className="h-5 w-5" />
                    Low Stock Warning
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                    {lowStockParts.map((part) => (
                      <div key={part.id} className="rounded bg-white/50 dark:bg-black/20 p-3">
                        <p className="font-medium text-orange-900 dark:text-orange-100">{part.name}</p>
                        <p className="text-sm text-orange-800 dark:text-orange-200">
                          Stock: {part.quantity}/{part.minStock}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Parts List Table */}
            <Card>
              <CardHeader>
                <CardTitle>Parts List</CardTitle>
                <CardDescription>{parts.length} total parts in inventory</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-muted-foreground">Loading parts...</p>
                ) : parts.length === 0 ? (
                  <p className="text-muted-foreground">No parts added yet. Add your first part to get started.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left font-semibold py-2">Name</th>
                          <th className="text-left font-semibold py-2">SKU</th>
                          <th className="text-left font-semibold py-2">Category</th>
                          <th className="text-right font-semibold py-2">Quantity</th>
                          <th className="text-right font-semibold py-2">Unit Price</th>
                          <th className="text-right font-semibold py-2">Supplier</th>
                          <th className="text-right font-semibold py-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parts.map((part) => (
                          <tr key={part.id} className="border-b border-border hover:bg-muted/50">
                            <td className="py-3">{part.name}</td>
                            <td className="py-3 text-muted-foreground">{part.sku}</td>
                            <td className="py-3">{part.category}</td>
                            <td className="py-3 text-right">
                              <span
                                className={
                                  parseInt(part.quantity) < parseInt(part.minStock)
                                    ? 'text-red-500 font-semibold'
                                    : ''
                                }
                              >
                                {part.quantity}
                              </span>
                            </td>
                            <td className="py-3 text-right">LKR {parseFloat(part.unitPrice).toFixed(2)}</td>
                            <td className="py-3 text-right text-muted-foreground">{part.supplier || '-'}</td>
                            <td className="py-3 text-right">
                              <div className="flex justify-end gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleEdit(part)}>
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleDelete(part.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Buy Parts Tab View */}
        {tab === 'buy parts' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Procurement & Buying</h3>
            </div>
            <div>
            {/* Add / Edit Form */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>{editingId ? 'Edit Part' : 'Log New Part Purchase'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Part Name *</label>
                        <Input
                          type="text"
                          placeholder="e.g., Chain 10-speed"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">SKU *</label>
                        <Input
                          type="text"
                          placeholder="e.g., CHA-10SP"
                          value={formData.sku}
                          onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Category</label>
                        <Input
                          type="text"
                          placeholder="e.g., Drivetrain"
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Unit Price (LKR) *</label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={formData.unitPrice}
                          onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Quantity Bought</label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={formData.quantity}
                          onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Minimum Stock</label>
                        <Input
                          type="number"
                          placeholder="5"
                          value={formData.minStock}
                          onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 5 })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Supplier</label>
                        <Input
                          type="text"
                          placeholder="Supplier name"
                          value={formData.supplier}
                          onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Notes</label>
                        <Input
                          type="text"
                          placeholder="Additional notes"
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <Button type="submit" className="bg-primary hover:bg-primary/90">
                        {editingId ? 'Update Part' : 'Save Purchase'}
                      </Button>
                      <Button type="button" onClick={resetForm} variant="outline">
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
              </div>

            {/* Recently Bought Parts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  Recent Purchases
                </CardTitle>
                <CardDescription>Overview of recently acquired parts and stock logs</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-muted-foreground">Loading recent purchases...</p>
                ) : parts.length === 0 ? (
                  <p className="text-muted-foreground">No purchases logged yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className='text-left font-semibold py-2'>SKU</th>
                          <th className="text-left font-semibold py-2">Part Name</th>
                          <th className="text-left font-semibold py-2">Supplier</th>
                          <th className="text-right font-semibold py-2">Qty Bought</th>
                          <th className="text-right font-semibold py-2">Unit Price</th>
                          <th className="text-right font-semibold py-2">Total Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parts.map((part) => {
                          const total = (parseFloat(part.unitPrice || 0) * parseInt(part.quantity || 0)).toFixed(2)
                          return (
                            <tr key={part.id} className="border-b border-border hover:bg-muted/50">
                              <td className="py-3 font-medium text-primary">{part.sku}</td>
                              <td className="py-3 font-medium">{part.name}</td>
                              <td className="py-3 text-muted-foreground">{part.supplier || 'N/A'}</td>
                              <td className="py-3 text-right">{part.quantity}</td>
                              <td className="py-3 text-right">LKR {parseFloat(part.unitPrice || 0).toFixed(2)}</td>
                              <td className="py-3 text-right font-semibold text-primary">LKR {total}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}