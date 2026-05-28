import type { CanvasKit, Canvas, Paint } from 'canvaskit-wasm';
import * as PIXI from 'pixi.js';

function colorToHex(color: number): string {
  return '#' + (color & 0xFFFFFF).toString(16).padStart(6, '0');
}

function applyTransform(ck: CanvasKit, canvas: Canvas, obj: PIXI.DisplayObject): void {
  const wt = obj.worldTransform;
  const matrix = new Float32Array([
    wt.a, wt.b, 0,
    wt.c, wt.d, 0,
    wt.tx, wt.ty, 1,
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

export function convertPixiContainerToSkia(
  ck: CanvasKit,
  canvas: Canvas,
  container: PIXI.Container,
): void {
  for (const child of container.children) {
    if (child instanceof PIXI.Container && !(child instanceof PIXI.Graphics)) {
      convertPixiContainerToSkia(ck, canvas, child);
      continue;
    }

    if (!(child instanceof PIXI.Graphics)) continue;

    const graphics = child;
    const graphicsData = graphics.geometry.graphicsData;

    applyTransform(ck, canvas, graphics);

    for (const data of graphicsData) {
      const { shape, fillStyle, lineStyle } = data;

      const paint = new ck.Paint();

      if (fillStyle && fillStyle.visible !== false) {
        setFillStyle(ck, paint, fillStyle);
        drawShape(ck, canvas, paint, shape);
      }

      if (lineStyle && lineStyle.visible !== false && lineStyle.width > 0) {
        setLineStyle(ck, paint, lineStyle);
        drawShape(ck, canvas, paint, shape);
      }

      paint.delete();
    }

    canvas.restore();
  }
}

function drawShape(ck: CanvasKit, canvas: Canvas, paint: Paint, shape: any): void {
  if (shape instanceof PIXI.Rectangle) {
    const rect = ck.XYWHRect(shape.x, shape.y, shape.width, shape.height);
    canvas.drawRect(rect, paint);
  } else if (shape instanceof PIXI.Ellipse) {
    const rx = shape.width;
    const ry = shape.height;
    const rect = ck.XYWHRect(shape.x - rx, shape.y - ry, rx * 2, ry * 2);
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
