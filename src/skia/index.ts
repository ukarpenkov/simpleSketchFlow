import CanvasKitInit, { CanvasKit, Surface, Canvas } from 'canvaskit-wasm';
import type { Container } from 'pixi.js';
import { convertPixiContainerToSkia } from './converter';

export let ck: CanvasKit;
export let surface: Surface | null = null;
export let skiaCanvas: Canvas;

export async function initSkia(canvasId: string): Promise<void> {
  try {
    ck = await CanvasKitInit();
    surface = ck.MakeSWCanvasSurface(canvasId);
    if (!surface) {
      throw new Error(`Failed to create surface for canvas "${canvasId}"`);
    }
    skiaCanvas = surface.getCanvas();
    console.log('CanvasKit WASM initialized successfully');
  } catch (error) {
    console.error('Failed to initialize CanvasKit WASM:', error);
  }
}

export function renderSkiaScene(container: Container): void {
  if (!surface || !ck || !skiaCanvas) return;
  const white = ck.WHITE;
  skiaCanvas.clear(white);
  convertPixiContainerToSkia(ck, skiaCanvas, container);
  surface.flush();
}
