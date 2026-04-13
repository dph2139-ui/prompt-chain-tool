'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

export default function StepList({ flavorId, initialSteps, userId }: { flavorId: string, initialSteps: { id: string, order_by: number, llm_user_prompt?: string, llm_system_prompt?: string, [key: string]: unknown }[], userId: string }) {
    const [steps] = useState(initialSteps)
    const [newPrompt, setNewPrompt] = useState('')
    const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const router = useRouter()

    const addStep = async () => {
        const { error } = await supabase.from('humor_flavor_steps').insert({
            humor_flavor_id: flavorId,
            llm_user_prompt: newPrompt,
            llm_system_prompt: "",
            order_by: steps.length + 1,
            created_by_user_id: userId,
            modified_by_user_id: userId,
            llm_input_type_id: 1,
            llm_output_type_id: 1,
            llm_model_id: 1,
            humor_flavor_step_type_id: 1
        })
        if (!error) { 
            setNewPrompt(''); 
            router.refresh(); 
            window.location.reload(); 
        } else {
            console.error(error);
            alert("Error adding step: " + error.message);
        }
    }

    const deleteStep = async (id: string) => {
        await supabase.from('humor_flavor_steps').delete().eq('id', id)
        window.location.reload()
    }

    const moveStep = async (index: number, direction: 'up' | 'down') => {
        const newSteps = [...steps]
        const targetIndex = direction === 'up' ? index - 1 : index + 1
        if (targetIndex < 0 || targetIndex >= steps.length) return

        // Swap order_by values
        const currentStep = newSteps[index]
        const targetStep = newSteps[targetIndex]

        await supabase.from('humor_flavor_steps').update({ order_by: targetStep.order_by }).eq('id', currentStep.id)
        await supabase.from('humor_flavor_steps').update({ order_by: currentStep.order_by }).eq('id', targetStep.id)

        window.location.reload()
    }

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                {steps.map((step: { id: string, order_by: number, llm_user_prompt?: string, llm_system_prompt?: string, [key: string]: unknown }, index: number) => (
                    <div key={step.id} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <span className="font-black text-blue-600">#{step.order_by}</span>
                            <p className="font-medium">{step.llm_user_prompt || step.llm_system_prompt}</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => moveStep(index, 'up')} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded">⬆️</button>
                            <button onClick={() => moveStep(index, 'down')} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded">⬇️</button>
                            <button onClick={() => deleteStep(step.id)} className="p-2 text-red-500 hover:bg-red-50 rounded">🗑️</button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                <label className="block text-xs font-black uppercase mb-2">Add Next Step</label>
                <div className="flex gap-2">
                    <input
                        value={newPrompt}
                        onChange={(e) => setNewPrompt(e.target.value)}
                        className="flex-1 p-3 rounded-lg border dark:bg-slate-900 text-black dark:text-white"
                        placeholder="e.g. Write a sarcastic 5-word caption..."
                    />
                    <button onClick={addStep} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">Add</button>
                </div>
            </div>
        </div>
    )
}