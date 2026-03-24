import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AddFlavorForm from '@/components/AddFlavorForm'
import Link from 'next/link'

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

  // 1. Check if the user is even logged in
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 p-6 text-center">
          <h1 className="text-3xl font-black mb-4 dark:text-white uppercase tracking-tighter">Prompt Chain Tool</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-8">You must be logged in via the main app to access this tool.</p>
          <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg max-w-md">
            Tip: Log in at your main Project 1 URL first, then refresh this page.
          </div>
        </div>
    )
  }

  // 2. Check for Admin Privileges (Superadmin or Matrix Admin)
  const { data: profile } = await supabase
      .from('profiles')
      .select('is_superadmin, is_matrix_admin')
      .eq('id', user.id)
      .single()

  if (!profile?.is_superadmin && !profile?.is_matrix_admin) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-red-50 dark:bg-slate-900 p-10">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-red-200 text-center max-w-lg">
            <span className="text-5xl mb-4 block">🚫</span>
            <h1 className="text-2xl font-bold text-red-700 mb-2">Access Denied</h1>
            <p className="text-slate-600 dark:text-slate-300">
              This tool is restricted to <strong>Superadmins</strong> and <strong>Matrix Admins</strong> only.
            </p>
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
      <main className="p-8 md:p-16 min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors">
        <header className="mb-12 border-b border-slate-200 dark:border-slate-800 pb-8 flex justify-between items-end">
          <div>
            <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none mb-2">
              Prompt Chain <span className="text-blue-600">Tool</span>
            </h1>
            <p className="text-slate-500 font-medium">Admin: {user.email}</p>
          </div>
          <div className="text-xs font-mono bg-slate-200 dark:bg-slate-800 px-3 py-1 rounded">
            Assignment #8
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* --- LEFT COLUMN: ACTION --- */}
          <section className="space-y-10">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                <span className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">✨</span>
                Create New Flavor
              </h2>
              {/* We will build this component next */}
              <AddFlavorForm userId={user.id} />
            </div>
          </section>

          {/* --- RIGHT COLUMN: LIST --- */}
          <section>
            <h2 className="text-xl font-bold mb-8 flex items-center gap-3">
              <span className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">🗂️</span>
              Existing Humor Flavors
            </h2>

            <div className="space-y-4">
              {!flavors || flavors.length === 0 ? (
                  <div className="p-10 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-center text-slate-400">
                    No flavors found. Start by creating your first vibe.
                  </div>
              ) : (
                  flavors.map(f => (
                      <div key={f.id} className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center hover:shadow-md transition-all group">
                        <div>
                          <h3 className="font-bold text-xl group-hover:text-blue-600 transition-colors">{f.name}</h3>
                          <p className="text-slate-500 line-clamp-1">{f.description || 'No description provided'}</p>
                        </div>
                        <Link
                            href={`/flavor/${f.id}`}
                            className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-5 py-2 rounded-full font-bold text-sm hover:scale-105 active:scale-95 transition-all"
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