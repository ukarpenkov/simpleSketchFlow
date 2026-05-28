import * as PIXI from 'pixi.js';
import { logPixiShape, resetShapeIndex } from '../debug/coordLog';

type ShapeType = 'rect' | 'ellipse' | 'line';

let shapeCounter = 0;

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

function createRandomGraphics(): PIXI.Graphics {
  const shape: ShapeType = (['rect', 'ellipse', 'line'] as const)[
    Math.floor(Math.random() * 3)
  ];
  const g = new PIXI.Graphics();
  const shapeId = `shape_${++shapeCounter}`;

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

  g.eventMode = 'static';
  g.cursor = 'pointer';

  g.on('pointerdown', () => {
    console.log(`${shapeId} pointerdown`);
    g.tint = 0xff0000;
  });

  g.on('pointerup', () => {
    console.log(`${shapeId} pointerup`);
    g.tint = 0xffffff;
  });

  return g;
}

function applyTransform(obj: PIXI.Container): void {
  obj.position.set(randomRange(0, 800), randomRange(0, 600));
  obj.angle = randomRange(0, 360);
  const sx = randomRange(0.5, 2.0);
  const sy = randomRange(0.5, 2.0);
  obj.scale.set(sx, sy);
}

export function generateRandomShape(container: PIXI.Container): void {
  resetShapeIndex();
  const useSubContainer = Math.random() < 0.3;

  if (useSubContainer) {
    const sub = new PIXI.Container();
    const count = Math.floor(randomRange(2, 4)); // 2-3 shapes
    for (let i = 0; i < count; i++) {
      const g = createRandomGraphics();
      g.position.set(randomRange(-50, 50), randomRange(-50, 50));
      g.angle = randomRange(0, 360);
      const s = randomRange(0.5, 2.0);
      g.scale.set(s, s);
      sub.addChild(g);
    }
    applyTransform(sub);
    container.addChild(sub);
  } else {
    const g = createRandomGraphics();
    applyTransform(g);
    container.addChild(g);
  }

  // Force Pixi to update worldTransform, then log all shapes
  container.updateTransform();
  logContainerShapes(container);
}

function logContainerShapes(container: PIXI.Container): void {
  for (const child of container.children) {
    if (child instanceof PIXI.Container && !(child instanceof PIXI.Graphics)) {
      logContainerShapes(child);
      continue;
    }
    if (!(child instanceof PIXI.Graphics)) continue;
    const g = child;
    const data = g.geometry.graphicsData;
    for (const d of data) {
      const shape = d.shape;
      let localShape: { type: string; x: number; y: number; w: number; h: number; points?: number[] };
      if (shape instanceof PIXI.Rectangle) {
        localShape = { type: 'rect', x: shape.x, y: shape.y, w: shape.width, h: shape.height };
      } else if (shape instanceof PIXI.Ellipse) {
        localShape = { type: 'ellipse', x: shape.x, y: shape.y, w: shape.width, h: shape.height };
      } else if (shape instanceof PIXI.Polygon) {
        localShape = { type: 'line', x: 0, y: 0, w: 0, h: 0, points: [...shape.points] };
      } else {
        continue;
      }
      logPixiShape('Pixi', g, localShape);
    }
  }
}
