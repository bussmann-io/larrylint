export function track(event: string) {
  const shopware = useRuntimeConfig()['@laioutr-app/shopware']

  return { event, shopware }
}
