import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '@/styles/index.css'

import { AppProviders } from '@/app/providers'
import { SessionRestore } from '@/app/sessionRestore'
import { router } from '@/app/router'
import { RouterProvider } from 'react-router-dom'

const container = document.getElementById('root')

if (!container) {
  throw new Error('Root container #root was not found in the document.')
}

createRoot(container).render(
  <StrictMode>
    <AppProviders>
      <SessionRestore />
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
)
