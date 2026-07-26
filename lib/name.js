export function abbreviateName(fullName) {
  const parts = (fullName ?? '').trim().split(/\s+/).filter(Boolean)

  if (parts.length === 0) return ''

  const [first, ...rest] = parts

  return [first, ...rest.map((part) => `${part[0].toUpperCase()}.`)].join(' ')
}
