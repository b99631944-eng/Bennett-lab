/**
 * Input Manager
 * 
 * Unified input system for touch gestures and device orientation.
 * Provides abstractions for tap, swipe, pinch, and gyroscope events.
 */

import { Observer } from '@/utils/Observer';
import * as THREE from 'three';

export interface TouchPoint {
  x: number;
  y: number;
  id: number;
}

export interface SwipeData {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  deltaX: number;
  deltaY: number;
  direction: 'up' | 'down' | 'left' | 'right';
}

export interface PinchData {
  scale: number;
  delta: number;
}

export class InputManager extends Observer {
  private canvas: HTMLCanvasElement;
  private touches: Map<number, TouchPoint>;
  private touchStartTime: number;
  private initialPinchDistance: number;
  private lastPinchDistance: number;
  private deviceOrientationEnabled: boolean;
  private raycaster: THREE.Raycaster;
  private camera: THREE.Camera;

  // Configuration
  private readonly SWIPE_THRESHOLD = 50; // pixels
  private readonly TAP_TIME_THRESHOLD = 200; // milliseconds
  private readonly TAP_MOVE_THRESHOLD = 10; // pixels

  constructor(canvas: HTMLCanvasElement, camera: THREE.Camera) {
    super();
    this.canvas = canvas;
    this.camera = camera;
    this.touches = new Map();
    this.touchStartTime = 0;
    this.initialPinchDistance = 0;
    this.lastPinchDistance = 0;
    this.deviceOrientationEnabled = false;
    this.raycaster = new THREE.Raycaster();

    this.setupEventListeners();
  }

  /**
   * Sets up all event listeners
   */
  private setupEventListeners(): void {
    // Touch events
    this.canvas.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
    this.canvas.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    this.canvas.addEventListener('touchend', this.onTouchEnd.bind(this), { passive: false });
    this.canvas.addEventListener('touchcancel', this.onTouchCancel.bind(this), { passive: false });

    // Mouse events (for desktop testing)
    this.canvas.addEventListener('click', this.onClick.bind(this));
  }

  /**
   * Touch start handler
   */
  private onTouchStart(event: TouchEvent): void {
    event.preventDefault();

    this.touchStartTime = Date.now();

    for (let i = 0; i < event.touches.length; i++) {
      const touch = event.touches[i];
      const point: TouchPoint = {
        x: touch.clientX,
        y: touch.clientY,
        id: touch.identifier,
      };

      this.touches.set(touch.identifier, point);
    }

    // Initialize pinch if two fingers
    if (this.touches.size === 2) {
      this.initialPinchDistance = this.getPinchDistance();
      this.lastPinchDistance = this.initialPinchDistance;
    }
  }

  /**
   * Touch move handler
   */
  private onTouchMove(event: TouchEvent): void {
    event.preventDefault();

    // Update touch positions
    for (let i = 0; i < event.touches.length; i++) {
      const touch = event.touches[i];
      const stored = this.touches.get(touch.identifier);

      if (stored) {
        stored.x = touch.clientX;
        stored.y = touch.clientY;
      }
    }

    // Handle pinch
    if (this.touches.size === 2) {
      const currentDistance = this.getPinchDistance();
      const delta = currentDistance - this.lastPinchDistance;
      const scale = currentDistance / this.initialPinchDistance;

      const pinchData: PinchData = {
        scale,
        delta,
      };

      this.emit('pinch', pinchData);
      this.lastPinchDistance = currentDistance;
    }
  }

