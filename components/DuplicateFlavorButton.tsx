'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Toast from '@/components/Toast'

interface Props {
    flavorId: string
    flavorSlug: string
    userId: string
}

export default function DuplicateFlavorButton({ flavorId, flavorSlug, userId }: Props) {
    const [confirming, setConfirming] = useState(false)
    const [newName, setNewName] = useState('')
    const [loading, setLoading] = useState(false)
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
    const router = useRouter()

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const open = () => {
        setNewName(`${flavorSlug} (Copy)`)
        setConfirming(true)
    }

    const cancel = () => {
        setConfirming(false)
        setNewName('')
    }

    const duplicate = async () => {
        const trimmed = newName.trim()
        if (!trimmed) return

        setLoading(true)

        // 1. Create the new flavor
        const { data: newFlavor, error: flavorError } = await supabase
            .from('humor_flavors')
            .insert({ slug: trimmed, description: '', created_by_user_id: userId, modified_by_user_id: userId })
            .select('id')
            .single()

        if (flavorError || !newFlavor) {
            setToast({ message: 'Error duplicating flavor: ' + flavorError?.message, type: 'error' })
            setLoading(false)
            return
        }

        // 2. Copy all steps from the original
        const { data: steps } = await supabase
            .from('humor_flavor_steps')
            .select('*')
            .eq('humor_flavor_id', flavorId)
            .order('order_by', { ascending: true })

        if (steps && steps.length > 0) {
            const copiedSteps = steps.map(({ id, created_datetime_utc, modified_datetime_utc, ...step }: any) => ({
                ...step,
                humor_flavor_id: newFlavor.id,
                created_by_user_id: userId,
                modified_by_user_id: userId,
            }))

            const { error: stepsError } = await supabase.from('humor_flavor_steps').insert(copiedSteps)
            if (stepsError) {
                setToast({ message: 'Flavor created but steps failed to copy: ' + stepsError.message, type: 'error' })
                setLoading(false)
                setConfirming(false)
                return
            }
        }

        setLoading(false)
        setConfirming(false)
        setNewName('')
        setToast({ message: `"${trimmed}" created successfully!`, type: 'success' })
        router.refresh()
    }

    return (
        <>
            {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

            {!confirming ? (
                <button
                    onClick={open}
                    className="px-4 py-2 rounded-full border border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                >
                    Duplicate
                </button>
            ) : (
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <input
                        autoFocus
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') duplicate(); if (e.key === 'Escape') cancel() }}
                        className="px-3 py-1.5 text-xs rounded-lg border border-blue-400 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none w-48"
                        placeholder="New flavor name"
                    />
                    <button
                        onClick={duplicate}
                        disabled={loading || !newName.trim()}
                        className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all"
                    >
                        {loading ? '...' : 'Save'}
                    </button>
                    <button
                        onClick={cancel}
                        className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    >
                        ✕
                    </button>
                </div>
            )}
        </>
    )
}
