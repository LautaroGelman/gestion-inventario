// src/components/client/CashSessionModal.tsx
'use client';

import { useState, FormEvent } from 'react';

interface CashSessionModalProps {
    mode: 'open' | 'close';
    onOpen: (amount: number) => void;
    onClose: (amount: number) => void;
    onCancel: () => void;
    expectedAmount?: number;
}

export default function CashSessionModal({
                                             mode,
                                             onOpen,
                                             onClose,
                                             onCancel,
                                             expectedAmount,
                                         }: CashSessionModalProps) {
    const [amount, setAmount] = useState<string>('');

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const parsed = parseFloat(amount);
        if (isNaN(parsed)) return;
        if (mode === 'open') {
            onOpen(parsed);
        } else {
            onClose(parsed);
        }
        setAmount('');
    };

    const title = mode === 'open' ? 'Abrir Caja' : 'Cerrar Caja';
    const label = mode === 'open' ? 'Monto Inicial:' : 'Monto Final Contado:';
    const buttonText = mode === 'open' ? 'Confirmar Apertura' : 'Confirmar Cierre';

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <h2>{title}</h2>
                <form onSubmit={handleSubmit}>
                    {mode === 'close' && (
                        <p className="expected-amount">
                            Monto esperado según ventas:{' '}
                            <strong>
                                ${expectedAmount?.toFixed(2) ?? '0.00'}
                            </strong>
                        </p>
                    )}

                    <label htmlFor="amount">{label}</label>
                    <input
                        type="number"
                        id="amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        step="0.01"
                        required
                    />

                    <div className="modal-actions">
                        {mode !== 'open' && (
                            <button
                                type="button"
                                className="btn-cancel"
                                onClick={onCancel}
                            >
                                Cancelar
                            </button>
                        )}
                        <button type="submit" className="btn-confirm">
                            {buttonText}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
