import { PDFDocument, rgb } from 'pdf-lib';
import * as PIXI from 'pixi.js';
import type { Container } from 'pixi.js';
import { resetShapeIndex } from '../debug/coordLog';

function colorToRgb(color: number): [number, number, number] {
  return [
    ((color >> 16) & 0xff) / 255,
    ((color >> 8) & 0xff) / 255,
    (color & 0xff) / 255,
  ];
}

function toPdfY(canvasY: number, pageHeight: number): number {
  return pageHeight - canvasY;
}

function transformPoint(
  wt: PIXI.Matrix,
  x: number,
  y: number,
  pageHeight: number,
): { x: number; y: number } {
  const canvasX = wt.a * x + wt.c * y + wt.tx;
  const canvasY = wt.b * x + wt.d * y + wt.ty;
  return { x: canvasX, y: toPdfY(canvasY, pageHeight) };
}

function styleOpts(fillStyle: any, lineStyle: any): Record<string, unknown> {
  const opts: Record<string, unknown> = {};
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
  return opts;
}

function drawShape(
  page: any,
  shape: any,
  fillStyle: any,
  lineStyle: any,
  wt: PIXI.Matrix,
  pageHeight: number,
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
    ].map((c) => transformPoint(wt, c.x, c.y, pageHeight));

    const path =
      `M ${corners[0].x} ${corners[0].y} ` +
      `L ${corners[1].x} ${corners[1].y} ` +
      `L ${corners[2].x} ${corners[2].y} ` +
      `L ${corners[3].x} ${corners[3].y} Z`;
    page.drawSvgPath(path, styleOpts(fillStyle, lineStyle));
    return;
  }

  if (shape instanceof PIXI.Ellipse) {
    const segments = 32;
    const parts: string[] = [];
    const halfW = shape.width / 2;
    const halfH = shape.height / 2;
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 2;
      const lx = shape.x + halfW * Math.cos(t);
      const ly = shape.y + halfH * Math.sin(t);
      const p = transformPoint(wt, lx, ly, pageHeight);
      parts.push(`${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`);
    }
    parts.push('Z');
    page.drawSvgPath(parts.join(' '), styleOpts(fillStyle, lineStyle));
    return;
  }

  if (shape instanceof PIXI.Polygon) {
    const pts = shape.points;
    if (pts.length < 4) return;

    const parts: string[] = [];
    for (let i = 0; i < pts.length; i += 2) {
      const p = transformPoint(wt, pts[i], pts[i + 1], pageHeight);
      parts.push(`${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`);
    }
    if (shape.closeStroke) parts.push('Z');
    const path = parts.join(' ');
    if (!path) return;

    page.drawSvgPath(path, styleOpts(fillStyle, lineStyle));
  }
}

let pdfShapeIdx = 0;

function processGraphics(
  page: any,
  graphics: PIXI.Graphics,
  pageHeight: number,
): void {
  const graphicsData = graphics.geometry.graphicsData;
  const wt = graphics.worldTransform;

  for (const data of graphicsData) {
    const { shape, fillStyle, lineStyle } = data;
    const idx = pdfShapeIdx++;
    const shapeType = shape instanceof PIXI.Rectangle ? 'rect'
      : shape instanceof PIXI.Ellipse ? 'ellipse'
      : shape instanceof PIXI.Polygon ? 'polygon' : 'unknown';
    console.log(
      `%c[PDF] shape #${idx} — ${shapeType}:`,
      'color: #51cf66; font-weight: bold',
      'wt:', {
        a: +wt.a.toFixed(4), b: +wt.b.toFixed(4),
        c: +wt.c.toFixed(4), d: +wt.d.toFixed(4),
        tx: +wt.tx.toFixed(2), ty: +wt.ty.toFixed(2),
      },
    );
    if (shape instanceof PIXI.Rectangle) {
      const x = shape.x, y = shape.y, w = shape.width, h = shape.height;
      const corners = [
        { x: wt.a * x + wt.c * y + wt.tx, y: wt.b * x + wt.d * y + wt.ty },
        { x: wt.a * (x+w) + wt.c * y + wt.tx, y: wt.b * (x+w) + wt.d * y + wt.ty },
        { x: wt.a * (x+w) + wt.c * (y+h) + wt.tx, y: wt.b * (x+w) + wt.d * (y+h) + wt.ty },
        { x: wt.a * x + wt.c * (y+h) + wt.tx, y: wt.b * x + wt.d * (y+h) + wt.ty },
      ];
      console.log(`  local: x=${x}, y=${y}, w=${w}, h=${h}`);
      console.log('  world corners:', corners.map(c => ({ x: +c.x.toFixed(2), y: +c.y.toFixed(2) })));
    } else if (shape instanceof PIXI.Ellipse) {
      const cx = wt.a * shape.x + wt.c * shape.y + wt.tx;
      const cy = wt.b * shape.x + wt.d * shape.y + wt.ty;
      console.log(`  local: cx=${shape.x}, cy=${shape.y}, w=${shape.width}, h=${shape.height}`);
      console.log('  world center:', { x: +cx.toFixed(2), y: +cy.toFixed(2) });
    } else if (shape instanceof PIXI.Polygon) {
      const pts = shape.points;
      const worldPts = [];
      for (let i = 0; i < pts.length; i += 2) {
        worldPts.push({
          x: +(wt.a * pts[i] + wt.c * pts[i+1] + wt.tx).toFixed(2),
          y: +(wt.b * pts[i] + wt.d * pts[i+1] + wt.ty).toFixed(2),
        });
      }
      console.log('  world points:', worldPts);
    }
    drawShape(page, shape, fillStyle, lineStyle, wt, pageHeight);
  }
}

function traverseAndDraw(page: any, container: PIXI.Container, pageHeight: number): void {
  pdfShapeIdx = 0;
  for (const child of container.children) {
    if (child instanceof PIXI.Container && !(child instanceof PIXI.Graphics)) {
      traverseAndDraw(page, child, pageHeight);
      continue;
    }

    if (child instanceof PIXI.Graphics) {
      processGraphics(page, child, pageHeight);
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

  mainContainer.updateTransform();
  traverseAndDraw(page, mainContainer, height);

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
