import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export type Role = 'user' | 'admin' | 'super_admin'

const ROLE_RANK: Record<Role, number> = {
  user: 0,
  admin: 1,
  super_admin: 2,
}

export async function getCurrentUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')

  const [dbUser] = await db.select().from(user).where(eq(user.id, session.user.id))
  if (!dbUser) throw new Error('User not found')

  return dbUser
}

export async function requireRole(minimumRole: Role) {
  const currentUser = await getCurrentUser()
  const userRank = ROLE_RANK[currentUser.role as Role] ?? 0
  const requiredRank = ROLE_RANK[minimumRole]

  if (userRank < requiredRank) {
    throw new Error(`Forbidden: requires ${minimumRole} role or higher`)
  }
  return currentUser
}


export type ActionResult<T> = | { success: true; data: T } | { success: false; error: string }

export async function withRole<T>(
  minimumRole: Role,
  fn: (currentUser: Awaited<ReturnType<typeof getCurrentUser>>) => Promise<T>
): Promise<ActionResult<T>>{
  
  try{
    const currentUser = await requireRole(minimumRole)
    const data = await fn(currentUser)
    return { success: true, data}
  } catch (error: any) {
    if (error?.message. startsWith ('Forbidden')){
      return { success: false, error: 'To make this change you need admin privileges.'}
    }
    return { success: false, error: 'Something went wrong. Please try again.'}
  }
}