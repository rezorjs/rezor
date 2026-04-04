import type { AppInstance, PageInstance, ComponentInstance } from './instance'
import { getCurrentInstanceAll } from './instance'
import { getHooksStore, isHookKind } from './store'
import { queueJob } from './scheduler'

export interface Context<T> {
  defaultValue: T
  currentValue: T
  subscribers: Set<Function>
  provider: AppInstance | PageInstance | ComponentInstance | null
}

export function createContext<T>(defaultValue: T): Context<T> {
  return {
    defaultValue,
    currentValue: defaultValue,
    subscribers: new Set(),
    provider: null,
  }
}

function notifyContextSubscribers(context: Context<any>): void {
  context.subscribers.forEach((job) => {
    queueJob(job)
  })
}

export function useContext<T>(context: Context<T>, value: NoInfer<T>): void
export function useContext<T>(context: Context<T>): T
export function useContext<T>(
  context: Context<T>,
  value?: NoInfer<T>,
): T | void {
  const currentInstance = getCurrentInstanceAll()
  if (currentInstance) {
    const store = getHooksStore(currentInstance)
    const index = store.cursor

    if (arguments.length >= 2) {
      // Provider
      if (!isHookKind(store.slots[index], 'context')) {
        // It maybe invalid now, but become valid in a later render.
        // So we need to reserve a slot for it and add cleanup logic.
        store.slots[index] = {
          kind: 'context',
          cleanup: () => {
            if (context.provider === currentInstance) {
              context.provider = null
              if (!Object.is(context.currentValue, context.defaultValue)) {
                context.currentValue = context.defaultValue
                notifyContextSubscribers(context)
              }
            }
          },
        }
      }

      if (context.provider !== null && context.provider !== currentInstance) {
        /* istanbul ignore else -- @preserve  */
        if (__DEV__) {
          console.warn(
            'useContext() does not support multiple providers for the same context at the same time.',
          )
        }

        store.cursor += 1
        return
      }

      context.provider = currentInstance
      if (!Object.is(context.currentValue, value)) {
        context.currentValue = value!
        notifyContextSubscribers(context)
      }

      store.cursor += 1
      return
    }

    // Consumer
    const render = currentInstance.__render__
    if (!isHookKind(store.slots[index], 'context')) {
      store.slots[index] = {
        kind: 'context',
        cleanup() {
          context.subscribers.delete(render)
        },
      }
    }

    context.subscribers.add(render)

    store.cursor += 1
    return context.currentValue
  }

  /* istanbul ignore else -- @preserve  */
  if (__DEV__) {
    console.warn(
      'useContext() hook can only be called during execution of render().',
    )
  }

  return context.currentValue
}
