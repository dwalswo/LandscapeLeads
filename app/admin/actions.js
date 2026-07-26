'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { setImpersonation } from '@/lib/impersonation'

export async function startImpersonation(formData) {
  const targetId = formData.get('target_id')?.toString()
  const role = formData.get('role')?.toString()

  if (!targetId || (role !== 'client' && role !== 'landscaper')) return

  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()

  if (!claims?.claims) {
    redirect('/admin/login')
  }

  const { data: isAdmin } = await supabase.rpc('is_admin')

  if (!isAdmin) {
    redirect('/admin/login')
  }

  await setImpersonation(targetId, role)
  redirect(role === 'client' ? '/account' : '/landscaper')
}

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

export async function updateRequestStatus(formData) {
  const requestId = formData.get('request_id')?.toString()
  const status = formData.get('status')?.toString()

  if (!requestId || !status) return

  const supabase = await createClient()
  await supabase
    .from('service_requests')
    .update({ status })
    .eq('id', requestId)

  revalidatePath('/admin')
}
