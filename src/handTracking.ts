// MediaPipe is loaded via CDN script tag in index.html
// Import only for types
import type { Hands as HandsType, Results } from '@mediapipe/hands';
import { HandLandmarks, Point2D } from './types';

// Declare global window interface
declare global {
  interface Window {
    Hands: typeof HandsType;
  }
}

export type HandResultsCallback = (landmarks: HandLandmarks | null) => void;

export class HandTracker {
  private hands!: HandsType;
  private videoElement: HTMLVideoElement;
  private callback: HandResultsCallback | null = null;
  private isRunning = false;
  private animationId: number | null = null;
  private canvasWidth = 640;
  private canvasHeight = 480;
  private initialized = false;

  constructor(videoElement: HTMLVideoElement) {
    this.videoElement = videoElement;
    // MediaPipe will be initialized asynchronously in start()
  }

  private async initializeMediaPipe(): Promise<void> {
    if (this.initialized) return;

    console.log('[HandTracker] Initializing MediaPipe Hands...');

    // Wait for MediaPipe to be available from CDN script
    while (!window.Hands) {
      console.log('[HandTracker] Waiting for MediaPipe CDN script to load...');
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('[HandTracker] MediaPipe CDN script loaded, creating Hands instance...');

    this.hands = new window.Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      }
    });

    this.hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,  // Better accuracy model (less jitter)
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.5
    });

    this.hands.onResults((results) => this.onResults(results));

    console.log('[HandTracker] MediaPipe Hands initialized successfully');
    this.initialized = true;
  }

  setCanvasSize(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  private onResults(results: Results): void {
    if (!this.callback) return;

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      // Use the first detected hand (could enhance to prefer right hand)
      const landmarks = results.multiHandLandmarks[0];
      const worldLandmarks = results.multiHandWorldLandmarks?.[0];

      // Convert normalized coordinates to canvas coordinates
      const convertedLandmarks: Point2D[] = landmarks.map((lm) => ({
        x: (1 - lm.x) * this.canvasWidth,  // Mirror horizontally
        y: lm.y * this.canvasHeight
      }));

      const convertedWorldLandmarks = worldLandmarks?.map((lm) => ({
        x: -lm.x,  // Mirror
        y: -lm.y,
        z: lm.z
      }));

      this.callback({
        landmarks: convertedLandmarks,
        worldLandmarks: convertedWorldLandmarks
      });
    } else {
      this.callback(null);
    }
  }

  async start(callback: HandResultsCallback): Promise<void> {
    this.callback = callback;

    if (this.isRunning) return;

    try {
      console.log('[HandTracker] Starting hand tracking...');

      // Initialize MediaPipe first
      await this.initializeMediaPipe();

      console.log('[HandTracker] Requesting camera access...');

      // Request camera access - balance between speed and detection quality
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 },  // 30fps is enough for hand tracking
          facingMode: 'user'
        }
      });

      console.log('[HandTracker] Camera access granted, starting stream...');

      this.videoElement.srcObject = stream;
      await this.videoElement.play();

      this.isRunning = true;

      console.log('[HandTracker] Hand tracking active');

      // Use direct requestAnimationFrame for lower latency
      const processFrame = async () => {
        if (!this.isRunning) return;

        if (this.videoElement.readyState >= 2) {
          await this.hands.send({ image: this.videoElement });
        }

        this.animationId = requestAnimationFrame(processFrame);
      };

      processFrame();
    } catch (error) {
      console.error('[HandTracker] Failed to start hand tracking:', error);
      throw error;
    }
  }

  stop(): void {
    this.isRunning = false;

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    const stream = this.videoElement.srcObject as MediaStream;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  }

  isActive(): boolean {
    return this.isRunning;
  }
}
