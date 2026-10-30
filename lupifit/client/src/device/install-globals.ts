/** Side-effect module: the device worker imports it first so `process` and `Buffer` exist before server code runs. */
import { installDeviceGlobals } from './globals';

installDeviceGlobals();
