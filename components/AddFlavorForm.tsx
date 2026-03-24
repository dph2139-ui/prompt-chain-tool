'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

export default function AddFlavorForm({ userId }: { userId: string }) {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const { error } = await supabase
            .from('humor_flavors')
            .insert({
                name,
                description,
                created_by_user_id: userId,
                modified_by_user_id: userId
            })

        setLoading(false)
        if (error) {
            alert("Error: " + error.message)
        } else {
            setName('')
            setDescription('')
            router.refresh()
            alert("Humor Flavor successfully created!")
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Flavor Name</label>
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="e.g. Grumpy Cat Vibes"
                    required
                />
            </div>
            <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Short Description</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="How should the AI behave?"
                    rows={3}
                />
            </div>
            <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-lg shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all"
            >
                {loading ? 'Processing...' : '💾 Save Flavor'}
            </button>
        </form>
    )
}