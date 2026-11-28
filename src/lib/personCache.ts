import { getSession } from './session'

const whoIsSignedIn = () => {
  const session = getSession()
  return `${session?.role ?? ''}:${session?.email ?? ''}`
}

/**
 * A value remembered for whoever is signed in right now, and only for them.
 * A module-level variable would outlive a sign-out: someone else signing in later in the same browser tab would inherit
 * the previous person's organization or team list. This hands back nothing once the signed-in person is different.
 */
export function personCache<T>() {
  let owner: string | null = null
  let value: T | undefined
  const cache = {
    get(): T | undefined { return owner === whoIsSignedIn() ? value : undefined },
    set(next: T) { owner = whoIsSignedIn(); value = next },
    clear() { owner = null; value = undefined },
  }
  everyCache.add(cache)
  return cache
}

const everyCache = new Set<{ clear: () => void }>()

/**
 * Forget every remembered list for the signed-in person. Called when their memberships change in this tab (an invitation
 * accepted), so the next screen asks the server which organizations they belong to instead of showing the old answer.
 */
export function forgetPersonCaches(): void {
  for (const cache of everyCache) cache.clear()
}
