import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AddFlavorForm from '@/components/AddFlavorForm'

export default async function PromptChainTool() {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
            },
        }
    )

    // 1. Check if the user is logged in
    const { data: { user } } = await supabase.auth.getUser()

    // --- LOGIN VIEW ---
    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 p-6 text-center">
                <h1 className="text-3xl font-black mb-4 dark:text-white uppercase tracking-tighter italic">Prompt Chain Tool</h1>
                <p className="text-slate-600 dark:text-slate-400 mb-8">Authentication required to access admin tools.</p>

                <form action={async () => {
                    'use server'
                    const cookieStore = await cookies()
                    const supabase = createServerClient(
                        process.env.NEXT_PUBLIC_SUPABASE_URL!,
                        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                        { cookies: { get(name) { return cookieStore.get(name)?.value }, set(name, value, options) { cookieStore.set(name, value, options) }, remove(name, options) { cookieStore.set(name, '', options) } } }
                    )
                    const { data } = await supabase.auth.signInWithOAuth({
                        provider: 'google',
                        options: { redirectTo: `https://${process.env.VERCEL_URL || 'localhost:3000'}/auth/callback` }
                    })
                    if (data.url) redirect(data.url)
                }}>
                    <button type="submit" className="bg-white text-black px-10 py-4 rounded-full font-black shadow-xl hover:scale-105 transition-all border border-slate-200">
                        Log In with Google
                    </button>
                </form>
            </div>
        )
    }

    // 2. Check for Admin Privileges
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_superadmin, is_matrix_admin')
        .eq('id', user.id)
        .single()

    if (!profile?.is_superadmin && !profile?.is_matrix_admin) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-red-50 dark:bg-slate-950 p-10">
                <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl shadow-2xl border border-red-200 dark:border-red-900 text-center max-w-lg">
                    <span className="text-6xl mb-6 block">🚫</span>
                    <h1 className="text-2xl font-black text-red-700 dark:text-red-500 mb-3 uppercase italic">Access Denied</h1>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                        Your account (<strong>{user.email}</strong>) does not have the required <strong>Admin</strong> permissions for this tool.
                    </p>
                    <Link href="/" className="mt-8 inline-block text-blue-600 font-bold underline">Try Refreshing</Link>
                </div>
            </div>
        )
    }

    // 3. Fetch existing Humor Flavors
    const { data: flavors } = await supabase
        .from('humor_flavors')
        .select('*')
        .order('created_datetime_utc', { ascending: false })

    return (
        <main className="p-8 md:p-16 min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
            <header className="mb-12 border-b border-slate-200 dark:border-slate-800 pb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none mb-2">
                        Prompt Chain <span className="text-blue-600">Tool</span>
                    </h1>
                    <p className="text-slate-500 font-medium font-mono text-sm uppercase">Admin Active: {user.email}</p>
                </div>
                <div className="text-xs font-bold bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 px-4 py-2 rounded-full uppercase tracking-widest">
                    Assignment #8
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                <section className="space-y-10">
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-3 italic">
                            <span className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">✨</span>
                            Create New Flavor
                        </h2>
                        <AddFlavorForm userId={user.id} />
                    </div>
                </section>

                <section>
                    <h2 className="text-xl font-bold mb-8 flex items-center gap-3 italic">
                        <span className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">🗂️</span>
                        Existing Humor Flavors
                    </h2>

                    <div className="space-y-4">
                        {!flavors || flavors.length === 0 ? (
                            <div className="p-10 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-center text-slate-400">
                                No flavors found. Start by creating your first vibe.
                            </div>
                        ) : (
                            flavors.map(f => (
                                <div key={f.id} className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex justify-between items-center hover:shadow-xl transition-all group">
                                    <div>
                                        <h3 className="font-bold text-xl group-hover:text-blue-600 transition-colors">{f.name}</h3>
                                        <p className="text-slate-500 line-clamp-1 italic">{f.description || 'No description provided'}</p>
                                    </div>
                                    <Link
                                        href={`/flavor/${f.id}`}
                                        className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
                                    >
                                        Edit Steps →
                                    </Link>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </main>
    )
}