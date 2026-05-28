import { mainContainer } from '../pixi';
import { generateRandomShape } from '../pixi/generator';
import { renderSkiaScene } from '../skia';

export function initUI(): void {
  const btnGenerate = document.getElementById('btn-generate') as HTMLButtonElement;
  const btnExport = document.getElementById('btn-export') as HTMLButtonElement;

  btnGenerate.addEventListener('click', () => {
    generateRandomShape(mainContainer);
    renderSkiaScene(mainContainer);
  });

  btnExport.addEventListener('click', () => {
    console.log('Export PDF clicked');
  });
}
