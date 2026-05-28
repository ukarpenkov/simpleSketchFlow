import * as PIXI from 'pixi.js';

type ShapeType = 'rect' | 'ellipse' | 'line';

function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomColor(): number {
  const colors = [
    0xff6b6b, 0x51cf66, 0x339af0, 0xfcc419,
    0xcc5de8, 0xff922b, 0x20c997, 0xff6b6b,
    0x748ffc, 0xf06595, 0x5c7cfa, 0xffd43b,
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

function drawRect(g: PIXI.Graphics): void {
  const w = randomRange(30, 150);
  const h = randomRange(30, 150);
  g.beginFill(randomColor(), 0.85);
  g.lineStyle(randomRange(1, 10), randomColor());
  g.drawRect(0, 0, w, h);
  g.endFill();
}

function drawEllipse(g: PIXI.Graphics): void {
  const rx = randomRange(15, 75);
  const ry = randomRange(15, 75);
  g.beginFill(randomColor(), 0.85);
  g.lineStyle(randomRange(1, 10), randomColor());
  g.drawEllipse(0, 0, rx, ry);
  g.endFill();
}

function drawLine(g: PIXI.Graphics): void {
  const x2 = randomRange(30, 150);
  const y2 = randomRange(30, 150);
  g.lineStyle(randomRange(1, 10), randomColor());
  g.moveTo(0, 0);
  g.lineTo(x2, y2);
}

export function generateRandomShape(container: PIXI.Container): void {
  const shape: ShapeType = (['rect', 'ellipse', 'line'] as const)[
    Math.floor(Math.random() * 3)
  ];

  const g = new PIXI.Graphics();

  switch (shape) {
    case 'rect':
      drawRect(g);
      break;
    case 'ellipse':
      drawEllipse(g);
      break;
    case 'line':
      drawLine(g);
      break;
  }

  g.position.set(randomRange(0, 800), randomRange(0, 600));
  container.addChild(g);
}
