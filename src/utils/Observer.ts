/**
 * Event Observer / Event Emitter
 * 
 * Custom event system for the application.
 * Allows components to subscribe to and emit custom events.
 */

type EventCallback<T = any> = (data: T) => void;

export class Observer {
  private events: Map<string, EventCallback[]>;

  constructor() {
    this.events = new Map();
  }

  /**
   * Subscribes to an event
   * @param eventName - Name of the event
   * @param callback - Function to call when event is emitted
   * @returns Unsubscribe function
   */
  public on<T = any>(eventName: string, callback: EventCallback<T>): () => void {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }

    const callbacks = this.events.get(eventName)!;
    callbacks.push(callback as EventCallback);

    // Return unsubscribe function
    return () => this.off(eventName, callback);
  }

  /**
   * Subscribes to an event for a single emission
   * @param eventName - Name of the event
   * @param callback - Function to call when event is emitted
   */
  public once<T = any>(eventName: string, callback: EventCallback<T>): void {
    const onceCallback: EventCallback<T> = (data) => {
      callback(data);
      this.off(eventName, onceCallback);
    };

    this.on(eventName, onceCallback);
  }

  /**
   * Unsubscribes from an event
   * @param eventName - Name of the event
   * @param callback - Callback to remove
   */
  public off<T = any>(eventName: string, callback: EventCallback<T>): void {
    const callbacks = this.events.get(eventName);
    
    if (!callbacks) {
      return;
    }

    const index = callbacks.indexOf(callback as EventCallback);
    
    if (index !== -1) {
      callbacks.splice(index, 1);
    }

    // Clean up empty event arrays
    if (callbacks.length === 0) {
      this.events.delete(eventName);
    }
  }

  /**
   * Emits an event to all subscribers
   * @param eventName - Name of the event
   * @param data - Data to pass to callbacks
   */
  public emit<T = any>(eventName: string, data?: T): void {
    const callbacks = this.events.get(eventName);
    
    if (!callbacks) {
      return;
    }

    // Call all callbacks with the data
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event callback for '${eventName}':`, error);
      }
    });
  }

  /**
   * Removes all listeners for an event or all events
   * @param eventName - Optional event name (if not provided, clears all)
   */
  public clear(eventName?: string): void {
    if (eventName) {
      this.events.delete(eventName);
    } else {
      this.events.clear();
    }
  }

  /**
   * Gets the number of listeners for an event
   * @param eventName - Name of the event
   */
  public listenerCount(eventName: string): number {
    return this.events.get(eventName)?.length ?? 0;
  }

  /**
   * Gets all event names
   */
  public eventNames(): string[] {
    return Array.from(this.events.keys());
  }
}
