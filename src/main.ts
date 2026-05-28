import { initPixi } from './pixi';
import { initSkia } from './skia';
import { initUI } from './ui';

(async () => {
  const pixiCanvas = document.getElementById('pixi-canvas') as HTMLCanvasElement;

  initPixi(pixiCanvas);
  await initSkia('skia-canvas');
  initUI();
})();
