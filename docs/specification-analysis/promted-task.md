# Разбивка проекта по задачам-промптам

> Каждая задача — отдельный промт для выполнения.
> После выполнения ставится отметка **✅ Выполнено** + сообщение с текстом коммита для пользователя.
> **Правило:** перед выполнением следующего пункта — проверка, что предыдущий отмечен как выполненный. Если нет — не приступать.

---

## Этап 1 — Инициализация проекта

### 1.1 Инициализация проекта (Vite + TypeScript + зависимости)
**Статус:** ✅ Выполнено

**Промт:**
```
Инициализируй проект в текущей директории:
1. npm init -y
2. Установи зависимости: pixi.js@7.2.4-legacy, canvaskit-wasm
3. Установи dev-зависимости: vite, typescript
4. Создай tsconfig.json: strict=true, target=ES2020, module=ESNext, moduleResolution=bundler, esModuleInterop=true
5. Добавь скрипты в package.json: "dev": "vite", "build": "vite build", "preview": "vite preview"
6. Создай vite.config.ts (минимальный конфиг)
7. Создай структуру папок: src/, src/pixi/, src/skia/, src/pdf/, src/ui/, public/
8. Создай src/main.ts с console.log('App started')
9. Создай index.html с <script type="module" src="/src/main.ts"></script>
```
**Критерий:** `npm run dev` запускает dev-сервер, в браузере видно "App started" в консоли.

---

### 1.2 Базовый HTML и UI-каркас
**Статус:** ✅ Выполнено

**Промт:**
```
Создай базовый HTML и UI-каркас:
1. В index.html: два <canvas> с id="pixi-canvas" и id="skia-canvas" (размер 800×600), две кнопки: "Сгенерировать" (id="btn-generate") и "Экспорт PDF" (id="btn-export")
2. src/ui/index.ts — инициализация UI: привязка кнопок к обработчикам (пока заглушки с console.log)
3. src/pixi/index.ts — заглушки: initPixi(canvas: HTMLCanvasElement)
4. src/skia/index.ts — заглушки: initSkia(canvas: HTMLCanvasElement)
5. src/main.ts — импорт и вызов initPixi, initSkia, initUI
```
**Критерий:** Страница открывается, видны оба canvas и обе кнопки, клики по кнопкам пишут в консоль.

---

## Этап 2 — Pixi.js сцена

### 2.1 Инициализация Pixi Application
**Статус:** ✅ Выполнено

**Промт:**
```
Реализуй инициализацию Pixi.js в src/pixi/index.ts:
1. Создай PIXI.Application с forceCanvas=true, background='#1a1a2e', width=800, height=600
2. Привяжи к canvas с id="pixi-canvas"
3. Создай mainContainer как корневой контейнер, добавь на сцену
4. Экспортируй app и mainContainer для использования другими модулями
```
**Критерий:** Canvas отображает пустую Pixi-сцену с тёмным фоном, в консоли нет ошибок.

---

### 2.2 Генератор случайных фигур
**Статус:** ✅ Выполнено

**Промт:**
```
Реализуй генератор случайных фигур в src/pixi/generator.ts:
1. Функция generateRandomShape(container: PIXI.Container) — добавляет случайную фигуру
2. Типы фигур (рандомный выбор): прямоугольник (drawRect), эллипс (drawEllipse), линия (moveTo + lineTo)
3. Случайные параметры: позиция (в пределах 800×600), размер (30-150px), цвет fill/stroke (яркие цвета), толщина линии (1-10)
4. Для линий — только lineStyle без beginFill
5. Каждая фигура — отдельный PIXI.Graphics
6. Подключи к кнопке "Сгенерировать" через src/ui/index.ts
```
**Критерий:** Каждое нажатие кнопки добавляет случайную фигуру на Pixi-сцену.

---

### 2.3 Трансформации и вложенность контейнеров
**Статус:** ✅ Выполнено

**Промт:**
```
Добавь трансформации и вложенность в генератор:
1. Каждой фигуре: position.set(x, y), angle (0-360), scale.set(sx, sy) (0.5-2.0)
2. С вероятностью 30% создавай PIXI.Container с 2-3 фигурами внутри
3. Подконтейнеру тоже задавай position и angle
4. Вложенность: mainContainer → subContainer → Graphics (2 уровня)
```
**Критерий:** Фигуры появляются с разными поворотами и масштабами, некоторые сгруппированы.

---

## Этап 3 — Skia обёртка (ядро задачи)

### 3.1 Загрузка CanvasKit WASM
**Статус:** ✅ Выполнено

**Промт:**
```
Реализуй загрузку CanvasKit WASM в src/skia/index.ts:
1. Импортируй CanvasKitInit из canvaskit-wasm
2. Загрузи WASM: const ck = await CanvasKitInit()
3. Создай surface: ck.MakeCanvasSurface('skia-canvas')
4. Получи skiaCanvas из surface для рисования
5. Экспортируй ck, surface, skiaCanvas
6. Оберни в try-catch с выводом ошибки в консоль
```
**Критерий:** WASM загружается без ошибок, в консоли видно успешную инициализацию.

