import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AddFlavorForm from '@/components/AddFlavorForm'
import DuplicateFlavorButton from '@/components/DuplicateFlavorButton'

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

    // 1. Get the current user
    const { data: { user } } = await supabase.auth.getUser()

    // --- VIEW FOR LOGGED OUT USERS ---
    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 p-6 text-center">
                <div className="mb-8">
                    <span className="text-5xl">🧪</span>
                </div>
                <h1 className="text-4xl font-black mb-3 dark:text-white uppercase tracking-tighter italic">Prompt Chain Tool</h1>
                <p className="text-slate-500 dark:text-slate-400 mb-2 max-w-sm text-sm">
                    Admin tool for managing humor flavors and prompt chains.
                </p>
                <p className="text-slate-400 dark:text-slate-500 mb-10 max-w-sm text-xs">
                    Sign in with your authorized Google admin account to continue.
                </p>

                <form action={async () => {
                    'use server'
                    const cookieStore = await cookies()
                    const supabase = createServerClient(
                        process.env.NEXT_PUBLIC_SUPABASE_URL!,
                        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                        {
                            cookies: {
                                get(name) { return cookieStore.get(name)?.value },
                                set(name, value, options) { cookieStore.set(name, value, options) },
                                remove(name, options) { cookieStore.set(name, '', options) }
                            }
                        }
                    )

                    const baseUrl = process.env.VERCEL_URL
                        ? `https://${process.env.VERCEL_URL}`
                        : 'http://localhost:3000'

                    const { data } = await supabase.auth.signInWithOAuth({
                        provider: 'google',
                        options: { redirectTo: `${baseUrl}/auth/callback` }
                    })
                    if (data.url) redirect(data.url)
                }}>
                    <button type="submit" className="bg-blue-600 text-white px-10 py-4 rounded-full font-black shadow-xl hover:bg-blue-700 hover:scale-105 transition-all text-lg">
                        Sign In with Google →
                    </button>
                </form>
            </div>
        )
    }

    // --- VIEW FOR UNAUTHORIZED USERS (NON-ADMINS) ---
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_superadmin, is_matrix_admin')
        .eq('id', user.id)
        .single()

    if (!profile?.is_superadmin && !profile?.is_matrix_admin) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 p-10">
                <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 text-center max-w-lg">
                    <span className="text-5xl mb-6 block">🔒</span>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-3 uppercase italic">Admin Access Required</h1>
                    <p className="text-slate-500 dark:text-slate-400 mb-2 text-sm">
                        <strong className="text-slate-700 dark:text-slate-300">{user.email}</strong> is not authorized for this tool.
                    </p>
                    <p className="text-slate-400 dark:text-slate-500 mb-8 text-xs">
                        Please sign in with your admin Google account to continue.
                    </p>
                    <form action={async () => {
                        'use server'
                        const cookieStore = await cookies()
                        const supabase = createServerClient(
                            process.env.NEXT_PUBLIC_SUPABASE_URL!,
                            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                            { cookies: { get(name) { return cookieStore.get(name)?.value }, set(name, value, options) { cookieStore.set(name, value, options) }, remove(name, options) { cookieStore.set(name, '', options) } } }
                        )
                        await supabase.auth.signOut()
                        redirect('/')
                    }}>
                        <button className="bg-blue-600 text-white px-8 py-3 rounded-full font-black hover:bg-blue-700 transition-all shadow-lg">
                            Sign Out & Use Another Account
                        </button>
                    </form>
                </div>
            </div>
        )
    }

    // --- VIEW FOR AUTHORIZED ADMINS ---
    const { data: flavors } = await supabase
        .from('humor_flavors')
        .select('*')
        .order('created_datetime_utc', { ascending: false })

    return (
        <main className="p-8 md:p-16 min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors">
            <header className="mb-12 border-b border-slate-200 dark:border-slate-800 pb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none mb-2">
                        Prompt Chain <span className="text-blue-600">Tool</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-sm">ADMIN: {user.email}</p>
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
                            <div className="p-10 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-center text-slate-400 italic">
                                No flavors found. Add your first humor style to begin.
                            </div>
                        ) : (
                            flavors.map(f => (
                                <div key={f.id} className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex justify-between items-center hover:shadow-xl transition-all group">
                                    <div>
                                        <h3 className="font-bold text-xl group-hover:text-blue-600 transition-colors">{f.slug}</h3>
                                        <p className="text-slate-500 line-clamp-1 italic text-sm">{f.description || 'No description'}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <DuplicateFlavorButton flavorId={f.id} flavorSlug={f.slug} userId={user.id} />
                                        <Link
                                            href={`/flavor/${f.id}`}
                                            className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
                                        >
                                            Edit Steps →
                                        </Link>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </main>
    )
}