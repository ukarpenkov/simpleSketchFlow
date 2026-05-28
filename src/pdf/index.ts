import { PDFDocument, rgb } from 'pdf-lib';
import * as PIXI from 'pixi.js';
import type { Container } from 'pixi.js';

function colorToRgb(color: number): [number, number, number] {
  return [
    ((color >> 16) & 0xff) / 255,
    ((color >> 8) & 0xff) / 255,
    (color & 0xff) / 255,
  ];
}

function drawShape(
  page: any,
  shape: any,
  fillStyle: any,
  lineStyle: any,
  wt: PIXI.Matrix,
): void {
  if (shape instanceof PIXI.Rectangle) {
    const x = shape.x;
    const y = shape.y;
    const w = shape.width;
    const h = shape.height;

    const corners = [
      { x, y },
      { x: x + w, y },
      { x: x + w, y: y + h },
      { x, y: y + h },
    ].map((c) => ({
      x: wt.a * c.x + wt.c * c.y + wt.tx,
      y: wt.b * c.x + wt.d * c.y + wt.ty,
    }));

    const opts: any = {};
    if (fillStyle && fillStyle.visible !== false) {
      const [r, g, b] = colorToRgb(fillStyle.color);
      opts.color = rgb(r, g, b);
      opts.opacity = fillStyle.alpha ?? 1;
    }
    if (lineStyle && lineStyle.visible !== false && lineStyle.width > 0) {
      const [r, g, b] = colorToRgb(lineStyle.color);
      opts.borderColor = rgb(r, g, b);
      opts.borderWidth = lineStyle.width;
      opts.opacity = lineStyle.alpha ?? 1;
    }

    // Use SVG path for rotated/skewed rectangles (pdf-lib drawRectangle doesn't support rotation)
    const path =
      `M ${corners[0].x} ${corners[0].y} ` +
      `L ${corners[1].x} ${corners[1].y} ` +
      `L ${corners[2].x} ${corners[2].y} ` +
      `L ${corners[3].x} ${corners[3].y} Z`;
    page.drawSvgPath(path, opts);
    return;
  }

  if (shape instanceof PIXI.Ellipse) {
    const cx = wt.a * shape.x + wt.c * shape.y + wt.tx;
    const cy = wt.b * shape.x + wt.d * shape.y + wt.ty;
    const rx = Math.sqrt((wt.a * shape.width) ** 2 + (wt.b * shape.width) ** 2) / 2;
    const ry = Math.sqrt((wt.c * shape.height) ** 2 + (wt.d * shape.height) ** 2) / 2;

    const opts: any = { x: cx - rx, y: cy - ry, width: rx * 2, height: ry * 2 };
    if (fillStyle && fillStyle.visible !== false) {
      const [r, g, b] = colorToRgb(fillStyle.color);
      opts.color = rgb(r, g, b);
      opts.opacity = fillStyle.alpha ?? 1;
    }
    if (lineStyle && lineStyle.visible !== false && lineStyle.width > 0) {
      const [r, g, b] = colorToRgb(lineStyle.color);
      opts.borderColor = rgb(r, g, b);
      opts.borderWidth = lineStyle.width;
      opts.opacity = lineStyle.alpha ?? 1;
    }
    page.drawEllipse(opts);
    return;
  }

  if (shape instanceof PIXI.Polygon) {
    const pts = shape.points;
    if (pts.length < 4) return;

    const parts: string[] = [];
    for (let i = 0; i < pts.length; i += 2) {
      const x = wt.a * pts[i] + wt.c * pts[i + 1] + wt.tx;
      const y = wt.b * pts[i] + wt.d * pts[i + 1] + wt.ty;
      parts.push(`${i === 0 ? 'M' : 'L'} ${x} ${y}`);
    }
    if (shape.closeStroke) parts.push('Z');
    const path = parts.join(' ');
    if (!path) return;

    const opts: any = {};
    if (fillStyle && fillStyle.visible !== false) {
      const [r, g, b] = colorToRgb(fillStyle.color);
      opts.color = rgb(r, g, b);
      opts.opacity = fillStyle.alpha ?? 1;
    }
    if (lineStyle && lineStyle.visible !== false && lineStyle.width > 0) {
      const [r, g, b] = colorToRgb(lineStyle.color);
      opts.borderColor = rgb(r, g, b);
      opts.borderWidth = lineStyle.width;
      opts.opacity = lineStyle.alpha ?? 1;
    }
    page.drawSvgPath(path, opts);
  }
}

function processGraphics(
  page: any,
  graphics: PIXI.Graphics,
): void {
  const graphicsData = graphics.geometry.graphicsData;
  const wt = graphics.worldTransform;

  for (const data of graphicsData) {
    const { shape, fillStyle, lineStyle } = data;
    drawShape(page, shape, fillStyle, lineStyle, wt);
  }
}

function traverseAndDraw(page: any, container: PIXI.Container): void {
  for (const child of container.children) {
    if (child instanceof PIXI.Container && !(child instanceof PIXI.Graphics)) {
      traverseAndDraw(page, child);
      continue;
    }

    if (child instanceof PIXI.Graphics) {
      processGraphics(page, child);
    }
  }
}

/**
 * Export Pixi scene to a vector PDF.
 * Uses pdf-lib native drawing API instead of bitmap embedding.
 * Shapes are vector: rectangles, ellipses, polygons — all sharp at any zoom.
 */
export async function exportToPDF(
  mainContainer: Container,
  width = 800,
  height = 600,
): Promise<void> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([width, height]);

  traverseAndDraw(page, mainContainer);

  const pdfBytes = await pdfDoc.save();
  const ab = new ArrayBuffer(pdfBytes.byteLength);
  new Uint8Array(ab).set(pdfBytes);
  const blob = new Blob([ab], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'sketch.pdf';
  a.click();

  URL.revokeObjectURL(url);
}
