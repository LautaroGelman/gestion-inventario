import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/api';
import './EmployeesSection.css';

export default function EmployeesSection() {
    const { user } = useAuth();
    const [employees, setEmployees] = useState([]);
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'ROLE_CAJERO' });
    const [showPassword, setShowPassword] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', email: '', role: 'ROLE_CAJERO' });
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!user?.clientId) return;
        loadEmployees();
    }, [user?.clientId]);

    const loadEmployees = async () => {
        setError('');
        try {
            const res = await apiClient.get(`/client-panel/${user.clientId}/employees`);
            setEmployees(res.data);
        } catch (err) {
            console.error(err);
            setError('No se pudo cargar los empleados.');
        }
    };

    const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleEditChange = e => setEditForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async e => {
        e.preventDefault();
        setError('');
        try {
            const payload = { ...form, role: form.role.replace(/^ROLE_/, '') };
            await apiClient.post(`/client-panel/${user.clientId}/employees`, payload);
            setForm({ name: '', email: '', password: '', role: 'ROLE_CAJERO' });
            setShowPassword(false);
            await loadEmployees();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Error al crear empleado.');
        }
    };

    const startEditing = employee => {
        setEditingId(employee.id);
        setEditForm({ name: employee.name, email: employee.email, role: `ROLE_${employee.role}` });
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditForm({ name: '', email: '', role: 'ROLE_CAJERO' });
    };

    const submitEdit = async id => {
        setError('');
        try {
            const payload = { name: editForm.name, email: editForm.email, role: editForm.role.replace(/^ROLE_/, '') };
            await apiClient.put(`/client-panel/${user.clientId}/employees/${id}`, payload);
            setEditingId(null);
            await loadEmployees();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Error al editar empleado.');
        }
    };

    const deleteEmployee = async id => {
        if (!window.confirm('¿Eliminar este empleado?')) return;
        setError('');
        try {
            await apiClient.delete(`/client-panel/${user.clientId}/employees/${id}`);
            await loadEmployees();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Error al eliminar empleado.');
        }
    };

    const displayedEmployees = employees.filter(e => e.id !== user.employeeId);

    return (
        <div className="employee-section card">
            <div className="card-header">
                <h2>Empleados</h2>
            </div>
            <div className="card-body">
                {error && <div className="alert alert-error">{error}</div>}
                <ul className="employee-list">
                    {displayedEmployees.map(e => (
                        <li key={e.id} className="employee-item">
                            {editingId === e.id ? (
                                <div className="edit-row">
                                    <input className="input" name="name" value={editForm.name} onChange={handleEditChange} placeholder="Nombre" />
                                    <input className="input" name="email" value={editForm.email} onChange={handleEditChange} placeholder="Email" />
                                    <select className="select" name="role" value={editForm.role} onChange={handleEditChange}>
                                        <option value="ROLE_CAJERO">Cajero</option>
                                        <option value="ROLE_INVENTARIO">Inventario</option>
                                        <option value="ROLE_VENTAS_INVENTARIO">Ventas + Inventario</option>
                                        <option value="ROLE_MULTIFUNCION">Multifunción</option>
                                    </select>
                                    <button className="btn btn-primary" onClick={() => submitEdit(e.id)}>Guardar</button>
                                    <button className="btn btn-secondary" onClick={cancelEditing}>Cancelar</button>
                                </div>
                            ) : (
                                <div className="info-row">
                                    <div className="info-text">
                                        <strong>{e.name}</strong>
                                        <span className="email">{e.email}</span>
                                    </div>
                                    <span className="role-tag">{(e.role ?? '').replace(/^ROLE_/, '')}</span>
                                    <div className="actions">
                                        <button className="btn btn-link" onClick={() => startEditing(e)}>Editar</button>
                                        <button className="btn btn-danger" onClick={() => deleteEmployee(e.id)}>Eliminar</button>
                                    </div>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
            <div className="card-footer">
                <h3>Nuevo empleado</h3>
                <form onSubmit={handleSubmit} className="employee-form">
                    <input className="input" name="name" value={form.name} onChange={handleChange} placeholder="Nombre" required />
                    <input className="input" name="email" type="email" value={form.email} onChange={handleChange} placeholder="Email" required />
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
                        >
                            {showPassword ? 'Ocultar' : 'Mostrar'}
                        </button>
                    </div>
                    <select className="select" name="role" value={form.role} onChange={handleChange}>
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
