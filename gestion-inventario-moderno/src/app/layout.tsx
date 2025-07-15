// src/app/layout.tsx
import { ReactNode } from 'react'
import { AuthProvider } from '@/context/AuthContext'

export const metadata = {
    title: 'Mi App',
}

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="es">
        <body>
        <AuthProvider>
            {children}
        </AuthProvider>
        </body>
        </html>
    )
}
