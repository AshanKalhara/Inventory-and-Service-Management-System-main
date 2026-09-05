import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { Sidebar } from '@/components/sidebar'
import { db } from '@/lib/db'
import { parts, services, customers, invoices, serviceRecords } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, TrendingUp, Users, ShoppingCart, Wrench, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { getServiceNumberMap } from '@/lib/db/service-number'

export default async function Dashboard() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  const userId = session.user.id

  const [partsList, servicesList, customersList, invoicesList, serviceRecordsList] = await Promise.all([
    db.select().from(parts).where(eq(parts.userId, userId)),
    db.select().from(services).where(eq(services.userId, userId)),
    db.select().from(customers).where(eq(customers.userId, userId)),
    db.select().from(invoices).where(eq(invoices.userId, userId)),
    db.select().from(serviceRecords).where(eq(serviceRecords.userId, userId)),
  ])

  const lowStockParts = partsList.filter(
    (p) => parseInt(p.quantity.toString()) < parseInt(p.minStock.toString())
  )
  const totalRevenue = invoicesList.reduce((sum, inv) => sum + parseFloat(inv.total.toString()), 0)


  const serviceNumberMap = getServiceNumberMap(serviceRecordsList)

  const pendingCount = serviceRecordsList.filter((r) => r.status === 'pending').length
  const completedCount = serviceRecordsList.filter((r) => r.status === 'completed').length

  const statusStyles: Record<string, string> = {
    completed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    'in-progress': 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  }

  const recentServices = [...serviceRecordsList]
    .sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime())
    .slice(0, 5)

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-68 my-4 mr-4 min-h-[calc(100vh-2rem)] rounded-3xl border border-border bg-card p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground">Dashboard</h2>
          <p className="text-muted-foreground">Welcome — here's what's happening at your shop</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Parts</CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <ShoppingCart className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{partsList.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Inventory items tracked</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock</CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
                <AlertCircle className="h-4 w-4 text-red-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-500">{lowStockParts.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Items below minimum</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Customers</CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{customersList.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Total registered</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                LKR {totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">From {invoicesList.length} invoices</p>
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Alert */}
        {lowStockParts.length > 0 && (
          <Card className="mb-8 border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-900 dark:text-orange-100">
                <AlertCircle className="h-5 w-5" />
                Low Stock Alert
              </CardTitle>
              <CardDescription className="text-orange-800 dark:text-orange-200">
                {lowStockParts.length} item{lowStockParts.length !== 1 ? 's' : ''} below minimum stock level
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {lowStockParts.slice(0, 6).map((part) => (
                  <div
                    key={part.id}
                    className="flex justify-between items-center rounded-lg bg-white/60 dark:bg-black/20 px-3 py-2 text-sm"
                  >
                    <span className="text-orange-900 dark:text-orange-100 font-medium truncate">{part.name}</span>
                    <span className="font-semibold text-orange-900 dark:text-orange-100 ml-2 shrink-0">
                      {part.quantity}/{part.minStock}
                    </span>
                  </div>
                ))}
              </div>
              {lowStockParts.length > 6 && (
                <Link
                  href="/inventory"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-orange-900 dark:text-orange-100 hover:underline"
                >
                  View all {lowStockParts.length} items <ArrowUpRight className="h-3 w-3" />
                </Link>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-primary" />
                  Recent Services
                </CardTitle>
                <CardDescription>
                  Latest {Math.min(5, serviceRecordsList.length)} of {serviceRecordsList.length} service records
                </CardDescription>
              </div>
              <Link
                href="/services"
                className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
              >
                View all <ArrowUpRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent>
              {recentServices.length === 0 ? (
                <p className="text-sm text-muted-foreground">No service records yet.</p>
              ) : (
                <div className="space-y-1">
                  {recentServices.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between rounded-lg px-2 py-2.5 -mx-2 hover:bg-muted/50 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">
                          Service #{serviceNumberMap.get(String(record.id)) ?? '—'} — {record.registrationNumber}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(record.serviceDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                          statusStyles[record.status ?? ''] ?? 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {record.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Services Overview</CardTitle>
                <CardDescription>{servicesList.length} services available</CardDescription>
              </div>
              <Link
                href="/services"
                className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
              >
                Manage <ArrowUpRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent>
              {servicesList.length === 0 ? (
                <p className="text-sm text-muted-foreground">No services added yet.</p>
              ) : (
                <div className="space-y-1">
                  {servicesList.slice(0, 5).map((service) => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between rounded-lg px-2 py-2.5 -mx-2 hover:bg-muted/50 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">{service.name}</p>
                        <p className="text-xs text-muted-foreground">{service.category}</p>
                      </div>
                      <p className="font-semibold text-primary text-sm shrink-0">
                        LKR {parseFloat(service.price.toString()).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick summary strip */}
        <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>
            <strong className="text-foreground">{pendingCount}</strong> pending service{pendingCount !== 1 ? 's' : ''}
          </span>
          <span>•</span>
          <span>
            <strong className="text-foreground">{completedCount}</strong> completed
          </span>
        </div>
      </main>
    </div>
  )
}