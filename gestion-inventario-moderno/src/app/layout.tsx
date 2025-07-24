// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';
import './globals.css'; // <--- ESTA LÍNEA ES LA MÁS IMPORTANTE

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Sistema POS - Gestión Empresarial',
    description: 'Sistema de gestión de inventario y punto de venta.',
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es">
        <body className={inter.className}>
        <AuthProvider>
            {children}
        </AuthProvider>
        </body>
        </html>
    );
}