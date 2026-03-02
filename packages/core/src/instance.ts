export type Bindings = Record<string, any> | void

export type AppInstance = Record<string, any>

export let currentApp: AppInstance | null = null

export function setCurrentApp(app: AppInstance): void {
  currentApp = app
}

export function unsetCurrentApp(): void {
  currentApp = null
}
