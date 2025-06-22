// src/components/client/ReturnsSection.jsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/api';

export default function ReturnsSection() {
    const { user } = useAuth();
    const [saleId, setSaleId] = useState('');
    const [reason, setReason] = useState('');

    const handleSubmit = e => {
        e.preventDefault();
        apiClient
            .post(`/client-panel/${user.clientId}/returns`, { saleId: Number(saleId), reason, items: [] })
            .then(() => {
                alert('Devolución registrada');
                setSaleId(''); setReason('');
            })
            .catch(err => alert('Error: ' + err.message));
    };

    return (
        <div>
            <h2>Devoluciones</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="number" placeholder="ID de venta"
                    value={saleId} onChange={e => setSaleId(e.target.value)} required
                />
                <input
                    type="text" placeholder="Motivo"
                    value={reason} onChange={e => setReason(e.target.value)} required
                />
                <button type="submit">Registrar devolución</button>
            </form>
        </div>
    );
}
