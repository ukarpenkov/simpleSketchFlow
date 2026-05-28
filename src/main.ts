import { initPixi } from './pixi';
import { initSkia } from './skia';
import { initUI } from './ui';

const pixiCanvas = document.getElementById('pixi-canvas') as HTMLCanvasElement;
const skiaCanvas = document.getElementById('skia-canvas') as HTMLCanvasElement;

initPixi(pixiCanvas);
initSkia(skiaCanvas);
initUI();
