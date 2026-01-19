import { createBrowserRouter } from 'react-router-dom'
import { Layout } from './components/layout'
import { Home, Search, India, Learn, EntityDetail, Markets, Dictionary, Translate, Converter } from './pages'

export const router = createBrowserRouter([
    {
        path: '/',
        element: <Layout />,
        children: [
            { index: true, element: <Home /> },
            { path: 'search', element: <Search /> },
            { path: 'india', element: <India /> },
            { path: 'learn', element: <Learn /> },
            { path: 'learn/dictionary', element: <Dictionary /> },
            { path: 'learn/translate', element: <Translate /> },
            { path: 'learn/convert', element: <Converter /> },
            { path: 'markets', element: <Markets /> },
            { path: 'entity/:type/:slug', element: <EntityDetail /> },
        ],
    },
])

