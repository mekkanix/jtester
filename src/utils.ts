// Numbers

const S_DIVIDER = 1000
const MN_DIVIDER = 60000
const HR_DIVIDER = 3600000

export const d = (millis: number) => {
  if (millis < S_DIVIDER) return `${millis}ms`
  if (millis < MN_DIVIDER) return `${millis / S_DIVIDER}s`
  if (millis < HR_DIVIDER) {
    const mn: number = Math.trunc(millis / MN_DIVIDER)
    const remainingS = millis % MN_DIVIDER
    const s: number = remainingS / S_DIVIDER
    return `${mn}mn ${s}s`
  }
  const hr: number = Math.trunc(millis / HR_DIVIDER)
  const remainingMn = millis % HR_DIVIDER
  const mn: number = Math.trunc(remainingMn / MN_DIVIDER)
  const remainingS = remainingMn % MN_DIVIDER
  const s: number = remainingS / S_DIVIDER
  return `${hr}hr ${mn}mn ${s}s`
}

const size = (nb: number) => {
  const units = ['kB', 'MB', 'GB']
  return units.reduce(
    (s, unit) => {
      if (s.value / 1024 >= 1) {
        s.value = s.value / 1024
        s.unit = unit
      }
      return s
    },
    { value: nb, unit: 'B' },
  )
}

// System

type XPerformance = Performance & {
  memory: {
    jsHeapSizeLimit: number
  }
}
type HWDetails = {
  os: string
  architecture: string
  cpus: number | string
  memory: string
}
const SYS_MODE_WEBBROWSER = 'wb'
const SYS_MODE_NODEJS = 'njs'
const SYS_MODE_UNKNOWN = 'unknown'

export const getRunningMode = (): string => {
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined')
    return SYS_MODE_WEBBROWSER
  if (typeof process !== 'undefined') return SYS_MODE_NODEJS
  return SYS_MODE_UNKNOWN
}

const getNodeOS = () => require('node:os')

const detectOS = (): string => {
  if (getRunningMode() === SYS_MODE_WEBBROWSER && globalThis.navigator)
    return [
      ...globalThis.navigator.userAgent.matchAll(
        /(windows|mac(intosh)?|ubuntu|debian|linux)/gi,
      ),
    ][0][0]
  if (getRunningMode() === SYS_MODE_NODEJS) {
    const os = process.platform
    return os.charAt(0).toUpperCase() + os.substring(1)
  }
}

const detectArchitecture = () => {
  if (getRunningMode() === SYS_MODE_WEBBROWSER && globalThis.navigator) {
    const raw = [...navigator.userAgent.matchAll(/(x32|x64|x86_64)/gi)][0][0]
    return ['x64', 'x86_64'].includes(raw) ? '64-bit' : '32-bit'
  }
  if (getRunningMode() === SYS_MODE_NODEJS && process)
    return ['x64', 'x86_64'].includes(process.arch) ? '64-bit' : '32-bit'
}

export const getHardwareDetails = (): HWDetails => {
  const details = {
    os: detectOS(),
    architecture: detectArchitecture(),
    cpus: undefined,
    memory: undefined,
  }
  if (getRunningMode() === SYS_MODE_WEBBROWSER && globalThis.navigator) {
    details.cpus = navigator.hardwareConcurrency || undefined
    const memory = (performance as XPerformance).memory
      ? size((performance as XPerformance).memory?.jsHeapSizeLimit)
      : undefined
    details.memory = memory
      ? `${memory.value.toFixed(2)} ${memory.unit} (allocated)`
      : undefined
  }
  if (getRunningMode() === SYS_MODE_NODEJS) {
    const os = getNodeOS()
    const memory = size(os.totalmem())
    details.cpus = os.cpus().length
    details.memory = `${memory.value.toFixed(2)} ${memory.unit} (total)`
  }
  return Object.entries(details).reduce((d, [name, value]) => {
    if (value === undefined) value = '-'
    d[name] = value
    return d
  }, details)
}
