import { createBrowserRouter } from 'react-router-dom'
import { Layout } from './components/layout'
import { Home, Search, India, Learn, EntityDetail, Markets } from './pages'

export const router = createBrowserRouter([
    {
        path: '/',
        element: <Layout />,
        children: [
            { index: true, element: <Home /> },
            { path: 'search', element: <Search /> },
            { path: 'india', element: <India /> },
            { path: 'learn', element: <Learn /> },
            { path: 'markets', element: <Markets /> },
            { path: 'entity/:type/:slug', element: <EntityDetail /> },
        ],
    },
])
