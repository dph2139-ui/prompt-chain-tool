'use client'

import { useState, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'

interface Step {
    llm_user_prompt?: string;
    llm_system_prompt?: string;
    [key: string]: unknown;
}

export default function FlavorTester({ steps }: { flavorId?: string, steps: Step[] }) {
    const [status, setStatus] = useState('')
    const [result, setResult] = useState<string | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const reset = () => {
        setStatus('')
        setResult(null)
        setImagePreview(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const runTest = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || steps.length === 0) return

        setLoading(true)
        setStatus('Uploading image...')
        setResult(null)
        setImagePreview(URL.createObjectURL(file))

        try {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token
            const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }

            // 1. Get Presigned URL
            const res1 = await fetch('https://api.almostcrackd.ai/pipeline/generate-presigned-url', {
                method: 'POST', headers, body: JSON.stringify({ contentType: file.type })
            })
            if (!res1.ok) throw new Error(await res1.text())
            const presignedResponse = await res1.json()
            const { presignedUrl, cdnUrl } = presignedResponse

            if (!cdnUrl) throw new Error('Failed to get cdnUrl from generate-presigned-url')

            // 2. Upload to S3 (Crucial: Content-Type must be explicitly set to match presigned URL)
            const uploadRes = await fetch(presignedUrl, {
                method: "PUT",
                body: file,
                headers: { 'Content-Type': file.type }
            })
            if (!uploadRes.ok) throw new Error(`S3 upload failed: ${uploadRes.statusText}`)

            // 3. Register image in backend database to get the real imageId
            setStatus('Registering image...')
            const registerRes = await fetch('https://api.almostcrackd.ai/pipeline/upload-image-from-url', {
                method: 'POST',
                headers,
                body: JSON.stringify({ imageUrl: cdnUrl, isCommonUse: false })
            })
            if (!registerRes.ok) throw new Error(`Image registration failed: ${await registerRes.text()}`)
            const { imageId: registeredImageId } = await registerRes.json()
            if (!registeredImageId) throw new Error('Image registration did not return an imageId')

            // 4. Start the Chain with the first Step (Image -> Text)
            setStatus('Step 1: Analyzing Image...')
            const res3 = await fetch('https://api.almostcrackd.ai/pipeline/generate-captions', {
                method: 'POST',
                headers,
                body: JSON.stringify({ imageId: registeredImageId, prompt: steps[0].llm_user_prompt || steps[0].llm_system_prompt })
            })
            if (!res3.ok) throw new Error(await res3.text())
            let currentOutput = await res3.json()

            // 5. Run the rest of the steps in order
            for (let i = 1; i < steps.length; i++) {
                setStatus(`Running Step ${i + 1}...`)
                const resStep: Response = await fetch('https://api.almostcrackd.ai/pipeline/generate-captions', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        imageId: registeredImageId,
                        inputContext: currentOutput,
                        prompt: steps[i].llm_user_prompt || steps[i].llm_system_prompt
                    })
                })
                if (!resStep.ok) throw new Error(await resStep.text())
                currentOutput = await resStep.json()
            }

            const finalResult = Array.isArray(currentOutput)
                ? currentOutput.map((item: any) => (typeof item === 'string' ? item : item?.content ?? JSON.stringify(item))).join('\n\n')
                : typeof currentOutput === 'string'
                    ? currentOutput
                    : (currentOutput as any)?.content ?? JSON.stringify(currentOutput, null, 2)

            setResult(finalResult)
            setStatus('Complete!')
        } catch (err) {
            console.error(err)
            setStatus(`Error: ${err instanceof Error ? err.message : String(err)}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="mt-10 p-6 bg-blue-50 dark:bg-slate-900 rounded-xl border-2 border-blue-200 dark:border-blue-900 text-slate-900 dark:text-slate-100">
            <h3 className="text-xl font-black mb-4 uppercase tracking-tight">Test this Flavor</h3>

            {!result && !loading && (
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={runTest}
                    disabled={loading}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                />
            )}

            {status && (
                <p className={`mt-4 font-mono text-sm ${result ? 'text-green-600 dark:text-green-400' : 'text-blue-600 animate-pulse'}`}>
                    {status}
                </p>
            )}

            {result && imagePreview && (
                <div className="mt-6 flex flex-col items-center gap-4">
                    <img
                        src={imagePreview}
                        alt="Uploaded"
                        className="max-h-72 rounded-lg border border-blue-200 dark:border-blue-800 object-contain shadow"
                    />
                    <div className="w-full p-4 bg-white dark:bg-slate-800 rounded-xl border border-blue-200 text-center">
                        <p className="text-lg font-semibold leading-snug whitespace-pre-wrap">{result}</p>
                    </div>
                    <button
                        onClick={reset}
                        className="mt-2 px-5 py-2 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
                    >
                        Test another image
                    </button>
                </div>
            )}
        </div>
    )
}
