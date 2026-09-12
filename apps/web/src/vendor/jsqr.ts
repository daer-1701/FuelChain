/**
 * jsQR 1.4.0 (MIT) — vendored para decodificar QR sin BarcodeDetector
 * (Firefox, Safari, etc.). Fuente: https://github.com/cozmo/jsQR
 */
import * as JsQrModule from './jsQR.js';

export type QRCode = {
  data: string;
  location: unknown;
};

type JsQrFn = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  options?: {
    inversionAttempts?:
      | 'dontInvert'
      | 'onlyInvert'
      | 'attemptBoth'
      | 'invertFirst';
  },
) => QRCode | null;

const mod = JsQrModule as unknown as { default?: JsQrFn } & JsQrFn;
const jsQR: JsQrFn = typeof mod === 'function' ? mod : (mod.default as JsQrFn);

export default jsQR;
