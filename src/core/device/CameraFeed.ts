/**
 * Camera Feed
 * 
 * Manages camera stream access and provides a Three.js VideoTexture.
 * Handles iOS-specific requirements like playsinline.
 */

import * as THREE from 'three';

export interface CameraConfig {
  /** Preferred camera facing mode */
  facingMode?: 'user' | 'environment';
  
  /** Ideal video width */
  width?: number;
  
  /** Ideal video height */
  height?: number;
}

export class CameraFeed {
  private videoElement: HTMLVideoElement | null;
  private stream: MediaStream | null;
  private texture: THREE.VideoTexture | null;
  private config: Required<CameraConfig>;
  private isActive: boolean;

  constructor(config: CameraConfig = {}) {
    this.config = {
      facingMode: config.facingMode ?? 'environment',
      width: config.width ?? 1920,
      height: config.height ?? 1080,
    };

    this.videoElement = null;
    this.stream = null;
    this.texture = null;
    this.isActive = false;
  }

  /**
   * Starts the camera feed
   * @returns Promise that resolves when camera is ready
   */
  public async start(): Promise<void> {
    if (this.isActive) {
      console.warn('Camera feed already active');
      return;
    }

    try {
      // Request camera access
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: this.config.facingMode,
          width: { ideal: this.config.width },
          height: { ideal: this.config.height },
        },
        audio: false,
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Create video element
      this.videoElement = document.createElement('video');
      
      // Critical iOS attributes
      this.videoElement.setAttribute('playsinline', '');
      this.videoElement.setAttribute('webkit-playsinline', '');
      this.videoElement.muted = true;
      this.videoElement.autoplay = true;
      
      // Set video source
      this.videoElement.srcObject = this.stream;

      // Wait for video to be ready
      await new Promise<void>((resolve, reject) => {
        if (!this.videoElement) {
          reject(new Error('Video element not initialized'));
          return;
        }

        this.videoElement.onloadedmetadata = () => {
          this.videoElement?.play()
            .then(() => resolve())
            .catch(reject);
        };

        this.videoElement.onerror = () => {
          reject(new Error('Failed to load video'));
        };
      });

      // Create Three.js texture
      if (this.videoElement) {
        this.texture = new THREE.VideoTexture(this.videoElement);
        this.texture.minFilter = THREE.LinearFilter;
        this.texture.magFilter = THREE.LinearFilter;
        this.texture.format = THREE.RGBAFormat;
        this.texture.colorSpace = THREE.SRGBColorSpace;
      }

      this.isActive = true;
      console.log('📹 Camera feed started');

    } catch (error) {
      console.error('Failed to start camera feed:', error);
      throw error;
    }
  }

  /**
   * Stops the camera feed and releases resources
   */
  public stop(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }

    if (this.texture) {
      this.texture.dispose();
      this.texture = null;
    }

    this.isActive = false;
    console.log('📹 Camera feed stopped');
  }

  /**
   * Gets the Three.js video texture
   * @returns VideoTexture or null if not active
   */
  public getTexture(): THREE.VideoTexture | null {
    return this.texture;
  }

  /**
   * Gets the video element
   * @returns HTMLVideoElement or null if not active
   */
  public getVideoElement(): HTMLVideoElement | null {
    return this.videoElement;
  }

  /**
   * Gets the media stream
   * @returns MediaStream or null if not active
   */
  public getStream(): MediaStream | null {
    return this.stream;
  }

  /**
   * Checks if camera feed is active
   */
  public isRunning(): boolean {
    return this.isActive;
  }

  /**
   * Gets the actual video dimensions
   */
  public getDimensions(): { width: number; height: number } | null {
    if (!this.videoElement) {
      return null;
    }

    return {
      width: this.videoElement.videoWidth,
      height: this.videoElement.videoHeight,
    };
  }

  /**
   * Switches camera (front/back)
   */
  public async switchCamera(): Promise<void> {
    const newFacingMode = this.config.facingMode === 'environment' ? 'user' : 'environment';
    this.config.facingMode = newFacingMode;
    
    this.stop();
    await this.start();
  }
}
