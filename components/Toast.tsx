'use client'

import { useEffect } from 'react'

interface ToastProps {
    message: string
    type: 'success' | 'error'
    onDismiss: () => void
}

export default function Toast({ message, type, onDismiss }: ToastProps) {
    useEffect(() => {
        const t = setTimeout(onDismiss, 3500)
        return () => clearTimeout(t)
    }, [onDismiss])

    return (
        <div
            onClick={onDismiss}
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border cursor-pointer
                transition-all animate-in fade-in slide-in-from-top-2 duration-300
                ${type === 'success'
                    ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                    : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
                }`}
        >
            <span className="text-xl">{type === 'success' ? '✅' : '❌'}</span>
            <p className="font-semibold text-sm">{message}</p>
        </div>
    )
}
