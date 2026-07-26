'use server'

import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { geocodeAddress } from '@/lib/geocode'
import { SERVICES, BUDGET_RANGES, TIMELINES } from '@/app/lib/services'

export async function submitLead(formData) {
  const name = formData.get('name')?.toString().trim()
  const phone = formData.get('phone')?.toString().trim()
  const email = formData.get('email')?.toString().trim()
  const address = formData.get('address')?.toString().trim()
  const service = formData.get('service')?.toString().trim()
  const budgetRange = formData.get('budget_range')?.toString().trim()
  const timeline = formData.get('timeline')?.toString().trim()
  const notes = formData.get('notes')?.toString().trim() || null

  if (
    !name ||
    !phone ||
    !email ||
    !address ||
    !service ||
    !SERVICES.includes(service) ||
    !budgetRange ||
    !BUDGET_RANGES.includes(budgetRange) ||
    !timeline ||
    !TIMELINES.includes(timeline)
  ) {
    redirect('/?error=missing_fields#quote-form')
  }

  const { lat, lng } = await geocodeAddress(address)

  const { error } = await supabase.from('leads').insert({
    name,
    phone,
    email,
    address,
    service,
    budget_range: budgetRange,
    timeline,
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
    redirect('/landscapers?error=missing_fields#signup-form')
  }

  const { lat, lng } = await geocodeAddress(address)

  const { error } = await supabase.from('landscapers').insert({
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
  })

  if (error) {
    redirect('/landscapers?error=server_error#signup-form')
  }

  redirect('/landscapers/thank-you')
}
