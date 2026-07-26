'use server'

import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { geocodeZip } from '@/lib/geocode'

export async function submitLead(formData) {
  const name = formData.get('name')?.toString().trim()
  const phone = formData.get('phone')?.toString().trim()
  const zip = formData.get('zip')?.toString().trim()
  const service = formData.get('service')?.toString().trim()
  const notes = formData.get('notes')?.toString().trim() || null

  if (!name || !phone || !zip || !service) {
    redirect('/?error=missing_fields#quote-form')
  }

  const { lat, lng } = geocodeZip(zip)

  const { error } = await supabase.from('leads').insert({
    name,
    phone,
    zip,
    service,
    notes,
    lat,
    lng,
  })

  if (error) {
    redirect('/?error=server_error#quote-form')
  }

  redirect('/thank-you')
}

export async function submitLandscaper(formData) {
  const businessName = formData.get('business_name')?.toString().trim()
  const contactName = formData.get('contact_name')?.toString().trim()
  const phone = formData.get('phone')?.toString().trim()
  const email = formData.get('email')?.toString().trim() || null
  const zip = formData.get('zip')?.toString().trim()
  const serviceRadius = Number(formData.get('service_radius_miles')) || 10
  const services = formData
    .getAll('services')
    .map((s) => s.toString())
    .join(', ')

  if (!businessName || !contactName || !phone || !zip || !services) {
    redirect('/landscapers?error=missing_fields#signup-form')
  }

  const { lat, lng } = geocodeZip(zip)

  const { error } = await supabase.from('landscapers').insert({
    business_name: businessName,
    contact_name: contactName,
    phone,
    email,
    zip,
    service_radius_miles: serviceRadius,
    services,
    lat,
    lng,
  })

  if (error) {
    redirect('/landscapers?error=server_error#signup-form')
  }

  redirect('/landscapers/thank-you')
}
