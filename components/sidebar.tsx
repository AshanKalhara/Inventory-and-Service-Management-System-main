'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { BarChart3, Users, Wrench, ShoppingCart, FileText, LogOut, User } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { useState } from 'react'
import useSWR from 'swr'
import { ThemeToggle } from './theme-toggle'

export function Sidebar() {
  const pathname = usePathname()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const { data: userData } = useSWR(
    'user-session',
    async () => {
      try {
        const res = await authClient.getSession()
        // authClient.getSes  () returns an object with a `data` property containing `user`/`session`
        return (res as any)?.data?.user || null
      } catch (error) {
        console.error('Failed to get session:', error)
        return null
      }
    },
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  )

  const navItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: BarChart3,
    },
    {
      name: 'Inventory',
      href: '/inventory',
      icon: ShoppingCart,
    },
    {
      name: 'Services',
      href: '/services',
      icon: Wrench,
    },
    {
      name: 'Customers',
      href: '/customers',
      icon: Users,
    },
    {
      name: 'Invoices',
      href: '/invoices',
      icon: FileText,
    },
  ]

  const handleSignOut = async () => {
    setIsSigningOut(true)
    await authClient.signOut()
  }

  return (
    <div className="fixed left-0 top-0 h-screen w-64 border-r border-border bg-card p-6 flex flex-col">
      
      <div className="mb-12">
        <h1 className="text-2xl font-bold text-primary">THEERTHA MOTORS</h1>
        <p className="text-sm text-muted-foreground">Inventory & Service Management System</p>
      </div>

      <nav className="space-y-2 mb-4 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-muted'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>



      {/* Bottom Section */}
      <div className="border-t border-border pt-4 space-y-2">
        {/* Profile Section */}
      <div className="mb-4 p-2 bg-muted rounded-lg">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">
              {userData?.name || 'Staff Member'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {userData?.email || 'email@example.com'}
            </p>
          </div>
        </div>
      </div>
        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          <LogOut className="h-3 w-3" />
          {isSigningOut ? 'Signing out...' : 'Sign Out'}
        </button>
        <ThemeToggle />
      </div>
    </div>
  )
}
