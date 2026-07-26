import { cookies } from 'next/headers'

const ID_COOKIE = 'impersonate_id'
const ROLE_COOKIE = 'impersonate_role'

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
}

export async function getImpersonation() {
  const cookieStore = await cookies()
  const id = cookieStore.get(ID_COOKIE)?.value
  const role = cookieStore.get(ROLE_COOKIE)?.value

  if (!id || (role !== 'client' && role !== 'landscaper')) {
    return null
  }

  return { id, role }
}

export async function setImpersonation(id, role) {
  const cookieStore = await cookies()
  cookieStore.set(ID_COOKIE, id, cookieOptions)
  cookieStore.set(ROLE_COOKIE, role, cookieOptions)
}

export async function clearImpersonation() {
  const cookieStore = await cookies()
  cookieStore.delete(ID_COOKIE)
  cookieStore.delete(ROLE_COOKIE)
}

// Resolves which user id a page/action should act as. Only honors the
// impersonation cookie if the *real*, currently authenticated session is
// still an admin -- re-checked every time via is_admin(), never trusted
// from the cookie alone. Nothing here is written to the database; it's a
// pure read of the caller's own session plus a local-only cookie.
export async function resolveActingUser(supabase, expectedRole) {
  const { data: claims } = await supabase.auth.getClaims()
  const realUserId = claims?.claims?.sub

  if (!realUserId) {
    return { userId: null, isImpersonating: false }
  }

  const impersonation = await getImpersonation()

  if (!impersonation || impersonation.role !== expectedRole) {
    return { userId: realUserId, isImpersonating: false }
  }

  const { data: isAdmin } = await supabase.rpc('is_admin')

  if (!isAdmin) {
    return { userId: realUserId, isImpersonating: false }
  }

  return { userId: impersonation.id, isImpersonating: true }
}

// Writes made while impersonating are only allowed in staging -- enforced
// here for a clean error message, and separately at the database level via
// RLS policies that only exist on the staging project.
export function canWriteWhileImpersonating() {
  return process.env.NEXT_PUBLIC_APP_ENV !== 'production'
}
