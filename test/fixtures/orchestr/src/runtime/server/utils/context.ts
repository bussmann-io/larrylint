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
