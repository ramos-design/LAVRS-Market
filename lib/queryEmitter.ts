/**
 * Event-based cache invalidation system
 * Umožňuje invalidovat cache bez tvrdého refreshu
 */

type Listener = () => void;

class QueryEmitter {
  private listeners = new Map<string, Set<Listener>>();

  subscribe(queryKey: string, callback: Listener): () => void {
    if (!this.listeners.has(queryKey)) {
      this.listeners.set(queryKey, new Set());
    }
    this.listeners.get(queryKey)!.add(callback);

    // Unsubscribe function
    return () => {
      this.listeners.get(queryKey)?.delete(callback);
    };
  }

  invalidate(queryKey: string) {
    const listeners = this.listeners.get(queryKey);
    if (listeners) {
      listeners.forEach(cb => cb());
    }
  }

  invalidatePattern(pattern: string | RegExp) {
    const regex = typeof pattern === 'string'
      ? new RegExp(pattern)
      : pattern;

    this.listeners.forEach((listeners, key) => {
      if (regex.test(key)) {
        listeners.forEach(cb => cb());
      }
    });
  }

  invalidateAll() {
    this.listeners.forEach(listeners => {
      listeners.forEach(cb => cb());
    });
  }

  clear() {
    this.listeners.clear();
  }
}

export const queryEmitter = new QueryEmitter();

// Pomocné funkce pro běžné invalidace
export function invalidateEvents() {
  queryEmitter.invalidate('events');
}

export function invalidateApplications() {
  queryEmitter.invalidatePattern(/^applications:/);
}

export function invalidateBrandProfiles() {
  queryEmitter.invalidatePattern(/^brand_profiles:/);
}

export function invalidateCategories() {
  queryEmitter.invalidate('categories');
}

export function invalidateBanners() {
  queryEmitter.invalidate('banners');
}

export function invalidateEventPlan(eventId: string) {
  queryEmitter.invalidate(`event_plan:${eventId}`);
}

export function invalidateAll() {
  queryEmitter.invalidateAll();
}
