'use server'

import { getCurrentUser, type Role } from '@/lib/auth-helpers'


export async function getMyRole(): Promise<Role | null> {
  try {
    const currentUser = await getCurrentUser()
    return currentUser.role as Role
  } catch {
    return null
  }
}