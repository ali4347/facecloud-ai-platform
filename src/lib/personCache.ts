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
  return {
    get(): T | undefined { return owner === whoIsSignedIn() ? value : undefined },
    set(next: T) { owner = whoIsSignedIn(); value = next },
  }
}
