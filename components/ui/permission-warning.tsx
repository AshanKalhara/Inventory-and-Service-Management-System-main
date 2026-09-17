import { AlertTriangle } from 'lucide-react'

export function PermissionWarning({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-600 flex items-start gap-2">
      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  )
}