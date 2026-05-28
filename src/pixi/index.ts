import * as PIXI from 'pixi.js';

export let app: PIXI.Application;
export let mainContainer: PIXI.Container;

export function initPixi(canvas: HTMLCanvasElement): void {
  app = new PIXI.Application({
    view: canvas,
    width: 800,
    height: 600,
    background: '#1a1a2e',
    forceCanvas: true,
  });

  mainContainer = new PIXI.Container();
  app.stage.addChild(mainContainer);
}
