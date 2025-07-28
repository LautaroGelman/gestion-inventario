"use client";

import React from 'react';

// 1. Definimos las propiedades que el componente aceptará.
interface SectionProps {
    title: string;
    children: React.ReactNode; // 'children' es una propiedad especial para el contenido anidado.
}

// 2. Exportamos el componente corregido.
export function Section({ title, children }: SectionProps) {
    return (
        // Un contenedor simple con un encabezado para el título y un área para el contenido.
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    {title}
                </h1>
            </header>
            <main>{children}</main>
        </div>
    );
}

// 3. (Opcional) Mantenemos una exportación por defecto para compatibilidad.
export default Section;