import { currentApp, getHooksStore, isHookKind } from './instance'

export function useEffectEvent<T extends (...args: any[]) => any>(
  callback: T,
): T {
  const currentInstance = currentApp
  if (currentInstance) {
    const store = getHooksStore(currentInstance)
    const index = store.cursor
    let effectEventSlot = store.slots[index]
    if (!isHookKind(effectEventSlot, 'effectEvent')) {
      effectEventSlot = { kind: 'effectEvent', fn: callback }
      store.slots[index] = effectEventSlot
    } else {
      effectEventSlot.fn = callback
    }

    store.cursor += 1
    return ((...args: any[]) => effectEventSlot.fn(...args)) as T
  }

  if (__DEV__) {
    console.warn(
      'useEffectEvent() hook can only be called during execution of render().',
    )
  }

  return callback
}
