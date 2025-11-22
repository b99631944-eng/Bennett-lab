/**
 * Permission Handler
 * 
 * Manages device permissions for camera and audio with iOS compatibility.
 * Implements a state machine: IDLE -> REQUESTING -> GRANTED | DENIED
 */

export enum PermissionState {
  IDLE = 'idle',
  REQUESTING = 'requesting',
  GRANTED = 'granted',
  DENIED = 'denied',
}

export interface PermissionConfig {
  /** Request camera access */
  camera?: boolean;
  
  /** Request audio access */
  audio?: boolean;
  
  /** Callback when state changes */
  onStateChange?: (state: PermissionState) => void;
}

export class PermissionHandler {
  private state: PermissionState;
  private config: Required<PermissionConfig>;
  private overlayElement: HTMLElement | null;

  constructor(config: PermissionConfig = {}) {
    this.state = PermissionState.IDLE;
    this.config = {
      camera: config.camera ?? true,
      audio: config.audio ?? false,
      onStateChange: config.onStateChange ?? (() => {}),
    };
    this.overlayElement = null;
  }

  /**
   * Gets current permission state
   */
  public getState(): PermissionState {
    return this.state;
  }

  /**
   * Creates and shows the permission UI overlay
   * Returns a promise that resolves when user taps to start
   */
  public async showPermissionUI(): Promise<void> {
    return new Promise((resolve) => {
      this.createOverlay(() => {
        this.removeOverlay();
        resolve();
      });
    });
  }

  /**
   * Requests camera and/or audio permissions
   * Must be called from a user gesture on iOS
   */
  public async requestPermissions(): Promise<boolean> {
    if (this.state === PermissionState.REQUESTING) {
      console.warn('Permission request already in progress');
      return false;
    }

    this.setState(PermissionState.REQUESTING);

    try {
      const constraints: MediaStreamConstraints = {
        video: this.config.camera ? {
          facingMode: 'environment', // Rear camera for AR
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        } : false,
        audio: this.config.audio,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Permission granted - clean up the test stream
      stream.getTracks().forEach(track => track.stop());
      
      this.setState(PermissionState.GRANTED);
      return true;

    } catch (error) {
      console.error('Permission denied:', error);
      this.setState(PermissionState.DENIED);
      return false;
    }
  }

  /**
   * Creates the permission overlay UI
   */
  private createOverlay(onTap: () => void): void {
    if (this.overlayElement) return;

    const overlay = document.createElement('div');
    overlay.id = 'permission-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: white;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      text-align: center;
      padding: 2rem;
      max-width: 400px;
    `;

    const title = document.createElement('h1');
    title.textContent = '📱 WebAR Platform';
    title.style.cssText = `
      font-size: 2.5rem;
      margin-bottom: 1rem;
      font-weight: bold;
    `;

    const description = document.createElement('p');
    description.textContent = 'Experience immersive augmented reality on your device';
    description.style.cssText = `
      font-size: 1.125rem;
      margin-bottom: 2rem;
      opacity: 0.9;
    `;

    const button = document.createElement('button');
    button.textContent = 'Tap to Start';
    button.style.cssText = `
      background: white;
      color: #667eea;
      border: none;
      padding: 1rem 3rem;
      font-size: 1.25rem;
      font-weight: bold;
      border-radius: 9999px;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    `;

    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 15px 40px rgba(0, 0, 0, 0.4)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
    });

    button.addEventListener('click', onTap);
    button.addEventListener('touchend', (e) => {
      e.preventDefault();
      onTap();
    });

    const info = document.createElement('p');
    info.textContent = this.config.camera 
      ? '📷 Camera access required for AR experience'
      : '🎮 Starting WebAR experience';
    info.style.cssText = `
      font-size: 0.875rem;
      margin-top: 2rem;
      opacity: 0.7;
    `;

    content.appendChild(title);
    content.appendChild(description);
    content.appendChild(button);
    content.appendChild(info);
    overlay.appendChild(content);

    document.body.appendChild(overlay);
    this.overlayElement = overlay;
  }

  /**
   * Removes the permission overlay
   */
  private removeOverlay(): void {
    if (this.overlayElement) {
      this.overlayElement.style.transition = 'opacity 0.5s';
      this.overlayElement.style.opacity = '0';
      
      setTimeout(() => {
        if (this.overlayElement && this.overlayElement.parentElement) {
          this.overlayElement.parentElement.removeChild(this.overlayElement);
        }
        this.overlayElement = null;
      }, 500);
    }
  }

  /**
   * Sets the permission state and triggers callback
   */
  private setState(state: PermissionState): void {
    this.state = state;
    this.config.onStateChange(state);
  }

  /**
   * Resets the permission handler
   */
  public reset(): void {
    this.setState(PermissionState.IDLE);
    this.removeOverlay();
  }
}
