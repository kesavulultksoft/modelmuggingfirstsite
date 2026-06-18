/**
 * When instructor CRM profile is updated from any screen, listeners refetch so
 * onboarding contact and Account workspace profile stay aligned (all open tabs).
 */

const CHANNEL_NAME = 'mm-instructor-crm-profile-v1'

type Listener = () => void

const listeners = new Set<Listener>()

let channel: BroadcastChannel | null = null

function getSharedChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null
  if (channel) return channel
  try {
    channel = new BroadcastChannel(CHANNEL_NAME)
    channel.addEventListener('message', () => {
      listeners.forEach((l) => {
        try {
          l()
        } catch {
          // ignore listener errors
        }
      })
    })
    return channel
  } catch {
    return null
  }
}

/** Call after a successful CRM profile PUT so all subscribers reload. */
export function emitInstructorCrmProfileChanged(): void {
  if (typeof window === 'undefined') return
  const bc = getSharedChannel()
  if (bc) {
    bc.postMessage({ type: 'crm-profile-updated', t: Date.now() })
    return
  }
  listeners.forEach((l) => {
    try {
      l()
    } catch {
      // ignore
    }
  })
}

/** Subscribe to profile changes (same window + other tabs). Returns unsubscribe. */
export function subscribeInstructorCrmProfileChanged(listener: Listener): () => void {
  getSharedChannel()
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
