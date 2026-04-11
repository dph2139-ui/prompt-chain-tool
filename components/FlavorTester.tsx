'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function FlavorTester({ flavorId, steps }: { flavorId: string, steps: any[] }) {
    const [status, setStatus] = useState('')
    const [result, setResult] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const runTest = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || steps.length === 0) return

        setLoading(true)
        setStatus('Uploading image...')

        try {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token
            const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }

            // 1. Get Presigned URL
            const res1 = await fetch('https://api.almostcrackd.ai/pipeline/generate-presigned-url', {
                method: 'POST', headers, body: JSON.stringify({ contentType: file.type })
            })
            const { presignedUrl, cdnUrl } = await res1.json()

            // 2. Upload to S3
            await fetch(presignedUrl, { method: "PUT", body: file })

            // 3. Start the Chain with the first Step (Image -> Text)
            setStatus('Step 1: Analyzing Image...')
            const res3 = await fetch('https://api.almostcrackd.ai/pipeline/generate-captions', {
                method: 'POST',
                headers,
                body: JSON.stringify({ imageUrl: cdnUrl, prompt: steps[0].llm_user_prompt || steps[0].llm_system_prompt })
            })
            let currentOutput = await res3.json()

            // 4. Run the rest of the steps in order
            for (let i = 1; i < steps.length; i++) {
                setStatus(`Running Step ${i + 1}...`)
                const resStep = await fetch('https://api.almostcrackd.ai/pipeline/refine-caption', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        inputContext: currentOutput,
                        instruction: steps[i].llm_user_prompt || steps[i].llm_system_prompt
                    })
                })
                currentOutput = await resStep.json()
            }

            setResult(currentOutput)
            setStatus('Complete!')
        } catch (err) {
            console.error(err)
            setStatus('Error occurred during test.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="mt-10 p-6 bg-blue-50 dark:bg-slate-900 rounded-xl border-2 border-blue-200 dark:border-blue-900">
            <h3 className="text-xl font-black mb-4 uppercase tracking-tight">Test this Flavor</h3>
            <input
                type="file"
                onChange={runTest}
                disabled={loading}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
            />

            {status && <p className="mt-4 font-mono text-sm text-blue-600 animate-pulse">{status}</p>}

            {result && (
                <div className="mt-6 p-4 bg-white dark:bg-slate-800 rounded border border-blue-200 overflow-auto">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">Final Output:</p>
                    <pre className="text-sm font-mono whitespace-pre-wrap">
                        {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    )
}