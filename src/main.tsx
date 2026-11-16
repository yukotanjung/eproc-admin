import React from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/roboto-mono/400.css'
import '@fontsource/roboto-mono/500.css'
import './index.css'
import { ToastProvider } from '~/components/ui'
import { TanStackQueryProvider } from '~/integrations/tanstack-query/root-provider'
import { router } from './router'

const rootElement = document.getElementById('root')

if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <TanStackQueryProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </TanStackQueryProvider>
    </React.StrictMode>,
  )
}
