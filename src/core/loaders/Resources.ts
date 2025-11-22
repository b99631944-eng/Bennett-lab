/**
 * Resource Loader
 * 
 * Asynchronous loading system for 3D models, textures, and audio.
 * Emits progress and completion events.
 */

import * as THREE from 'three';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Observer } from '@/utils/Observer';

export type ResourceType = 'gltf' | 'texture' | 'audio' | 'cubeTexture';

export interface ResourceItem {
  /** Unique name for the resource */
  name: string;
  
  /** Type of resource to load */
  type: ResourceType;
  
  /** Path or paths to the resource file(s) */
  path: string | string[];
}

export interface LoadProgress {
  /** Number of items loaded */
  loaded: number;
  
  /** Total number of items */
  total: number;
  
  /** Progress percentage (0-1) */
  progress: number;
  
  /** Name of currently loading item */
  currentItem?: string;
}

export class Resources extends Observer {
  private items: Map<string, any>;
  private toLoad: ResourceItem[];
  private loaded: number;
  private loadingOverlay: HTMLElement | null;

  // Loaders
  private gltfLoader: GLTFLoader;
  private textureLoader: THREE.TextureLoader;
  private audioLoader: THREE.AudioLoader;
  private cubeTextureLoader: THREE.CubeTextureLoader;

  constructor() {
    super();
    this.items = new Map();
    this.toLoad = [];
    this.loaded = 0;
    this.loadingOverlay = null;

    // Initialize loaders
    this.gltfLoader = new GLTFLoader();
    this.textureLoader = new THREE.TextureLoader();
    this.audioLoader = new THREE.AudioLoader();
    this.cubeTextureLoader = new THREE.CubeTextureLoader();
  }

  /**
   * Starts loading resources
   * @param resources - Array of resources to load
   */
  public async load(resources: ResourceItem[]): Promise<void> {
    this.toLoad = resources;
    this.loaded = 0;

    if (resources.length === 0) {
      this.emit('ready');
      return;
    }

    this.showLoadingScreen();

    const promises = resources.map(resource => this.loadResource(resource));

    try {
      await Promise.all(promises);
      this.emit('ready');
      this.hideLoadingScreen();
    } catch (error) {
      console.error('Error loading resources:', error);
      this.emit('error', error);
      this.hideLoadingScreen();
    }
  }

  /**
   * Loads a single resource
   */
  private async loadResource(resource: ResourceItem): Promise<void> {
    try {
      let loadedItem: any;

      switch (resource.type) {
        case 'gltf':
          loadedItem = await this.loadGLTF(resource.path as string);
          break;

        case 'texture':
          loadedItem = await this.loadTexture(resource.path as string);
          break;

        case 'audio':
          loadedItem = await this.loadAudio(resource.path as string);
          break;

        case 'cubeTexture':
          loadedItem = await this.loadCubeTexture(resource.path as string[]);
          break;

        default:
          throw new Error(`Unknown resource type: ${resource.type}`);
      }

      this.items.set(resource.name, loadedItem);
      this.loaded++;

      const progress: LoadProgress = {
        loaded: this.loaded,
        total: this.toLoad.length,
        progress: this.loaded / this.toLoad.length,
        currentItem: resource.name,
      };

      this.emit('progress', progress);
      this.updateLoadingScreen(progress);

    } catch (error) {
      console.error(`Failed to load ${resource.name}:`, error);
      throw error;
    }
  }

  /**
   * Loads a GLTF model
   */
  private loadGLTF(path: string): Promise<GLTF> {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        path,
        (gltf) => resolve(gltf),
        undefined,
        (error) => reject(error)
      );
    });
  }

  /**
   * Loads a texture
   */
  private loadTexture(path: string): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        path,
        (texture) => resolve(texture),
        undefined,
        (error) => reject(error)
      );
    });
  }

  /**
   * Loads an audio file
   */
  private loadAudio(path: string): Promise<AudioBuffer> {
    return new Promise((resolve, reject) => {
      this.audioLoader.load(
        path,
        (buffer) => resolve(buffer),
        undefined,
        (error) => reject(error)
      );
    });
  }

  /**
   * Loads a cube texture (skybox)
   */
  private loadCubeTexture(paths: string[]): Promise<THREE.CubeTexture> {
    return new Promise((resolve, reject) => {
      this.cubeTextureLoader.load(
        paths,
        (texture) => resolve(texture),
        undefined,
        (error) => reject(error)
      );
    });
  }

  /**
   * Gets a loaded resource by name
   * @param name - Name of the resource
   */
  public get<T = any>(name: string): T | undefined {
    return this.items.get(name) as T | undefined;
  }

  /**
   * Checks if a resource exists
   * @param name - Name of the resource
   */
  public has(name: string): boolean {
    return this.items.has(name);
  }

  /**
   * Shows the loading screen overlay
   */
  private showLoadingScreen(): void {
    if (this.loadingOverlay) return;

    const overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: white;
    `;

    const title = document.createElement('h2');
    title.textContent = 'Loading Assets...';
    title.style.cssText = `
      font-size: 2rem;
      margin-bottom: 2rem;
      font-weight: bold;
    `;

    const progressContainer = document.createElement('div');
    progressContainer.style.cssText = `
      width: 300px;
      height: 8px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      overflow: hidden;
    `;

    const progressBar = document.createElement('div');
    progressBar.id = 'loading-progress-bar';
    progressBar.style.cssText = `
      width: 0%;
      height: 100%;
      background: white;
      transition: width 0.3s ease;
    `;

    const progressText = document.createElement('p');
    progressText.id = 'loading-progress-text';
    progressText.textContent = '0%';
    progressText.style.cssText = `
      margin-top: 1rem;
      font-size: 1.125rem;
      opacity: 0.9;
    `;

    progressContainer.appendChild(progressBar);
    overlay.appendChild(title);
    overlay.appendChild(progressContainer);
    overlay.appendChild(progressText);

    document.body.appendChild(overlay);
    this.loadingOverlay = overlay;
  }

  /**
   * Updates the loading screen progress
   */
  private updateLoadingScreen(progress: LoadProgress): void {
    const progressBar = document.getElementById('loading-progress-bar');
    const progressText = document.getElementById('loading-progress-text');

    if (progressBar) {
      progressBar.style.width = `${progress.progress * 100}%`;
    }

    if (progressText) {
      progressText.textContent = `${Math.round(progress.progress * 100)}%`;
    }
  }

  /**
   * Hides the loading screen with fade out
   */
  private hideLoadingScreen(): void {
    if (this.loadingOverlay) {
      this.loadingOverlay.style.transition = 'opacity 0.5s';
      this.loadingOverlay.style.opacity = '0';

      setTimeout(() => {
        if (this.loadingOverlay) {
          this.loadingOverlay.remove();
        }
        this.loadingOverlay = null;
      }, 500);
    }
  }

  /**
   * Clears all loaded resources
   */
  public dispose(): void {
    this.items.forEach((item) => {
      if (item && typeof item.dispose === 'function') {
        item.dispose();
      }
    });

    this.items.clear();
    this.toLoad = [];
    this.loaded = 0;
  }
}
