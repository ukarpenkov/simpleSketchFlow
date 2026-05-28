# Building CanvasKit WASM with PDF Backend

The standard `canvaskit-wasm` npm package (v0.41.x) does **not** include the PDF API (`ck.MakeDocument()`). To get native vector PDF export directly from CanvasKit, you need to compile a custom WASM binary from the Skia source.

## Why This Is Needed

The default build uses `--enable-pdf=false`. The Skia PDF backend adds `SkPDF::MakeDocument()` which CanvasKit can expose as `ck.MakePDFDocument()`.

## Prerequisites

- Python 3.8+
- Git
- Ninja build system (`pip install ninja`)
- Emscripten SDK (emsdk) — required for WASM compilation

## Steps

### 1. Install Emscripten

```bash
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh
```

### 2. Clone Skia

```bash
git clone https://skia.googlesource.com/skia.git
cd skia
python3 tools/git-sync-deps
```

### 3. Configure with PDF enabled

```bash
bin/gn gen out/wasm_pdf --args='
  cc="emcc"
  cxx="em++"
  ar="emar"
  extra_cflags=["-DSKIA_IMPLEMENTATION=1"]
  skia_enable_pdf=true
  skia_enable_skottie=false
  skia_enable_skshaper=false
  skia_enable_tools=false
  skia_enable_gpu=false
  is_official_build=true
  skia_use_icu=false
  skia_use_harfbuzz=false
  skia_use_freetype=false
  skia_use_system_zlib=false
'
```

### 4. Build

```bash
ninja -C out/wasm_pdf canvaskit
```

### 5. Copy WASM binary

The output will be at `out/wasm_pdf/canvaskit.wasm` and `out/wasm_pdf/canvaskit.js`.

Copy to your project:

```bash
cp out/wasm_pdf/canvaskit.wasm public/canvaskit-pdf.wasm
cp out/wasm_pdf/canvaskit.js public/canvaskit-pdf.js
```

### 6. Use in Project

Update `src/skia/index.ts` to load the custom binary:

```ts
ck = await CanvasKitInit({
  locateFile: (file) => `/canvaskit-pdf.${file.split('.').pop()}`
});
```

Then use `ck.MakePDFDocument()` for native vector PDF export.

## Current Approach (No Custom Build)

The project currently uses **pdf-lib** for vector PDF export, which avoids the need for a custom WASM build. Shapes are read from Pixi.js and drawn directly using pdf-lib's `drawSvgPath`, `drawRectangle`, `drawEllipse`, and `drawLine` APIs — all vector, no bitmap embedding.

This custom WASM build is only needed if you want Skia-native PDF rendering (e.g., for text rendering or complex path effects that pdf-lib cannot express).
