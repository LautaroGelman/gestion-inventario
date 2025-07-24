// src/components/ThemeProvider.tsx
'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

// No necesitamos importar el tipo "ThemeProviderProps" de forma explícita.
// TypeScript lo inferirá correctamente del componente.
export function ThemeProvider({ children, ...props }: { children: React.ReactNode; [key: string]: any }) {
    return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}