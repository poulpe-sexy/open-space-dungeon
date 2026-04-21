type Handler<T> = (payload: T) => void;

export interface BusEvents {
  encounter: { screenId: string; x: number; y: number };
  exitScreen: { toScreen: string };
  heroUpdated: void;
  victory: void;
  defeat: void;
  resume: void;
}

class EventBus {
  private handlers = new Map<keyof BusEvents, Set<Handler<unknown>>>();

  on<K extends keyof BusEvents>(ev: K, fn: Handler<BusEvents[K]>) {
    let set = this.handlers.get(ev);
    if (!set) {
      set = new Set();
      this.handlers.set(ev, set);
    }
    set.add(fn as Handler<unknown>);
    return () => set!.delete(fn as Handler<unknown>);
  }

  emit<K extends keyof BusEvents>(ev: K, payload: BusEvents[K]) {
    this.handlers.get(ev)?.forEach((fn) => (fn as Handler<BusEvents[K]>)(payload));
  }
}

export const bus = new EventBus();
