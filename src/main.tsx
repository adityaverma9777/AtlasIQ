import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { UserProvider } from './hooks'
import { startScheduler } from './lib/scheduler'
import { registerScheduledTasks } from './lib/tasks'
import './styles/index.css'

// start autonomous background tasks
registerScheduledTasks()
startScheduler()

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <UserProvider>
            <RouterProvider router={router} />
        </UserProvider>
    </StrictMode>,
)

