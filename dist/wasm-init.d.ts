/**
 * Ensures the wasm-bindgen module is loaded and started.
 * With `--target bundler`, importing `wasabi_table.js` initializes WASM as a side effect.
 */
export declare function ensureWasmInitialized(): Promise<void>;
/**
 * Initialize WASM from an already-instantiated WebAssembly exports object.
 * Use this when the host application loads `.wasm` itself (custom CSP, bundler hooks, etc.).
 */
export declare function initWasmFromExports(wasmExports: WebAssembly.Exports): Promise<void>;
