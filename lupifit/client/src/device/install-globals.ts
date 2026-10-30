/**
 * Side-effect module: the device worker imports it first, so that `process` and `Buffer` exist before
 * server code runs, and the worker's network policy (./network-guard.ts: only this app and Open Food
 * Facts) is in place before any server module or library can make a request.
 */
import { installDeviceGlobals } from './globals';
import { installNetworkGuard } from './network-guard';

installDeviceGlobals();
installNetworkGuard();
