// Typed usage compiled under tsc (typecheck:tests). No runtime.
import { createExpoDeviceInfoAdapter, getPlatformInfo, usePlatformInfo } from "../../../src/native/device/index.js";
import type { DeviceInfoAdapter, PlatformInfo } from "../../../src/native/device/index.js";

const adapter: DeviceInfoAdapter = createExpoDeviceInfoAdapter({ device: { isDevice: true }, constants: {} });
const info: PlatformInfo = getPlatformInfo(adapter);
const emulator: boolean | null = info.isEmulator;
const expoGo: boolean | null = info.isExpoGo;
const tablet: boolean = info.isTablet;
export { emulator, expoGo, tablet, usePlatformInfo };