  /**
   * Touch end handler
   */
  private onTouchEnd(event: TouchEvent): void {
    event.preventDefault();

    const touchDuration = Date.now() - this.touchStartTime;

    // Get first touch point before removing
    const firstTouch = Array.from(this.touches.values())[0];

    // Remove ended touches
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      const stored = this.touches.get(touch.identifier);

      if (stored && firstTouch) {
        const deltaX = touch.clientX - firstTouch.x;
        const deltaY = touch.clientY - firstTouch.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // Check for tap
        if (touchDuration < this.TAP_TIME_THRESHOLD && distance < this.TAP_MOVE_THRESHOLD) {
          this.emit('tap', {
            x: touch.clientX,
            y: touch.clientY,
          });
        }
        // Check for swipe
        else if (distance > this.SWIPE_THRESHOLD) {
          const swipeData = this.getSwipeData(firstTouch.x, firstTouch.y, touch.clientX, touch.clientY);
          this.emit('swipe', swipeData);
        }
      }

      this.touches.delete(touch.identifier);
    }
  }

  /**
   * Touch cancel handler
   */
  private onTouchCancel(event: TouchEvent): void {
    event.preventDefault();

    for (let i = 0; i < event.changedTouches.length; i++) {
      this.touches.delete(event.changedTouches[i].identifier);
    }
  }

  /**
   * Click handler (for desktop testing)
   */
  private onClick(event: MouseEvent): void {
    this.emit('tap', {
      x: event.clientX,
      y: event.clientY,
    });
  }

  /**
   * Calculates distance between two touch points (for pinch)
   */
  private getPinchDistance(): number {
    const touchArray = Array.from(this.touches.values());
    
    if (touchArray.length < 2) {
      return 0;
    }

    const dx = touchArray[1].x - touchArray[0].x;
    const dy = touchArray[1].y - touchArray[0].y;

    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Determines swipe direction and creates swipe data
   */
  private getSwipeData(startX: number, startY: number, endX: number, endY: number): SwipeData {
    const deltaX = endX - startX;
    const deltaY = endY - startY;

    let direction: 'up' | 'down' | 'left' | 'right';

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      direction = deltaY > 0 ? 'down' : 'up';
    }

    return {
      startX,
      startY,
      endX,
      endY,
      deltaX,
      deltaY,
      direction,
    };
  }

  /**
   * Enables device orientation tracking
   */
  public async enableDeviceOrientation(): Promise<boolean> {
    if (this.deviceOrientationEnabled) {
      return true;
    }

    // Request permission on iOS 13+
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        
        if (permission !== 'granted') {
          console.warn('Device orientation permission denied');
          return false;
        }
      } catch (error) {
        console.error('Error requesting device orientation permission:', error);
        return false;
      }
    }

    window.addEventListener('deviceorientation', this.onDeviceOrientation.bind(this));
    this.deviceOrientationEnabled = true;
    console.log('📱 Device orientation enabled');
    return true;
  }

  /**
   * Device orientation handler
   */
  private onDeviceOrientation(event: DeviceOrientationEvent): void {
    const data = {
      alpha: event.alpha ?? 0, // Z-axis rotation (0-360)
      beta: event.beta ?? 0,   // X-axis rotation (-180 to 180)
      gamma: event.gamma ?? 0, // Y-axis rotation (-90 to 90)
    };

    this.emit('orientation', data);
  }

  /**
   * Performs a raycast from screen coordinates
   * @param x - Screen X coordinate
   * @param y - Screen Y coordinate
   * @param objects - Objects to raycast against
   * @returns Array of intersections
   */
  public raycast(x: number, y: number, objects: THREE.Object3D[]): THREE.Intersection[] {
    // Convert screen coordinates to normalized device coordinates (-1 to +1)
    const rect = this.canvas.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((x - rect.left) / rect.width) * 2 - 1,
      -((y - rect.top) / rect.height) * 2 + 1
    );

    this.raycaster.setFromCamera(mouse, this.camera);
    return this.raycaster.intersectObjects(objects, true);
  }

  /**
   * Performs a raycast from camera center
   * @param objects - Objects to raycast against
   * @returns Array of intersections
   */
  public raycastFromCenter(objects: THREE.Object3D[]): THREE.Intersection[] {
    const center = new THREE.Vector2(0, 0);
    this.raycaster.setFromCamera(center, this.camera);
    return this.raycaster.intersectObjects(objects, true);
  }

  /**
   * Cleans up event listeners
   */
  public dispose(): void {
    this.canvas.removeEventListener('touchstart', this.onTouchStart.bind(this));
    this.canvas.removeEventListener('touchmove', this.onTouchMove.bind(this));
    this.canvas.removeEventListener('touchend', this.onTouchEnd.bind(this));
    this.canvas.removeEventListener('touchcancel', this.onTouchCancel.bind(this));
    this.canvas.removeEventListener('click', this.onClick.bind(this));

    if (this.deviceOrientationEnabled) {
      window.removeEventListener('deviceorientation', this.onDeviceOrientation.bind(this));
    }

    this.clear();
  }
}
