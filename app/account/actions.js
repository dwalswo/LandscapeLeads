'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { geocodeAddress } from '@/lib/geocode'
import { notifyLandscaperOfRequest } from '@/lib/notify'
import { toE164 } from '@/lib/phone'
import {
  resolveActingUser,
  canWriteWhileImpersonating,
  clearImpersonation,
} from '@/lib/impersonation'

export async function stopImpersonation() {
  await clearImpersonation()
  redirect('/admin')
}

export async function signup(formData) {
  const email = formData.get('email')?.toString().trim()
  const password = formData.get('password')?.toString()

  if (!email || !password) {
    redirect('/account/signup?error=missing_fields')
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error) {
    redirect('/account/signup?error=signup_failed')
  }

  if (!data.session) {
    redirect('/account/signup?message=check_email')
  }

  redirect('/account/complete-profile')
}

export async function login(formData) {
  const email = formData.get('email')?.toString().trim()
  const password = formData.get('password')?.toString()

  if (!email || !password) {
    redirect('/account/login?error=missing_fields')
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect('/account/login?error=invalid_credentials')
  }

  const { data: claims } = await supabase.auth.getClaims()
  const { data: profile } = await supabase
    .from('client_profiles')
    .select('id')
    .eq('id', claims?.claims?.sub)
    .maybeSingle()

  redirect(profile ? '/account' : '/account/complete-profile')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/account/login')
}

export async function completeProfile(formData) {
  const name = formData.get('name')?.toString().trim()
  const phone = formData.get('phone')?.toString().trim()
  const address = formData.get('address')?.toString().trim()

  if (!name || !phone || !address) {
    redirect('/account/complete-profile?error=missing_fields')
  }

  const supabase = await createClient()
  const { userId, isImpersonating } = await resolveActingUser(supabase, 'client')

  if (!userId) {
    redirect('/account/login')
  }

  if (isImpersonating && !canWriteWhileImpersonating()) {
    redirect('/account/complete-profile?error=impersonation_read_only')
  }

  const { lat, lng } = await geocodeAddress(address)

  const { error } = await supabase.from('client_profiles').upsert({
    id: userId,
    name,
    phone,
    address,
    lat,
    lng,
  })

  if (error) {
    redirect('/account/complete-profile?error=server_error')
  }

  redirect(isImpersonating ? '/account' : '/account/verify-phone')
}

export async function sendPhoneVerification() {
  const supabase = await createClient()
  const { userId, isImpersonating } = await resolveActingUser(supabase, 'client')

  if (!userId) {
    redirect('/account/login')
  }

  // Phone OTP verification operates on the real, currently authenticated
  // Supabase Auth session -- there's no way to send/verify an OTP "as" a
  // different user without actually signing in as them, which this feature
  // intentionally never does. Always blocked while impersonating, in every
  // environment, so it can't accidentally touch the admin's own phone.
  if (isImpersonating) {
    redirect('/account/verify-phone?error=impersonation_unsupported')
  }

  const { data: profile } = await supabase
    .from('client_profiles')
    .select('phone')
    .eq('id', userId)
    .maybeSingle()

  const e164 = toE164(profile?.phone)

  if (!e164) {
    redirect('/account/verify-phone?error=invalid_phone')
  }

  const { error } = await supabase.auth.updateUser({ phone: e164 })

  if (error) {
    redirect('/account/verify-phone?error=send_failed')
  }

  redirect('/account/verify-phone?step=code')
}

export async function verifyPhoneCode(formData) {
  const code = formData.get('code')?.toString().trim()

  if (!code) {
    redirect('/account/verify-phone?step=code&error=missing_code')
  }

  const supabase = await createClient()
  const { userId, isImpersonating } = await resolveActingUser(supabase, 'client')

  if (!userId) {
    redirect('/account/login')
  }

  if (isImpersonating) {
    redirect('/account/verify-phone?error=impersonation_unsupported')
  }

  const { data: profile } = await supabase
    .from('client_profiles')
    .select('phone')
    .eq('id', userId)
    .maybeSingle()

  const e164 = toE164(profile?.phone)

  const { error } = await supabase.auth.verifyOtp({
    phone: e164,
    token: code,
    type: 'phone_change',
  })

  if (error) {
    redirect('/account/verify-phone?step=code&error=invalid_code')
  }

  redirect('/account?verified=1')
}

export async function requestLandscaper(formData) {
  const landscaperId = formData.get('landscaper_id')?.toString()
  const service = formData.get('service')?.toString().trim()
  const message = formData.get('message')?.toString().trim() || null

  if (!landscaperId || !service) return

  const supabase = await createClient()
  const { userId, isImpersonating } = await resolveActingUser(supabase, 'client')

  if (!userId) {
    redirect('/account/login')
  }

  if (isImpersonating && !canWriteWhileImpersonating()) {
    revalidatePath('/account')
    redirect('/account?error=impersonation_read_only')
  }

  const { error } = await supabase.from('service_requests').insert({
    client_id: userId,
    landscaper_id: landscaperId,
    service,
    message,
  })

  if (!error) {
    const { data: landscaper } = await supabase
      .from('landscapers')
      .select('business_name, email')
      .eq('id', landscaperId)
      .maybeSingle()

    const { data: client } = await supabase
      .from('client_profiles')
      .select('name')
      .eq('id', userId)
      .maybeSingle()

    if (landscaper && client) {
      await notifyLandscaperOfRequest({
        landscaperEmail: landscaper.email,
        landscaperBusinessName: landscaper.business_name,
        clientName: client.name,
        service,
        message,
      })
    }
  }

  revalidatePath('/account')
}
