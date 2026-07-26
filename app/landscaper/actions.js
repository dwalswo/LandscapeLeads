'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { geocodeAddress } from '@/lib/geocode'
import { haversineMiles } from '@/lib/distance'
import { computeLeadPrice } from '@/lib/pricing'
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
    redirect('/landscaper/signup?error=missing_fields')
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error) {
    redirect('/landscaper/signup?error=signup_failed')
  }

  if (!data.session) {
    redirect('/landscaper/signup?message=check_email')
  }

  redirect('/landscaper/complete-profile')
}

export async function login(formData) {
  const email = formData.get('email')?.toString().trim()
  const password = formData.get('password')?.toString()

  if (!email || !password) {
    redirect('/landscaper/login?error=missing_fields')
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect('/landscaper/login?error=invalid_credentials')
  }

  const { data: claims } = await supabase.auth.getClaims()
  const { data: profile } = await supabase
    .from('landscapers')
    .select('id')
    .eq('id', claims?.claims?.sub)
    .maybeSingle()

  redirect(profile ? '/landscaper' : '/landscaper/complete-profile')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/landscaper/login')
}

export async function saveProfile(formData) {
  const businessName = formData.get('business_name')?.toString().trim()
  const contactName = formData.get('contact_name')?.toString().trim()
  const phone = formData.get('phone')?.toString().trim()
  const email = formData.get('email')?.toString().trim()
  const address = formData.get('address')?.toString().trim()
  const serviceRadius = Number(formData.get('service_radius_miles')) || 10
  const contactHours = formData.get('contact_hours')?.toString().trim()
  const services = formData
    .getAll('services')
    .map((s) => s.toString())
    .join(', ')

  if (
    !businessName ||
    !contactName ||
    !phone ||
    !email ||
    !address ||
    !contactHours ||
    !services
  ) {
    redirect('/landscaper/complete-profile?error=missing_fields')
  }

  const supabase = await createClient()
  const { userId, isImpersonating } = await resolveActingUser(supabase, 'landscaper')

  if (!userId) {
    redirect('/landscaper/login')
  }

  if (isImpersonating && !canWriteWhileImpersonating()) {
    redirect('/landscaper/complete-profile?error=impersonation_read_only')
  }

  const { data: existing } = await supabase
    .from('landscapers')
    .select('address, address_updated_at')
    .eq('id', userId)
    .maybeSingle()

  const addressChanged = existing != null && existing.address !== address

  if (addressChanged) {
    const daysSinceAddressUpdate =
      (Date.now() - new Date(existing.address_updated_at).getTime()) / (1000 * 60 * 60 * 24)

    if (daysSinceAddressUpdate < 7) {
      redirect('/landscaper/complete-profile?error=address_rate_limited')
    }
  }

  const { lat, lng } = await geocodeAddress(address)

  const { error } = await supabase.from('landscapers').upsert({
    id: userId,
    business_name: businessName,
    contact_name: contactName,
    phone,
    email,
    address,
    service_radius_miles: serviceRadius,
    contact_hours: contactHours,
    services,
    lat,
    lng,
    ...((existing == null || addressChanged) && {
      address_updated_at: new Date().toISOString(),
    }),
  })

  if (error) {
    redirect('/landscaper/complete-profile?error=server_error')
  }

  revalidatePath('/landscaper')
  redirect('/landscaper')
}

export async function buyLead(formData) {
  const sourceType = formData.get('source_type')?.toString()
  const sourceId = formData.get('source_id')?.toString()

  if (
    (sourceType !== 'lead' && sourceType !== 'client_profile') ||
    !sourceId
  ) {
    redirect('/landscaper?error=invalid_lead')
  }

  const supabase = await createClient()
  const { userId, isImpersonating } = await resolveActingUser(supabase, 'landscaper')

  if (!userId) {
    redirect('/landscaper/login')
  }

  if (isImpersonating && !canWriteWhileImpersonating()) {
    redirect('/landscaper?error=impersonation_read_only')
  }

  const { data: landscaper } = await supabase
    .from('landscapers')
    .select('lat, lng, service_radius_miles')
    .eq('id', userId)
    .maybeSingle()

  if (!landscaper) {
    redirect('/landscaper/complete-profile')
  }

  const { data: source } = await supabase
    .from(sourceType === 'lead' ? 'leads' : 'client_profiles')
    .select('id, lat, lng')
    .eq('id', sourceId)
    .maybeSingle()

  if (!source) {
    redirect('/landscaper?error=lead_not_found')
  }

  // Distance and price are computed server-side from data just read from the
  // database, never trusted from the submitted form, so a client can't spoof
  // a lower price.
  const distance = haversineMiles(
    landscaper.lat,
    landscaper.lng,
    source.lat,
    source.lng
  )

  const outOfRange = distance == null || distance > landscaper.service_radius_miles

  if (outOfRange) {
    // Clients who requested this landscaper directly can still be bought
    // even if they fall outside the browse radius; only block out-of-range
    // purchases surfaced through the "Clients Near You" browse list.
    const hasDirectRequest =
      sourceType === 'client_profile' &&
      (await supabase
        .from('service_requests')
        .select('id')
        .eq('landscaper_id', userId)
        .eq('client_id', sourceId)
        .maybeSingle()
      ).data != null

    if (!hasDirectRequest) {
      redirect('/landscaper?error=out_of_range')
    }
  }

  const price = computeLeadPrice(distance)

  const { error } = await supabase.from('lead_purchases').insert({
    landscaper_id: userId,
    lead_id: sourceType === 'lead' ? sourceId : null,
    client_id: sourceType === 'client_profile' ? sourceId : null,
    price,
  })

  if (error) {
    redirect(
      error.code === '23505'
        ? '/landscaper?error=already_purchased'
        : '/landscaper?error=purchase_failed'
    )
  }

  revalidatePath('/landscaper')
  redirect('/landscaper?bought=1')
}

export async function updateRequestStatus(formData) {
  const requestId = formData.get('request_id')?.toString()
  const status = formData.get('status')?.toString()

  if (!requestId || !status) return

  const supabase = await createClient()
  const { userId, isImpersonating } = await resolveActingUser(supabase, 'landscaper')

  if (!userId) {
    redirect('/landscaper/login')
  }

  if (isImpersonating && !canWriteWhileImpersonating()) {
    redirect('/landscaper?error=impersonation_read_only')
  }

  await supabase
    .from('service_requests')
    .update({ status })
    .eq('id', requestId)
    .eq('landscaper_id', userId)

  revalidatePath('/landscaper')
}
