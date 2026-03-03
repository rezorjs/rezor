import { currentApp } from './instance'
import { toHiddenField } from './utils'

export function useRef<T>(initialValue: T): { current: T } {
  const currentInstance = currentApp
  if (currentInstance) {
    const field = toHiddenField('ref')
    if (currentInstance[field] === undefined) {
      currentInstance[field] = []
      currentInstance[field].index = 0
    }

    const ref = currentInstance[field]
    const index = ref.index
    if (ref[index] === undefined) {
      ref[index] = { current: initialValue }
    }

    ref.index += 1
    return ref[index]
  }

  if (__DEV__) {
    console.warn(
      'useRef() hook can only be called during execution of render().',
    )
  }

  return { current: initialValue }
}
