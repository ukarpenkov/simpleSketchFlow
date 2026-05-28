import type * as PIXI from 'pixi.js';

let shapeIndex = 0;

export function resetShapeIndex(): void {
  shapeIndex = 0;
}

export function logPixiShape(
  label: string,
  graphics: PIXI.Graphics,
  localShape: { type: string; x: number; y: number; w: number; h: number; points?: number[] },
): void {
  const wt = graphics.worldTransform;
  const lt = graphics.localTransform;
  const idx = shapeIndex++;
  console.group(`%c[${label}] shape #${idx} — ${localShape.type}`, 'color: #339af0; font-weight: bold');
  console.log('  local shape:', localShape);
  console.log('  localTransform:', {
    a: +lt.a.toFixed(4), b: +lt.b.toFixed(4),
    c: +lt.c.toFixed(4), d: +lt.d.toFixed(4),
    tx: +lt.tx.toFixed(2), ty: +lt.ty.toFixed(2),
  });
  console.log('  worldTransform:', {
    a: +wt.a.toFixed(4), b: +wt.b.toFixed(4),
    c: +wt.c.toFixed(4), d: +wt.d.toFixed(4),
    tx: +wt.tx.toFixed(2), ty: +wt.ty.toFixed(2),
  });

  // Compute world-space bounding corners for rectangle-like shapes
  if (localShape.type === 'rect' || localShape.type === 'ellipse') {
    const { x, y, w, h } = localShape;
    const corners = localShape.type === 'rect'
      ? [
          transformPoint(wt, x, y),
          transformPoint(wt, x + w, y),
          transformPoint(wt, x + w, y + h),
          transformPoint(wt, x, y + h),
        ]
      : [
          transformPoint(wt, x, y), // center
        ];
    console.log('  world coords:', corners);
  }
  if (localShape.type === 'line' && localShape.points) {
    const pts = localShape.points;
    const worldPts = [];
    for (let i = 0; i < pts.length; i += 2) {
      worldPts.push(transformPoint(wt, pts[i], pts[i + 1]));
    }
    console.log('  world points:', worldPts);
  }
  console.groupEnd();
}

function transformPoint(wt: PIXI.Matrix, x: number, y: number) {
  return {
    x: +(wt.a * x + wt.c * y + wt.tx).toFixed(2),
    y: +(wt.b * x + wt.d * y + wt.ty).toFixed(2),
  };
}

export function logSkiaTransform(
  label: string,
  obj: PIXI.DisplayObject,
  matrix: Float32Array,
): void {
  const wt = obj.worldTransform;
  console.log(
    `%c[Skia] ${label} matrix:`,
    'color: #ff922b; font-weight: bold',
    `[${[...matrix].map(v => +v.toFixed(4)).join(', ')}]`,
    '| wt:', {
      a: +wt.a.toFixed(4), b: +wt.b.toFixed(4),
      c: +wt.c.toFixed(4), d: +wt.d.toFixed(4),
      tx: +wt.tx.toFixed(2), ty: +wt.ty.toFixed(2),
    },
  );
}
