import { initPixi, mainContainer } from './pixi';
import { initSkia } from './skia';
import { initUI } from './ui';
import { setupSkiaEvents } from './skia/events';

(async () => {
  const pixiCanvas = document.getElementById('pixi-canvas') as HTMLCanvasElement;
  const skiaCanvas = document.getElementById('skia-canvas') as HTMLCanvasElement;

  initPixi(pixiCanvas);
  await initSkia('skia-canvas');
  setupSkiaEvents(skiaCanvas, mainContainer);
  initUI();
})();