---

### 3.2 Конвертер: прямоугольники и эллипсы
**Статус:** ✅ Выполнено

**Промт:**
```
Реализуй конвертер src/skia/converter.ts — функцию convertPixiContainerToSkia(ck, canvas, container):
1. Рекурсивно обходи дерево PIXI.Container через children
2. Для каждого PIXI.Graphics извлекай данные из geometry.graphicsData
3. Для drawRect — canvas.drawRect(rect, paint)
4. Для drawEllipse — canvas.drawOval(rect, paint)
5. beginFill(color) → paint.setColor(ck.parseColorString(color)), paint.setStyle(PaintStyle.Fill)
6. endFill() — финализация paint
7. Учитывай worldTransform: canvas.save(), canvas.concat(matrix), рисование, canvas.restore()
```
**Критерий:** Фигуры отображаются на Skia-canvas визуально похоже на Pixi-canvas.

---

### 3.3 Конвертер: линии и lineStyle
**Статус:** ✅ Выполнено

**Промт:**
```
Добавь поддержку линий в src/skia/converter.ts:
1. moveTo + lineTo → ck.Path(), path.moveTo(x,y), path.lineTo(x,y)
2. canvas.drawPath(path, paint)
3. lineStyle(width, color, alpha):
   - paint.setStrokeWidth(width)
   - paint.setColor(ck.parseColorString(color))
   - paint.setAlphaf(alpha)
   - paint.setStyle(PaintStyle.Stroke)
4. Линии — только stroke, без fill
```
**Критерий:** Линии отображаются на Skia-canvas с правильной толщиной и цветом.

---

### 3.4 Конвертер: трансформации (матрицы)
**Статус:** ✅ Выполнено

**Промт:**
```
Реализуй обработку трансформаций в конвертере:
1. Используй PIXI.DisplayObject.worldTransform для получения матрицы
2. Маппинг: a, b, c, d, tx, ty из worldTransform → ck.Matrix(a, b, c, d, tx, ty, 0, 0, 1)
3. Перед рисованием: canvas.save(), canvas.concat(matrix), рисование, canvas.restore()
4. Проверь для: translate, rotate, scale и их комбинаций
```
**Критерий:** Фигуры на Skia-canvas расположены, повёрнуты и масштабированы точно как на Pixi-canvas.

---

### 3.5 Синхронизация рендера (Generate → оба canvas)
**Статус:** ✅ Выполнено

**Промт:**
```
Свяжи генерацию и рендер Skia:
1. После генерации каждой фигуры — вызывай convertPixiContainerToSkia() для перерисовки Skia-canvas
2. renderSkiaScene(): очистка surface.clear() + перерисовка всей сцены
3. Вызывай renderSkiaScene() после каждого добавления фигуры
4. Кнопка "Сгенерировать" → генерация в Pixi + перерисовка Skia
```
**Критерий:** Нажатие "Сгенерировать" обновляет оба canvas синхронно.

---

## Этап 4 — PDF экспорт

### 4.1 Создание Skia PDF Document
**Статус:** ✅ Выполнено

**Промт:**
```
Реализуй PDF-экспорт в src/pdf/index.ts:
1. exportToPDF(ck, mainContainer):
   - ck.MakeDocument() для создания PDF Document
   - document.beginPage(width, height)
   - Получи canvas из страницы
   - convertPixiContainerToSkia(ck, canvas, mainContainer) — отрисовка на PDF-canvas
   - document.endPage()
   - document.close() → Uint8Array
2. Сохрани как Blob, скачай через URL.createObjectURL + <a> click
3. Подключи к кнопке "Экспорт PDF"
```
**Критерий:** Кнопка "Экспорт PDF" скачивает .pdf файл с фигурами.

---

### 4.2 Проверка векторного PDF (не bitmap)
**Статус:** ✅ Выполнено

**Промт:**
```
Убедись что PDF — векторный:
1. В конвертере используются drawRect, drawOval, drawPath — не растровые изображения
2. Открой PDF, увеличи до 500%+ — линии должны быть чёткими
3. Если canvaskit-wasm не поддерживает PDF backend — опиши шаги сборки кастомного WASM в docs/wasm-build.md
4. Добавь комментарий: PIXI.Sprite вставляется как bitmap (это ок по ТЗ)
```
**Критерий:** PDF открывается, при зуме фигуры остаются векторными.

---

## Этап 5 — Интерактивность

### 5.1 События pointerDown / pointerUp в Pixi
**Статус:** ✅ Выполнено

**Промт:**
```
Реализуй события pointer в src/pixi/:
1. Каждой фигуре: eventMode = 'static' (Pixi v7)
2. Обработчики pointerdown и pointerup с console.log (id фигуры + тип события)
3. Визуальный feedback: pointerdown → tint=0xff0000, pointerup → оригинальный tint
```
**Критерий:** Клик по фигуре на Pixi-canvas выводит в консоль и подсвечивает фигуру.

