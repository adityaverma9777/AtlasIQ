// background scheduler for autonomous refresh

const STORAGE_KEY = 'atlasiq_scheduler'

interface TaskRecord {
    lastRun: number
    status: 'ok' | 'error'
}

interface SchedulerState {
    tasks: Record<string, TaskRecord>
}

interface ScheduledTask {
    name: string
    intervalMs: number
    run: () => Promise<void>
}

// registered tasks
const tasks: ScheduledTask[] = []

// get scheduler state from localStorage
function getState(): SchedulerState {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) return JSON.parse(stored)
    } catch { /* ignore */ }
    return { tasks: {} }
}

// save scheduler state
function saveState(state: SchedulerState): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch { /* ignore */ }
}

// check if task is due
function isDue(task: ScheduledTask, state: SchedulerState): boolean {
    const record = state.tasks[task.name]
    if (!record) return true
    const elapsed = Date.now() - record.lastRun
    return elapsed >= task.intervalMs
}

// run a single task safely
async function runTask(task: ScheduledTask, state: SchedulerState): Promise<void> {
    try {
        await task.run()
        state.tasks[task.name] = { lastRun: Date.now(), status: 'ok' }
    } catch {
        // keep last valid data, mark error
        if (!state.tasks[task.name]) {
            state.tasks[task.name] = { lastRun: Date.now(), status: 'error' }
        } else {
            state.tasks[task.name].status = 'error'
        }
    }
    saveState(state)
}

// check and run due tasks
async function runDueTasks(): Promise<void> {
    const state = getState()

    for (const task of tasks) {
        if (isDue(task, state)) {
            await runTask(task, state)
        }
    }
}

// register a task
export function registerTask(name: string, intervalMs: number, run: () => Promise<void>): void {
    tasks.push({ name, intervalMs, run })
}

// start scheduler - run immediately and set interval
let schedulerStarted = false

export function startScheduler(): void {
    if (schedulerStarted) return
    schedulerStarted = true

    // run on start (deferred)
    setTimeout(() => {
        runDueTasks()
    }, 2000)

    // check every 5 minutes
    setInterval(() => {
        runDueTasks()
    }, 5 * 60 * 1000)
}

// get last run time for a task
export function getLastRun(taskName: string): Date | null {
    const state = getState()
    const record = state.tasks[taskName]
    if (record) return new Date(record.lastRun)
    return null
}

// 24 hours in ms
export const INTERVAL_24H = 24 * 60 * 60 * 1000

