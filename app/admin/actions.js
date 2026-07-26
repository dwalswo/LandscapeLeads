'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}

export async function updateLeadStatus(formData) {
  const leadId = formData.get('lead_id')?.toString()
  const status = formData.get('status')?.toString()

  if (!leadId || !status) return

  const supabase = await createClient()
  await supabase.from('leads').update({ status }).eq('id', leadId)

  revalidatePath('/admin')
}
