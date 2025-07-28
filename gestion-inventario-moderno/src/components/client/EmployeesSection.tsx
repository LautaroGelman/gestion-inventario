// src/components/client/EmployeesSection.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
    getEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
} from '@/services/api';

// Importando componentes de UI de shadcn/ui
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, PlusCircle, Trash2, Edit, Eye, EyeOff } from 'lucide-react';

// Interfaces para tipar los datos
interface Employee {
    id: string;
    name: string;
    email: string;
    role: string;
}

interface NewEmployeeForm {
    name: string;
    email: string;
    password: string;
    role: string;
}

interface EditEmployeeForm {
    name: string;
    email: string;
    role: string;
}

// Opciones de roles para los selects
const ROLES = [
    { value: 'ROLE_CAJERO', label: 'Cajero' },
    { value: 'ROLE_INVENTARIO', label: 'Inventario' },
    { value: 'ROLE_VENTAS_INVENTARIO', label: 'Ventas + Inventario' },
    { value: 'ROLE_MULTIFUNCION', label: 'Multifunción' },
];

export default function EmployeesSection() {
    const { user } = useAuth();
    const clientId = user?.clientId;

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [form, setForm] = useState<NewEmployeeForm>({
        name: '',
        email: '',
        password: '',
        role: 'ROLE_CAJERO',
    });
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [editForm, setEditForm] = useState<EditEmployeeForm>({
        name: '',
        email: '',
        role: 'ROLE_CAJERO',
    });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);

    // --- Carga de datos ---
    useEffect(() => {
        if (!clientId) return;
        loadEmployees();
    }, [clientId]);

    const loadEmployees = async () => {
        if (!clientId) return;
        setError('');
        setLoading(true);
        try {
            const res = await getEmployees(clientId);
            setEmployees(res.data as Employee[]);
        } catch (err: any) {
            console.error(err);
            setError('No se pudo cargar la lista de empleados.');
        } finally {
            setLoading(false);
        }
    };

    // --- Handlers para formularios ---
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    const handleSelectChange = (name: keyof NewEmployeeForm) => (value: string) => {
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    const handleEditSelectChange = (name: keyof EditEmployeeForm) => (value: string) => {
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    // --- Lógica de API (CRUD) ---
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!clientId) return;
        setError('');
        try {
            const payload = { ...form, role: form.role.replace(/^ROLE_/, '') };
            await createEmployee(clientId, payload);
            setForm({ name: '', email: '', password: '', role: 'ROLE_CAJERO' });
            setShowPassword(false);
            await loadEmployees();
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Error al crear el empleado.');
        }
    };

    const startEditing = (emp: Employee) => {
        setEditingId(emp.id);
        setEditForm({ name: emp.name, email: emp.email, role: `ROLE_${emp.role}` });
    };

    const cancelEditing = () => setEditingId(null);

    const submitEdit = async (id: string) => {
        if (!clientId) return;
        setError('');
        try {
            const payload = { ...editForm, role: editForm.role.replace(/^ROLE_/, '') };
            await updateEmployee(clientId, id, payload);
            setEditingId(null);
            await loadEmployees();
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Error al editar el empleado.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!clientId || !confirm('¿Estás seguro de que quieres eliminar este empleado?')) return;
        setError('');
        try {
            await deleteEmployee(clientId, id);
            await loadEmployees();
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Error al eliminar el empleado.');
        }
    };

    // Filtra el propio usuario para que no pueda editarse a sí mismo
    const displayedEmployees = employees.filter(e => String(e.id) !== String(user?.employeeId));

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Gestión de Empleados</CardTitle>
                    <CardDescription>Añade, edita o elimina los miembros de tu equipo.</CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="mb-4 flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                            <AlertCircle className="h-4 w-4" />
                            {error}
                        </div>
                    )}
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Rol</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={4} className="h-24 text-center">Cargando empleados...</TableCell></TableRow>
                                ) : displayedEmployees.map(e => (
                                    editingId === e.id ? (
                                        <TableRow key={e.id} className="bg-muted/50">
                                            <TableCell><Input name="name" value={editForm.name} onChange={handleEditChange} placeholder="Nombre" /></TableCell>
                                            <TableCell><Input name="email" value={editForm.email} onChange={handleEditChange} placeholder="Email" /></TableCell>
                                            <TableCell>
                                                <Select value={editForm.role} onValueChange={handleEditSelectChange('role')}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        {ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button size="sm" onClick={() => submitEdit(e.id)}>Guardar</Button>
                                                <Button size="sm" variant="ghost" onClick={cancelEditing}>Cancelar</Button>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        <TableRow key={e.id}>
                                            <TableCell className="font-medium">{e.name}</TableCell>
                                            <TableCell>{e.email}</TableCell>
                                            <TableCell className="capitalize">{e.role.toLowerCase()}</TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button size="icon" variant="outline" onClick={() => startEditing(e)}><Edit className="h-4 w-4" /></Button>
                                                <Button size="icon" variant="destructive" onClick={() => handleDelete(e.id)}><Trash2 className="h-4 w-4" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    )
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Nuevo Empleado</CardTitle>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre</Label>
                                <Input id="name" name="name" value={form.name} onChange={handleChange} placeholder="Ej: Juan Pérez" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Correo electrónico</Label>
                                <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="juan.perez@ejemplo.com" required />
                            </div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">Contraseña</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={form.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        required
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                                        onClick={() => setShowPassword(p => !p)}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role">Rol</Label>
                                <Select value={form.role} onValueChange={handleSelectChange('role')}>
                                    <SelectTrigger id="role">
                                        <SelectValue placeholder="Seleccionar rol" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                        <Button type="submit">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Crear Empleado
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}