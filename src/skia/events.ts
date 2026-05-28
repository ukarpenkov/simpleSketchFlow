import type { Container, DisplayObject, Graphics } from 'pixi.js';

function canvasToLocal(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}

function hitTestGraphics(point: { x: number; y: number }, obj: Graphics): boolean {
  const bounds = obj.getBounds();
  return (
    point.x >= bounds.x &&
    point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y <= bounds.y + bounds.height
  );
}

function hitTestRecursive(
  point: { x: number; y: number },
  container: Container,
): Graphics | null {
  const children = container.children;
  for (let i = children.length - 1; i >= 0; i--) {
    const child = children[i] as DisplayObject;
    if (!child.visible) continue;

    if ((child as Container).children?.length) {
      const hit = hitTestRecursive(point, child as Container);
      if (hit) return hit;
    }

    if ((child as Graphics).geometry) {
      if (hitTestGraphics(point, child as Graphics)) {
        return child as Graphics;
      }
    }
  }
  return null;
}

export function setupSkiaEvents(
  canvas: HTMLCanvasElement,
  container: Container,
): void {
  canvas.addEventListener('pointerdown', (e: PointerEvent) => {
    const point = canvasToLocal(canvas, e.clientX, e.clientY);
    const hit = hitTestRecursive(point, container);
    if (hit) {
      const name = hit.name || '(unnamed)';
      console.log(`[Skia] ${name} pointerdown`);
      hit.tint = 0xff0000;
    }
  });

  canvas.addEventListener('pointerup', (e: PointerEvent) => {
    const point = canvasToLocal(canvas, e.clientX, e.clientY);
    const hit = hitTestRecursive(point, container);
    if (hit) {
      const name = hit.name || '(unnamed)';
      console.log(`[Skia] ${name} pointerup`);
      hit.tint = 0xffffff;
    }
  });
}
