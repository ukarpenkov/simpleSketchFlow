import type { CanvasKit, Canvas, Paint } from 'canvaskit-wasm';
import * as PIXI from 'pixi.js';
import { resetShapeIndex } from '../debug/coordLog';

// NOTE: PIXI.Sprite (bitmap images) is skipped here — it would be embedded
// as a bitmap in PDF export. This is acceptable per the specification.

function colorToHex(color: number): string {
  return '#' + (color & 0xFFFFFF).toString(16).padStart(6, '0');
}

function applyTransform(ck: CanvasKit, canvas: Canvas, obj: PIXI.DisplayObject): void {
  const wt = obj.worldTransform;
  // SkMatrix row-major: [scaleX, skewX, transX, skewY, scaleY, transY, persp0, persp1, persp2]
  // Pixi: x' = a*x + c*y + tx, y' = b*x + d*y + ty
  const matrix = new Float32Array([
    wt.a, wt.c, wt.tx,
    wt.b, wt.d, wt.ty,
    0, 0, 1,
  ]);
  canvas.save();
  canvas.concat(matrix);
}

function setFillStyle(ck: CanvasKit, paint: Paint, fillStyle: any): void {
  if (fillStyle) {
    paint.setColor(ck.parseColorString(colorToHex(fillStyle.color)));
    paint.setAlphaf(fillStyle.alpha ?? 1);
    paint.setStyle(ck.PaintStyle.Fill);
  }
}

function setLineStyle(ck: CanvasKit, paint: Paint, lineStyle: any): void {
  if (lineStyle) {
    paint.setColor(ck.parseColorString(colorToHex(lineStyle.color)));
    paint.setAlphaf(lineStyle.alpha ?? 1);
    paint.setStyle(ck.PaintStyle.Stroke);
    paint.setStrokeWidth(lineStyle.width ?? 1);
  }
}

let skiaShapeIdx = 0;

export function convertPixiContainerToSkia(
  ck: CanvasKit,
  canvas: Canvas,
  container: PIXI.Container,
): void {
  resetShapeIndex();
  skiaShapeIdx = 0;
  convertPixiContainerToSkiaInner(ck, canvas, container);
}

function convertPixiContainerToSkiaInner(
  ck: CanvasKit,
  canvas: Canvas,
  container: PIXI.Container,
): void {
  for (const child of container.children) {
    if (child instanceof PIXI.Container && !(child instanceof PIXI.Graphics)) {
      convertPixiContainerToSkiaInner(ck, canvas, child);
      continue;
    }

    if (!(child instanceof PIXI.Graphics)) continue;

    const graphics = child;
    const graphicsData = graphics.geometry.graphicsData;

    applyTransform(ck, canvas, graphics);

    const wt = graphics.worldTransform;
    const matrix = new Float32Array([wt.a, wt.b, 0, wt.c, wt.d, 0, wt.tx, wt.ty, 1]);
    console.log(
      `%c[Skia] shape #${skiaShapeIdx} matrix:`,
      'color: #ff922b; font-weight: bold',
      `[${[...matrix].map(v => +v.toFixed(4)).join(', ')}]`,
      '| wt:', {
        a: +wt.a.toFixed(4), b: +wt.b.toFixed(4),
        c: +wt.c.toFixed(4), d: +wt.d.toFixed(4),
        tx: +wt.tx.toFixed(2), ty: +wt.ty.toFixed(2),
      },
    );
    skiaShapeIdx++;

    for (const data of graphicsData) {
      const { shape, fillStyle, lineStyle } = data;

      if (fillStyle && fillStyle.visible !== false) {
        const fillPaint = new ck.Paint();
        setFillStyle(ck, fillPaint, fillStyle);
        drawShape(ck, canvas, fillPaint, shape);
        fillPaint.delete();
      }

      if (lineStyle && lineStyle.visible !== false && lineStyle.width > 0) {
        const strokePaint = new ck.Paint();
        setLineStyle(ck, strokePaint, lineStyle);
        drawShape(ck, canvas, strokePaint, shape);
        strokePaint.delete();
      }
    }

    canvas.restore();
  }
}

function drawShape(ck: CanvasKit, canvas: Canvas, paint: Paint, shape: any): void {
  if (shape instanceof PIXI.Rectangle) {
    const rect = ck.XYWHRect(shape.x, shape.y, shape.width, shape.height);
    console.log(`  [Skia] rect local: x=${shape.x}, y=${shape.y}, w=${shape.width}, h=${shape.height}`);
    canvas.drawRect(rect, paint);
  } else if (shape instanceof PIXI.Ellipse) {
    const rect = ck.XYWHRect(shape.x - shape.width / 2, shape.y - shape.height / 2, shape.width, shape.height);
    console.log(`  [Skia] ellipse local: cx=${shape.x}, cy=${shape.y}, w=${shape.width}, h=${shape.height}`);
    canvas.drawOval(rect, paint);
  } else if (shape instanceof PIXI.Polygon) {
    const points = shape.points;
    if (points.length >= 4) {
      const builder = new ck.PathBuilder();
      builder.moveTo(points[0], points[1]);
      for (let i = 2; i < points.length; i += 2) {
        builder.lineTo(points[i], points[i + 1]);
      }
      if (shape.closeStroke) {
        builder.close();
      }
      const path = builder.detach();
      canvas.drawPath(path, paint);
      path.delete();
      builder.delete();
    }
  }
}
