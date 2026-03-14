export enum SchedulerJobFlags {
  QUEUED = 1 << 0,
  DISPOSED = 1 << 1,
}

export interface SchedulerJob extends Function {
  /**
   * Flags can technically be undefined, but it can still be used in bitwise
   * operations just like 0.
   */
  flags?: SchedulerJobFlags
}

const jobs: SchedulerJob[] = []

let postJobs: SchedulerJob[] = []
let activePostJobs: SchedulerJob[] | null = null
let currentFlushPromise: Promise<void> | null = null
let jobsLength = 0
let flushIndex = 0
let postFlushIndex = 0

const resolvedPromise = /*@__PURE__*/ Promise.resolve()
const RECURSION_LIMIT = 100

type CountMap = Map<SchedulerJob, number>

export function nextTick(): Promise<void>
export function nextTick<R>(fn: () => R | Promise<R>): Promise<R>
export function nextTick<R>(fn?: () => R | Promise<R>): Promise<void | R> {
  const p = currentFlushPromise || resolvedPromise
  return fn ? p.then(fn) : p
}

export function queueJob(job: SchedulerJob): void {
  if (queueJobWorker(job, jobs, jobsLength)) {
    jobsLength++
    queueFlush()
  }
}

function queueJobWorker(
  job: SchedulerJob,
  queue: SchedulerJob[],
  length: number,
) {
  const flags = job.flags!
  if (!(flags & SchedulerJobFlags.QUEUED)) {
    job.flags = flags | SchedulerJobFlags.QUEUED
    queue[length] = job
    return true
  }
  return false
}

function queueFlush() {
  if (!currentFlushPromise) {
    // We don't flush post jobs on flushJobs's finally block, so we don't need `doFlushJobs` here.
    currentFlushPromise = resolvedPromise.then(flushJobs)
  }
}

export function queuePostFlushCb(job: SchedulerJob): void {
  queueJobWorker(job, postJobs, postJobs.length)
}

export function flushPostFlushCbs(): void {
  if (postJobs.length) {
    activePostJobs = postJobs
    postJobs = []

    try {
      while (postFlushIndex < activePostJobs.length) {
        const cb = activePostJobs[postFlushIndex++]
        if (!(cb.flags! & SchedulerJobFlags.DISPOSED)) {
          cb.flags! &= ~SchedulerJobFlags.QUEUED
          cb()
        }
      }
    } finally {
      // If there was an error we still need to clear the QUEUED flags
      while (postFlushIndex < activePostJobs.length) {
        activePostJobs[postFlushIndex++].flags! &= ~SchedulerJobFlags.QUEUED
      }

      activePostJobs = null
      postFlushIndex = 0
    }
  }
}

function flushJobs() {
  const seen: CountMap | undefined =
    __DEV__ ? new Map() : /* istanbul ignore next -- @preserve  */ undefined

  try {
    while (flushIndex < jobsLength) {
      const job = jobs[flushIndex]
      jobs[flushIndex++] = undefined as any

      if (!(job.flags! & SchedulerJobFlags.DISPOSED)) {
        // Conditional usage of checkRecursiveUpdate must be determined out of
        // try ... catch block since Rollup by default de-optimizes treeshaking
        // inside try-catch. This can leave all warning code unshaked. Although
        // they would get eventually shaken by a minifier like terser, some minifiers
        // would fail to do that (e.g. https://github.com/evanw/esbuild/issues/1610)
        /* istanbul ignore if -- @preserve  */
        if (__DEV__ && checkRecursiveUpdates(seen!, job)) {
          continue
        }
        job.flags! &= ~SchedulerJobFlags.QUEUED
        job()
      }
    }
  } finally {
    // If there was an error we still need to clear the QUEUED flags
    while (flushIndex < jobsLength) {
      jobs[flushIndex].flags! &= ~SchedulerJobFlags.QUEUED
      jobs[flushIndex++] = undefined as any
    }

    flushIndex = 0
    jobsLength = 0

    currentFlushPromise = null
  }
}

function checkRecursiveUpdates(seen: CountMap, fn: SchedulerJob) {
  const count = seen.get(fn) || 0
  /* istanbul ignore if -- @preserve */
  if (count > RECURSION_LIMIT) {
    console.warn(
      `Maximum recursive updates exceeded. ` +
        `This usually means a state update is being triggered inside render(), ` +
        `causing an infinite loop.`,
    )
    return true
  }

  seen.set(fn, count + 1)
  return false
}
