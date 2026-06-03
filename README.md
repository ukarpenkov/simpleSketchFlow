# simpleSketchFlow

## Попробовать онлайн

**[GH-PAGES](https://ukarpenkov.github.io/simpleSketchFlow/)**

Интерактивное приложение для генерации случайных 2D-фигур с двойным рендерингом через Pixi.js и Skia (CanvasKit WASM) и экспортом в векторный PDF.

## Требования

- Node.js 18+
- npm (входит в состав Node.js)

## Запуск

```bash
npm install
npm run dev
```

Приложение откроется в браузере по адресу `http://localhost:5173`.

### Сборка для продакшена

```bash
npm run build
npm run preview
```

## Функционал

- **Генерация фигур** — случайные прямоугольники, эллипсы и линии с произвольной позицией, поворотом, масштабом и цветом. Поддерживается вложенность (группировка фигур в контейнеры).
- **Двойной рендеринг** — слева canvas на Pixi.js (WebGL), справа canvas на Skia (CanvasKit WASM). Сцена рендерится синхронно в обоих движках.
- **Интерактивность** — клик по фигурам на обоих canvas подсвечивает их красным. Hit-testing на Skia-canvas реализован вручную через рекурсивную проверку bounding box.
- **Экспорт в PDF** — векторный экспорт через pdf-lib. Фигуры конвертируются в SVG-пути и отрисовываются как векторная графика (без растровых вставок).

## Кастомная сборка CanvasKit WASM

По умолчанию используется стандартный `canvaskit-wasm` из npm. Если нужен нативный PDF-экспорт через Skia (например, для рендеринга текста или сложных path-эффектов), можно собрать кастомный WASM с включённым PDF-бэкендом.

См. подробную инструкцию: [docs/wasm-build.md](docs/wasm-build.md)

Кратко:

1. Установить Emscripten SDK
2. Клонировать исходники Skia
3. Собрать с флагом `skia_enable_pdf=true`
4. Скопировать `canvaskit.wasm` в `public/`
5. Обновить `src/skia/index.ts` для загрузки кастомного бинарника

## Структура проекта

```
simpleSketchFlow/
├── index.html              # Точка входа HTML
├── package.json
├── vite.config.ts          # Конфигурация Vite
├── tsconfig.json           # Конфигурация TypeScript
├── docs/
│   ├── specification.md    # Техническое задание
│   └── wasm-build.md       # Инструкция сборки CanvasKit WASM
├── public/                 # Статические файлы
└── src/
    ├── main.ts             # Инициализация приложения
    ├── pixi/
    │   ├── index.ts        # Создание Pixi.js Application
    │   └── generator.ts    # Генератор случайных фигур
    ├── skia/
    │   ├── index.ts        # Инициализация CanvasKit WASM и рендер
    │   ├── converter.ts    # Конвертация Pixi → Skia
    │   └── events.ts       # Hit-testing для Skia-canvas
    ├── pdf/
    │   └── index.ts        # Экспорт в PDF через pdf-lib
    └── ui/
        ├── index.ts        # Привязка кнопок к обработчикам
        └── styles.css      # Стили интерфейса
```

## Технологии

| Технология | Версия | Назначение |
|---|---|---|
| TypeScript | 6.0 | Язык разработки |
| Vite | 6.4 | Сборка и dev-сервер |
| Pixi.js | 7.2.4 | WebGL/Canvas2D рендеринг (левый canvas) |
| CanvasKit WASM | 0.41.1 | Skia рендеринг через WebAssembly (правый canvas) |
| pdf-lib | 1.17 | Векторный экспорт в PDF |