---

### 5.2 Синхронизация событий между canvas
**Статус:** ✅ Выполнено

**Промт:**
```
Синхронизуй события между двумя canvas:
1. На Skia-canvas: addEventListener('pointerdown') и 'pointerup'
2. При клике — вычисли координаты относительно canvas
3. Hit test: проверь попадание в children mainContainer (containsPoint или bounds check)
4. Если попал — вызови обработчик (tint + console.log)
5. Учитывай различия размеров canvas при координатном маппинге
```
**Критерий:** Клик по фигуре на любом canvas срабатывает одинаково.

---

## Этап 6 — UI и финализация

### 6.1 Стилизация UI
**Статус:** ✅ Выполнено

**Промт:**
```
Оформи интерфейс в src/ui/styles.css:
1. Фон страницы — тёмный (#0f0f23)
2. Canvas горизонтально рядом (flex), отступы, тонкая рамка
3. Кнопки стилизованные с hover-эффектами
4. Заголовок "simpleSketchFlow" сверху
5. Подписи: "Pixi.js Canvas" и "Skia Canvas"
6. Адаптивность: при узком экране — canvas друг под другом
```
**Критерий:** Страница выглядит аккуратно, canvas подписаны, кнопки видны.

---

### 6.2 README и инструкция запуска
**Статус:** ✅ Выполнено

**Промт:**
```
Обнови README.md:
1. Название и описание проекта
2. Требования: Node.js 18+
3. Запуск: npm install → npm run dev
4. Описание функционала: генерация фигур, рендер Skia, PDF экспорт, интерактивность
5. Шаги сборки WASM (если нужна кастомная сборка)
6. Структура проекта
7. Технологии: TypeScript, Vite, Pixi.js 7.2.4-legacy, CanvasKit WASM
```
**Критерий:** По README можно запустить проект с нуля.

---

### 6.3 Деплой на GitHub Pages
**Статус:** ⬜ Не выполнено

**Промт:**
```
Настрой деплой на GitHub Pages:

1. vite.config.ts — добавь base: '/simpleSketchFlow/' (имя репозитория)
2. Создай .github/workflows/deploy.yml:
   - Триггер: push на ветку main
   - Jobs:
     a) build: ubuntu-latest, node 18+
        - actions/checkout
        - actions/setup-node
        - npm ci
        - npm run build
        - actions/upload-artifact (dist/)
     b) deploy: needs build, runs-on ubuntu-latest
        - permissions: pages write, id-token write
        - actions/deploy-pages (artifact name: github-pages)
   - Настройки окружения: name: github-pages, url: ${{ steps.deployment.outputs.page_url }}
3. В GitHub репозитории: Settings → Pages → Source = "GitHub Actions"
4. npm run build — убедись что нет ошибок
5. Закоммить и запушь на main
6. Проверь: Actions запустился, деплой прошёл
7. Проверь по ссылке https://<username>.github.io/simpleSketchFlow/:
   - Фигуры генерируются
   - Skia рендерит
   - PDF скачивается
```
**Критерий:** Работающая ссылка на GitHub Pages, приложение полностью функционально.

---

## Сводная таблица

| # | Задача | Статус |
|---|--------|--------|
| 1.1 | Инициализация проекта (Vite + TS + зависимости) | ✅ |
| 1.2 | Базовый HTML и UI-каркас | ✅ |
| 2.1 | Инициализация Pixi Application | ✅ |
| 2.2 | Генератор случайных фигур | ✅ |
| 2.3 | Трансформации и вложенность | ✅ |
| 3.1 | Загрузка CanvasKit WASM | ✅ |
| 3.2 | Конвертер: прямоугольники и эллипсы | ✅ |
| 3.3 | Конвертер: линии и lineStyle | ✅ |
| 3.4 | Конвертер: трансформации (матрицы) | ✅ |
| 3.5 | Синхронизация рендера | ✅ |
| 4.1 | Skia PDF Document | ✅ |
| 4.2 | Векторный PDF (проверка) | ✅ |
| 5.1 | События pointerDown / pointerUp | ✅ |
| 5.2 | Синхронизация событий между canvas | ✅ |
| 6.1 | Стилизация UI | ✅ |
| 6.2 | README и инструкция | ⬜ |
| 6.3 | Деплой на GitHub Pages | ⬜ |

---

## Примечания

- pixi.js строго версии 7.2.4-legacy
- PIXI.Application с forceCanvas=true
- PDF должен быть векторным (не bitmap)
- PIXI.Sprite — как bitmap в PDF (допустимо по ТЗ)
- Кастомная сборка WASM может понадобиться для PDF backend — описать шаги в docs/wasm-build.md
- 4.1: canvaskit-wasm@0.41.x не имеет PDF API (ck.MakeDocument()). Используется pdf-lib: Shapes читаются из Pixi и рисуются через pdf-lib drawSvgPath — результат векторный PDF. Шаги сборки кастомного WASM с PDF backend описаны в docs/wasm-build.md
- Дедлайн: 15 июня
