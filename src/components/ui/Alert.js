'use client'

import { AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react'

export default function Alert({ type = 'info', message, className = '' }) {
  const styles = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: CheckCircle
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: XCircle
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: AlertCircle
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: Info
    }
  }

  const style = styles[type]
  const Icon = style.icon

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${style.bg} ${style.border} ${className}`}>
      <Icon className={`w-5 h-5 mt-0.5 ${style.text}`} />
      <p className={`text-sm ${style.text}`}>{message}</p>
    </div>
  )
}
