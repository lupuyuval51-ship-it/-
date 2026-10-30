/**
 * `helmet` for device mode: a pass-through middleware. Security headers protect HTML documents served
 * by a web server; in device mode the API answers the app's own code inside a Web Worker and nothing
 * it returns is rendered as a page, so there is nothing for them to do. The app's HTML gets its CSP
 * from the device build itself.
 */
type Next = (err?: unknown) => void;

export default function helmet(_options?: unknown) {
  return function helmetPassThrough(_req: unknown, _res: unknown, next: Next) {
    next();
  };
}
