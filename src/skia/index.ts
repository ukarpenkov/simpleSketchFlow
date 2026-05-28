import CanvasKitInit, { CanvasKit, Surface, Canvas } from 'canvaskit-wasm';
import type { Container } from 'pixi.js';
import { convertPixiContainerToSkia } from './converter';

export let ck: CanvasKit;
export let surface: Surface | null = null;
export let skiaCanvas: Canvas;

export async function initSkia(canvasId: string): Promise<void> {
  try {
    ck = await CanvasKitInit({
      locateFile: (file) => `${import.meta.env.BASE_URL}${file}`,
    });
    surface = ck.MakeSWCanvasSurface(canvasId);
    if (!surface) {
      throw new Error(`Failed to create surface for canvas "${canvasId}"`);
    }
    skiaCanvas = surface.getCanvas();
    const el = document.getElementById(canvasId) as HTMLCanvasElement;
    console.log('[Skia] surface created:', { width: el.width, height: el.height });
  } catch (error) {
    console.error('Failed to initialize CanvasKit WASM:', error);
    const el = document.getElementById(canvasId);
    if (el) {
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.color = '#ff6b6b';
      el.style.fontSize = '14px';
      el.textContent = 'Skia WASM failed to load';
    }
  }
}

export function renderSkiaScene(container: Container): void {
  if (!surface || !ck || !skiaCanvas) return;
  container.updateTransform();
  const darkBg = ck.parseColorString('#1a1a2e');
  skiaCanvas.clear(darkBg);
  convertPixiContainerToSkia(ck, skiaCanvas, container);
  surface.flush();
}
