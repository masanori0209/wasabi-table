let initPromise: Promise<void> | null = null;
let initialized = false;

/**
 * Ensures the wasm-bindgen module is loaded and started.
 * With `--target bundler`, importing `wasabi_table.js` initializes WASM as a side effect.
 */
export async function ensureWasmInitialized(): Promise<void> {
  if (initialized) {
    return;
  }
  if (!initPromise) {
    initPromise = import('../pkg/wasabi_table.js').then(() => {
      initialized = true;
    });
  }
  await initPromise;
}

/**
 * Initialize WASM from an already-instantiated WebAssembly exports object.
 * Use this when the host application loads `.wasm` itself (custom CSP, bundler hooks, etc.).
 */
export async function initWasmFromExports(wasmExports: WebAssembly.Exports): Promise<void> {
  const bg = await import('../pkg/wasabi_table_bg.js');
  bg.__wbg_set_wasm(wasmExports);
  const start = (wasmExports as { __wbindgen_start?: () => void }).__wbindgen_start;
  if (typeof start === 'function') {
    start();
  }
  initialized = true;
}
