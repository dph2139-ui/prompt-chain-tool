import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link' // FIX 1
import StepList from '@/components/StepList'
import FlavorTester from '@/components/FlavorTester' // FIX 3

export default async function FlavorStepsPage({ params }: { params: { id: string } }) {
    const { id } = await params
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get(name) { return cookieStore.get(name)?.value } } }
    )

    const { data: flavor } = await supabase.from('humor_flavors').select('*').eq('id', id).single()
    if (!flavor) return notFound()

    const { data: steps } = await supabase
        .from('humor_flavor_steps')
        .select('*')
        .eq('flavor_id', id)
        .order('step_order', { ascending: true })

    const { data: { user } } = await supabase.auth.getUser()

    return (
        <main className="p-8 md:p-16 min-h-screen bg-slate-50 dark:bg-slate-900 dark:text-white">
            <div className="max-w-4xl mx-auto">
                {/* FIX 1: Changed <a> to <Link> */}
                <Link href="/" className="text-blue-600 hover:underline mb-8 inline-block">
                    ← Back to Flavors
                </Link>

                <header className="mb-10">
                    <h1 className="text-4xl font-black uppercase tracking-tighter">{flavor.slug}</h1>
                    <p className="text-slate-500 mt-2">{flavor.description}</p>
                </header>

                <section className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold mb-6">Prompt Chain Steps</h2>

                    <StepList
                        flavorId={id}
                        initialSteps={steps || []}
                        userId={user?.id || ''}
                    />

                    {/* FIX 2: Correct comment formatting */}
                    <div className="mt-12 pt-12 border-t border-slate-100 dark:border-slate-700">
                        <FlavorTester flavorId={id} steps={steps || []} />
                    </div>
                </section>
            </div>
        </main>
    )
}