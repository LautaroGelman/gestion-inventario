// src/components/pages/SaleFormPage.tsx
'use client';

import { useState, useEffect, FormEvent, useMemo, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getProducts, createSale } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, ShoppingCart, X, PlusCircle, MinusCircle, Barcode, ArrowLeft } from 'lucide-react';

// Interfaces (alineadas al ProductDto del backend)
interface Product {
    id: number;
    code: string;
    name: string;
    price: number;
    quantity: number; // stock actual
}

interface CartItem extends Product {
    cantidad: number;
}

// --- Componente principal del Punto de Venta (POS) ---
export default function SaleFormPage() {
    const { user, isOwner } = useAuth();
    const clientId = user?.clientId;
    const sucursalId = user?.sucursalId ?? null; // 🔹 requerido por multi-sucursal
    const router = useRouter();

    // --- Estados ---
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [codeTerm, setCodeTerm] = useState<string>('');
    const [paymentMethod, setPaymentMethod] = useState<'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA'>('EFECTIVO');
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);

    // --- Carga de datos por CLIENTE + SUCURSAL ---
    useEffect(() => {
        if (!clientId) return;

        // Si es propietario y aún no eligió sucursal, no hacemos fetch
        if (isOwner && (sucursalId == null || sucursalId === '')) {
            setLoading(false);
            setProducts([]);
            return;
        }
        if (sucursalId == null || sucursalId === '') return;

        const fetchProducts = async () => {
            try {
                setLoading(true);
                const res = await getProducts(clientId, sucursalId);
                const data = (res.data as any[]).map((p) => ({
                    id: Number(p.id),
                    name: String(p.name ?? ''),
                    code: String(p.code ?? ''),
                    price: Number(p.price ?? 0),
                    quantity: Number(p.quantity ?? p.stock ?? 0),
                })) as Product[];
                setProducts(data);
                setError('');
            } catch (err) {
                setError('No se pudieron cargar los productos.');
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [clientId, sucursalId, isOwner]);

    // --- Lógica del Carrito ---
    const handleAddToCart = (product: Product) => {
        setCart((prev) => {
            const exist = prev.find((item) => item.id === product.id);
            if (exist) {
                if (exist.cantidad >= product.quantity) return prev; // no exceder stock
                return prev.map((item) => (item.id === product.id ? { ...item, cantidad: item.cantidad + 1 } : item));
            }
            if (product.quantity > 0) {
                return [...prev, { ...product, cantidad: 1 }];
            }
            return prev;
        });
    };

    const handleUpdateQuantity = (productId: number, newQty: number) => {
        const productInCatalog = products.find((p) => p.id === productId);
        if (!productInCatalog) return;
        const clampedQty = Math.max(0, Math.min(newQty, productInCatalog.quantity));
        setCart((prev) =>
          prev
            .map((item) => (item.id === productId ? { ...item, cantidad: clampedQty } : item))
            .filter((item) => item.cantidad > 0)
        );
    };

    const handleCodeScan = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && codeTerm.trim()) {
            e.preventDefault();
            const foundProduct = products.find((p) => p.code === codeTerm.trim());
            if (foundProduct) {
                handleAddToCart(foundProduct);
                setCodeTerm(''); // limpiar para el siguiente escaneo
            } else {
                alert('Producto no encontrado');
            }
        }
    };

    const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.cantidad, 0), [cart]);

    const filteredProducts = useMemo(
      () => products.filter((p) => (p.name ?? '').toLowerCase().includes(searchTerm.toLowerCase())),
      [products, searchTerm]
    );

    // --- Envío del formulario ---
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!clientId || !sucursalId || !user?.employeeId) {
            setError('Error de autenticación o sucursal. No se pudo procesar la venta.');
            return;
        }
        if (cart.length === 0) {
            setError('El carrito está vacío.');
            return;
        }

        const saleData = {
            paymentMethod,
            saleDate: new Date().toISOString().slice(0, 19), // o dejar que el backend asigne
            items: cart.map((item) => ({ productId: item.id, quantity: item.cantidad })),
            // Enviar employeeId si el backend lo requiere
            employeeId: isNaN(Number(user.employeeId)) ? user.employeeId : Number(user.employeeId),
        };

        try {
            await createSale(clientId, sucursalId, saleData); // 🔸 Ruta por sucursal
            alert('Venta registrada con éxito');
            router.push('/panel');
        } catch (err: any) {
            console.error('Error creating sale:', err);
            setError(err?.response?.data?.message || 'Error al registrar la venta.');
        }
    };

    // Guards de contexto
    if (!clientId) {
        return <div className="p-6 text-sm">No se encontró <code>clientId</code> en la sesión.</div>;
    }
    if (isOwner && (sucursalId == null || sucursalId === '')) {
        return (
          <div className="p-6 border rounded-md bg-card/50 text-sm">
              Seleccioná una sucursal en el header para operar el Punto de Venta.
          </div>
        );
    }

    if (loading) return <div className="p-6 text-center">Cargando TPV...</div>;

    return (
      <div className="flex h-screen max-h-screen flex-col p-4 bg-muted/40">
          {/* Encabezado con título y botón de salir */}
          <header className="flex items-center justify-between pb-4 flex-shrink-0">
              <h1 className="text-2xl font-bold">Punto de Venta</h1>
              <Button variant="outline" onClick={() => router.push('/panel')}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver al Panel
              </Button>
          </header>

          {/* Contenido principal del POS */}
          <div className="grid lg:grid-cols-2 gap-6 flex-1 overflow-hidden">
              {/* --- Columna Izquierda: Búsqueda y Lista de Productos --- */}
              <div className="flex flex-col gap-4 h-full min-h-0">
                  <Card>
                      <CardContent className="p-4 grid sm:grid-cols-2 gap-4">
                          <div className="relative">
                              <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                              <Input
                                placeholder="Escanear Código de Barras..."
                                className="pl-10 h-11"
                                value={codeTerm}
                                onChange={(e) => setCodeTerm(e.target.value)}
                                onKeyDown={handleCodeScan}
                              />
                          </div>
                          <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                              <Input
                                placeholder="Buscar por nombre..."
                                className="pl-10 h-11"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                              />
                          </div>
                      </CardContent>
                  </Card>

                  <div className="flex-1 bg-card rounded-xl shadow-sm overflow-hidden border min-h-0">
                      <div className="h-full overflow-y-auto">
                          <Table>
                              <TableHeader className="sticky top-0 bg-muted">
                                  <TableRow>
                                      <TableHead>Producto</TableHead>
                                      <TableHead>Código</TableHead>
                                      <TableHead className="text-right">Precio</TableHead>
                                      <TableHead className="text-center">Stock</TableHead>
                                  </TableRow>
                              </TableHeader>
                              <TableBody>
                                  {filteredProducts.map((product) => (
                                    <TableRow
                                      key={product.id}
                                      onClick={() => handleAddToCart(product)}
                                      className={`cursor-pointer hover:bg-muted ${
                                        product.quantity === 0 ? 'opacity-40 pointer-events-none' : ''
                                      }`}
                                    >
                                        <TableCell className="font-medium">{product.name}</TableCell>
                                        <TableCell className="font-mono text-xs">{product.code}</TableCell>
                                        <TableCell className="text-right">${product.price.toFixed(2)}</TableCell>
                                        <TableCell className="text-center">{product.quantity}</TableCell>
                                    </TableRow>
                                  ))}
                              </TableBody>
                          </Table>
                      </div>
                  </div>
              </div>

              {/* --- Columna Derecha: Venta Actual --- */}
              <form onSubmit={handleSubmit} className="bg-card rounded-xl shadow-lg flex flex-col h-full border">
                  <CardHeader>
                      <CardTitle className="text-2xl">Venta Actual</CardTitle>
                  </CardHeader>
                  <Separator />
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {cart.length === 0 ? (
                        <div className="text-center text-muted-foreground py-10 flex flex-col items-center justify-center h-full">
                            <ShoppingCart className="h-12 w-12 mb-2" />
                            <p>Escanea un producto para comenzar</p>
                        </div>
                      ) : (
                        cart.map((item) => (
                          <div key={item.id} className="flex items-center gap-4 text-sm">
                              <div className="flex-1">
                                  <p className="font-semibold">{item.name}</p>
                                  <p className="text-muted-foreground">
                                      ${item.price.toFixed(2)} x {item.cantidad}
                                  </p>
                              </div>
                              <div className="flex items-center gap-2">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => handleUpdateQuantity(item.id, item.cantidad - 1)}
                                  >
                                      <MinusCircle className="h-4 w-4" />
                                  </Button>
                                  <p className="w-6 text-center font-bold">{item.cantidad}</p>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => handleUpdateQuantity(item.id, item.cantidad + 1)}
                                  >
                                      <PlusCircle className="h-4 w-4" />
                                  </Button>
                              </div>
                              <p className="w-24 text-right font-semibold text-base">
                                  ${(item.price * item.cantidad).toFixed(2)}
                              </p>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive"
                                onClick={() => handleUpdateQuantity(item.id, 0)}
                              >
                                  <X className="h-4 w-4" />
                              </Button>
                          </div>
                        ))
                      )}
                  </div>
                  <Separator />
                  <CardContent className="p-4 space-y-4">
                      <div className="flex justify-between items-center text-2xl font-bold">
                          <span>Total</span>
                          <span>${subtotal.toFixed(2)}</span>
                      </div>
                      {error && <p className="text-sm text-center text-destructive">{error}</p>}
                  </CardContent>
                  <CardFooter className="flex flex-col gap-4 p-4 border-t bg-muted/50">
                      <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as any)}>
                          <SelectTrigger className="h-12">
                              <SelectValue placeholder="Método de pago" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                              <SelectItem value="TARJETA">Tarjeta</SelectItem>
                              <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
                          </SelectContent>
                      </Select>
                      <Button type="submit" className="w-full h-14 text-xl" disabled={cart.length === 0 || loading}>
                          Registrar Venta
                      </Button>
                  </CardFooter>
              </form>
          </div>
      </div>
    );
}
