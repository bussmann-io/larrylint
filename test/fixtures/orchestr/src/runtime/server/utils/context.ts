export async function getApiContext(event) {
  const key = event.context.key

  if (!key) {
    throw createError({ message: 'API key missing' })
  }

  return { client: createClient(key) }
}

export function getSafeContext(event) {
  try {
    return parseKey(event)
  }
  catch {
    return undefined
  }
}

export function lazyClient() {
  return () => {
    throw new Error('Not configured')
  }
}

export const readLocation = event => getCookie(event, 'location')

export function readSelectedSlug(event) {
  const raw = getCookie(event, 'karls.location')

  if (!raw) {
    return undefined
  }

  const parsed = destr(raw)

  return parsed.slug
}

export async function getClientContext(event) {
  const appId = getCookie(event, 'guest-app-id')

  return { client: createClient(appId), shopId: 1 }
}
