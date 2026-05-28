import { PDFDocument } from 'pdf-lib';
import { ck } from '../skia';
import { convertPixiContainerToSkia } from '../skia/converter';
import type { Container } from 'pixi.js';

export async function exportToPDF(
  mainContainer: Container,
  width = 800,
  height = 600,
): Promise<void> {
  const surface = ck.MakeSurface(width, height);
  if (!surface) {
    throw new Error('Failed to create offscreen Skia surface');
  }

  const canvas = surface.getCanvas();
  canvas.clear(ck.WHITE);
  convertPixiContainerToSkia(ck, canvas, mainContainer);

  const image = surface.makeImageSnapshot();
  const pngBytes = image.encodeToBytes();
  if (!pngBytes) {
    surface.delete();
    image.delete();
    throw new Error('Failed to encode Skia image to PNG');
  }

  surface.delete();
  image.delete();

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([width, height]);
  const pngImage = await pdfDoc.embedPng(pngBytes);
  page.drawImage(pngImage, { x: 0, y: 0, width, height });

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
