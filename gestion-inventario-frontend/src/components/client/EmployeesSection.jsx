// src/components/client/EmployeesSection.jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiClient  from '../../services/api';

export default function EmployeesSection() {
    const { user } = useAuth();
    const [employees, setEmployees] = useState([]);

    useEffect(() => {
        apiClient
            .get(`/client-panel/${user.clientId}/employees`)
            .then(res => setEmployees(res.data))
            .catch(console.error);
    }, [user.clientId]);

    return (
        <div>
            <h2>Empleados</h2>
            <ul>
                {employees.map(e => (
                    <li key={e.id}>{e.name} ({e.email}) — {e.role}</li>
                ))}
            </ul>
            {/* Aquí podrías añadir formularios de alta/edición */}
        </div>
    );
}
