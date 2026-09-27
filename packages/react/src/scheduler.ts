import { warn } from './utils'

export enum SchedulerJobFlags {
  QUEUED = 1 << 0,
  DISPOSED = 1 << 1,
}

export interface SchedulerJob extends Function {
  order?: number
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

function findInsertionIndex(
  order: number,
  queue: SchedulerJob[],
  start: number,
  end: number,
) {
  while (start < end) {
    const middle = (start + end) >>> 1
    if (queue[middle].order! <= order) {
      start = middle + 1
    } else {
      end = middle
    }
  }
  return start
}

export function queueJob(job: SchedulerJob, order?: number): void {
  if (
    queueJobWorker(
      job,
      order === undefined ? 0 : order,
      jobs,
      jobsLength,
      flushIndex,
    )
  ) {
    jobsLength++
    queueFlush()
  }
}

function queueJobWorker(
  job: SchedulerJob,
  order: number,
  queue: SchedulerJob[],
  length: number,
  index: number,
) {
  const flags = job.flags!
  if (!(flags & SchedulerJobFlags.QUEUED)) {
    job.flags = flags | SchedulerJobFlags.QUEUED
    job.order = order
    if (
      index === length ||
      // fast path when the job order is larger than the tail
      order >= queue[length - 1].order!
    ) {
      queue[length] = job
    } else {
      queue.splice(findInsertionIndex(order, queue, index, length), 0, job)
    }
    return true
  }
  return false
}

function doFlushJobs() {
  try {
    flushJobs()
  } catch (error) {
    currentFlushPromise = null
    // If a nested post flush throws after queueing more work, defer the
    // leftovers to a fresh microtask.
    if (jobsLength || postJobs.length) {
      queueFlush()
    }
    throw error
  }
}

function queueFlush() {
  if (!currentFlushPromise) {
    currentFlushPromise = resolvedPromise.then(doFlushJobs)
  }
}

export function queuePostFlushCb(job: SchedulerJob): void {
  queueJobWorker(job, 0, postJobs, postJobs.length, 0)
  queueFlush()
}

// Post jobs are only queued by useEffect(), and each one is a freshly created
// function queued exactly once. So the recursion check would never fire and the
// QUEUED flag never needs clearing — meaning a post job runs at most once in its
// lifetime. Don't queue a reused job object here.
function flushPostFlushCbs(): void {
  if (postJobs.length) {
    activePostJobs = postJobs
    postJobs = []

    try {
      while (postFlushIndex < activePostJobs.length) {
        const cb = activePostJobs[postFlushIndex++]
        if (!(cb.flags! & SchedulerJobFlags.DISPOSED)) {
          cb()
        }
      }
    } finally {
      activePostJobs = null
      postFlushIndex = 0
    }
  }
}

function flushJobs(seen?: CountMap) {
  /* istanbul ignore else -- @preserve */
  if (__DEV__) {
    seen ||= new Map()
  }

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
    jobs.length = 0

    flushPostFlushCbs()

    // If new jobs have been added to either queue, keep flushing.
    // An effect can call `context.triggerEvent()`, whose native handler calls
    // `setData` and synchronously mounts another Rezor component, the child's
    // initial render may queues its effect. In these cases, `postJobs` is not
    // empty.
    if (jobsLength || postJobs.length) {
      flushJobs(seen)
    } else {
      currentFlushPromise = null
    }
  }
}

function checkRecursiveUpdates(seen: CountMap, fn: SchedulerJob) {
  const count = seen.get(fn) || 0
  /* istanbul ignore if -- @preserve */
  if (count > RECURSION_LIMIT) {
    warn(
      `Maximum recursive updates exceeded. ` +
        `This usually means a state update is being triggered inside render() or useEffect(), ` +
        `causing an infinite loop.`,
    )
    return true
  }

  seen.set(fn, count + 1)
  return false
}
