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

    useEffect(() => {
        if (!clientId) return;
        loadEmployees();
    }, [clientId]);

    const loadEmployees = async () => {
        setError('');
        try {
            const res = await getEmployees(clientId!);
            setEmployees(res.data as Employee[]);
        } catch (err: any) {
            console.error(err);
            setError('No se pudo cargar los empleados.');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setEditForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const payload = {
                name: form.name,
                email: form.email,
                password: form.password,
                role: form.role.replace(/^ROLE_/, ''),
            };
            await createEmployee(clientId!, payload);
            setForm({ name: '', email: '', password: '', role: 'ROLE_CAJERO' });
            setShowPassword(false);
            await loadEmployees();
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Error al crear empleado.');
        }
    };

    const startEditing = (emp: Employee) => {
        setEditingId(emp.id);
        setEditForm({ name: emp.name, email: emp.email, role: `ROLE_${emp.role}` });
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditForm({ name: '', email: '', role: 'ROLE_CAJERO' });
    };

    const submitEdit = async (id: string) => {
        setError('');
        try {
            const payload = {
                name: editForm.name,
                email: editForm.email,
                role: editForm.role.replace(/^ROLE_/, ''),
            };
            await updateEmployee(clientId!, id, payload);
            setEditingId(null);
            await loadEmployees();
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Error al editar empleado.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar este empleado?')) return;
        setError('');
        try {
            await deleteEmployee(clientId!, id);
            await loadEmployees();
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Error al eliminar empleado.');
        }
    };

    const displayed = employees.filter(e => e.id !== user?.employeeId);

    return (
        <div className="employee-section card">
            <div className="card-header">
                <h2>Empleados</h2>
            </div>
            <div className="card-body">
                {error && <div className="alert alert-error">{error}</div>}
                <ul className="employee-list">
                    {displayed.length > 0 ? (
                        displayed.map(e => (
                            <li key={e.id} className="employee-item">
                                {editingId === e.id ? (
                                    <div className="edit-row">
                                        <input
                                            className="input"
                                            name="name"
                                            value={editForm.name}
                                            onChange={handleEditChange}
                                            placeholder="Nombre"
                                        />
                                        <input
                                            className="input"
                                            name="email"
                                            value={editForm.email}
                                            onChange={handleEditChange}
                                            placeholder="Email"
                                        />
                                        <select
                                            className="select"
                                            name="role"
                                            value={editForm.role}
                                            onChange={handleEditChange}
                                        >
                                            <option value="ROLE_CAJERO">Cajero</option>
                                            <option value="ROLE_INVENTARIO">Inventario</option>
                                            <option value="ROLE_VENTAS_INVENTARIO">Ventas + Inventario</option>
                                            <option value="ROLE_MULTIFUNCION">Multifunción</option>
                                        </select>
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => submitEdit(e.id)}
                                        >Guardar</button>
                                        <button
                                            className="btn btn-secondary"
                                            onClick={cancelEditing}
                                        >Cancelar</button>
                                    </div>
                                ) : (
                                    <div className="info-row">
                                        <div className="info-text">
                                            <strong>{e.name}</strong>
                                            <span className="email">{e.email}</span>
                                        </div>
                                        <span className="role-tag">{e.role}</span>
                                        <div className="actions">
                                            <button
                                                className="btn btn-link"
                                                onClick={() => startEditing(e)}
                                            >Editar</button>
                                            <button
                                                className="btn btn-danger"
                                                onClick={() => handleDelete(e.id)}
                                            >Eliminar</button>
                                        </div>
                                    </div>
                                )}
                            </li>
                        ))
                    ) : (
                        <li>No hay empleados para mostrar.</li>
                    )}
                </ul>
            </div>
            <div className="card-footer">
                <h3>Nuevo empleado</h3>
                <form onSubmit={handleSubmit} className="employee-form">
                    <input
                        className="input"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Nombre"
                        required
                    />
                    <input
                        className="input"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="Email"
                        required
                    />
                    <div className="password-field">
                        <input
                            className="input"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            value={form.password}
                            onChange={handleChange}
                            placeholder="Contraseña"
                            required
                        />
                        <button
                            type="button"
                            className="btn btn-link toggle-password"
                            onClick={() => setShowPassword(prev => !prev)}
                        >{showPassword ? 'Ocultar' : 'Mostrar'}</button>
                    </div>
                    <select
                        className="select"
                        name="role"
                        value={form.role}
                        onChange={handleChange}
                    >
                        <option value="ROLE_CAJERO">Cajero</option>
                        <option value="ROLE_INVENTARIO">Inventario</option>
                        <option value="ROLE_VENTAS_INVENTARIO">Ventas + Inventario</option>
                        <option value="ROLE_MULTIFUNCION">Multifunción</option>
                    </select>
                    <button type="submit" className="btn btn-primary">Crear empleado</button>
                </form>
            </div>
        </div>
    );
}
