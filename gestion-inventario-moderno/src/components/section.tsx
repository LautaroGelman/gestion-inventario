"use client";

import { useState, useEffect } from "react";
import {
    SidebarProvider,
    Sidebar,
    SidebarHeader,
    SidebarContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarFooter,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
    Sheet,
    SheetTrigger,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

export function Section() {
    // Simulamos estado de carga y de detalles
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<string | null>(null);

    useEffect(() => {
        // simulamos fetch
        const t = setTimeout(() => setLoading(false), 1500);
        return () => clearTimeout(t);
    }, []);

    return (
        <SidebarProvider>
            <div className="flex h-screen bg-background">
                {/* SIDEBAR LATERAL */}
                <Sidebar>
                    <SidebarHeader>
                        <h1 className="text-xl font-bold">Gestión Inventario</h1>
                    </SidebarHeader>
                    <SidebarContent>
                        <SidebarMenu>
                            <SidebarMenuItem>Dashboard</SidebarMenuItem>
                            <SidebarMenuItem>Productos</SidebarMenuItem>
                            <SidebarMenuItem>Categorías</SidebarMenuItem>
                            <SidebarMenuItem>Usuarios</SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarContent>
                    <SidebarFooter>
                        <Button variant="ghost" onClick={() => {/* cerrar sesión */}}>Cerrar sesión</Button>
                    </SidebarFooter>
                    <SidebarTrigger>
                        <Button size="icon" variant="ghost">☰</Button>
                    </SidebarTrigger>
                </Sidebar>

                {/* CONTENIDO PRINCIPAL */}
                <main className="flex-1 p-6 overflow-auto">
                    {/* Buscador */}
                    <div className="mb-4 flex items-center gap-2">
                        <Input placeholder="Buscar productos…" />
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button size="icon" variant="outline">🔍</Button>
                            </TooltipTrigger>
                            <TooltipContent>Buscar</TooltipContent>
                        </Tooltip>
                    </div>

                    <Separator className="mb-6" />

                    {/* Estado de carga */}
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(6)].map((_, i) => (
                                <Skeleton key={i} className="h-32 rounded-lg" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {["Manzanas", "Naranjas", "Plátanos"].map((item) => (
                                <Card key={item} onClick={() => setSelectedItem(item)}>
                                    <CardHeader>
                                        <CardTitle>{item}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex justify-between items-center">
                                        <p>Stock: 42</p>
                                        <Sheet>
                                            <SheetTrigger asChild>
                                                <Button size="sm">Detalles</Button>
                                            </SheetTrigger>
                                            <SheetContent side="right">
                                                <SheetHeader>
                                                    <SheetTitle>Detalle de {item}</SheetTitle>
                                                </SheetHeader>
                                                <p>Aquí irá un formulario o datos ampliados sobre {item}.</p>
                                            </SheetContent>
                                        </Sheet>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </SidebarProvider>
    );
}
