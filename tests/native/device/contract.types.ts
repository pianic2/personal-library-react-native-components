// Typed usage compiled under tsc (typecheck:tests). No runtime.
import { createExpoDeviceInfoAdapter, getPlatformInfo, usePlatformInfo } from "../../../src/native/device/index.js";
import type { DeviceInfoAdapter, PlatformInfo } from "../../../src/native/device/index.js";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Assert<T extends true> = T;
export type _Checks = [
  Assert<Equal<PlatformInfo["isEmulator"], boolean | null>>,
  Assert<Equal<PlatformInfo["isExpoGo"], boolean | null>>,
  Assert<Equal<PlatformInfo["hasNotch"], boolean | null>>,
  Assert<Equal<PlatformInfo["isTablet"], boolean>>,
  Assert<Equal<PlatformInfo["isWeb"], boolean>>,
  Assert<Equal<PlatformInfo["osVersion"], string | null>>,
];

const adapter: DeviceInfoAdapter = createExpoDeviceInfoAdapter({ device: { isDevice: true }, constants: {} });
const info: PlatformInfo = getPlatformInfo(adapter);
export { info, usePlatformInfo };
