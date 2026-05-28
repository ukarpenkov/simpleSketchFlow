import { PDFDocument, rgb } from 'pdf-lib';
import * as PIXI from 'pixi.js';
import type { Container } from 'pixi.js';

/**
 * PIXI.Shape → SVG path string.
 * Coordinates are already in absolute (world-transformed) space.
 *
 * NOTE: PIXI.Sprite is not handled here — it would be embedded as a bitmap
 * in the PDF (acceptable per specification).
 */
function shapeToSvgPath(shape: PIXI.IShape, transform: PIXI.Matrix): string {
  if (shape instanceof PIXI.Rectangle) {
    const x = shape.x;
    const y = shape.y;
    const w = shape.width;
    const h = shape.height;

    const corners = [
      { x: x, y: y },
      { x: x + w, y: y },
      { x: x + w, y: y + h },
      { x: x, y: y + h },
    ];

    const tc = corners.map((c) => ({
      x: transform.a * c.x + transform.c * c.y + transform.tx,
      y: transform.b * c.x + transform.d * c.y + transform.ty,
    }));

    return (
      `M ${tc[0].x} ${tc[0].y} ` +
      `L ${tc[1].x} ${tc[1].y} ` +
      `L ${tc[2].x} ${tc[2].y} ` +
      `L ${tc[3].x} ${tc[3].y} Z`
    );
  }

  if (shape instanceof PIXI.Ellipse) {
    const cx = shape.x;
    const cy = shape.y;
    const sx = shape.width;
    const sy = shape.height;

    const tcx = transform.a * cx + transform.c * cy + transform.tx;
    const tcy = transform.b * cx + transform.d * cy + transform.ty;

    const basex = { x: transform.a * sx, y: transform.b * sx };
    const basey = { x: transform.c * sy, y: transform.d * sy };

    const rx = Math.sqrt(basex.x * basex.x + basex.y * basex.y);
    const ry = Math.sqrt(basey.x * basey.x + basey.y * basey.y);
    const rotation = (Math.atan2(basex.y, basex.x) * 180) / Math.PI;

    if (rx < 0.01 || ry < 0.01) return '';

    const left = `M ${tcx - rx} ${tcy}`;
    const top = `A ${rx} ${ry} ${rotation} 0 1 ${tcx} ${tcy - ry}`;
    const bottom = `A ${rx} ${ry} ${rotation} 0 1 ${tcx} ${tcy + ry}`;

    return `${left} ${top} ${bottom} Z`;
  }

  if (shape instanceof PIXI.Polygon) {
    const pts = shape.points;
    if (pts.length < 4) return '';

    const parts: string[] = [];
    for (let i = 0; i < pts.length; i += 2) {
      const x = transform.a * pts[i] + transform.c * pts[i + 1] + transform.tx;
      const y = transform.b * pts[i] + transform.d * pts[i + 1] + transform.ty;
      parts.push(`${i === 0 ? 'M' : 'L'} ${x} ${y}`);
    }
    if (shape.closeStroke) parts.push('Z');
    return parts.join(' ');
  }

  return '';
}

function colorToRgb(color: number): [number, number, number] {
  return [
    ((color >> 16) & 0xff) / 255,
    ((color >> 8) & 0xff) / 255,
    (color & 0xff) / 255,
  ];
}

function processGraphics(
  page: any,
  graphics: PIXI.Graphics,
): void {
  const graphicsData = graphics.geometry.graphicsData;
  const wt = graphics.worldTransform;

  for (const data of graphicsData) {
    const { shape, fillStyle, lineStyle } = data;

    const path = shapeToSvgPath(shape, wt);
    if (!path) continue;

    if (fillStyle && fillStyle.visible !== false) {
      const [r, g, b] = colorToRgb(fillStyle.color);
      const opacity = fillStyle.alpha ?? 1;
      page.drawSvgPath(path, {
        color: rgb(r, g, b),
        opacity,
      });
    }

    if (lineStyle && lineStyle.visible !== false && lineStyle.width > 0) {
      const [r, g, b] = colorToRgb(lineStyle.color);
      const opacity = lineStyle.alpha ?? 1;
      page.drawSvgPath(path, {
        borderColor: rgb(r, g, b),
        borderWidth: lineStyle.width,
        opacity,
      });
    }
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
    // PIXI.Sprite would be embedded as bitmap (acceptable per spec).
    // Not implemented here — skipping non-Graphics children.
  }
}

/**
 * Export Pixi scene to a vector PDF.
 * Uses pdf-lib native drawing API (drawSvgPath) instead of bitmap embedding.
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
