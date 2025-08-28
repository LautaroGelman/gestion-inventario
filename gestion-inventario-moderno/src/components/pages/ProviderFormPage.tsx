'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { addProvider } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

interface ProviderFormData {
    name: string;
    contact: string;
    email: string;
    phone: string;
    address: string;
    notes: string;
}

export default function ProviderFormPage() {
    const { user } = useAuth();
    const clientId = user?.clientId;
    const router = useRouter();

    const [formData, setFormData] = useState<ProviderFormData>({
        name: '',
        contact: '',
        email: '',
        phone: '',
        address: '',
        notes: '',
    });

    const [error, setError] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (!clientId) {
            setError('No se pudo identificar al cliente. Por favor, recargá la página.');
            return;
        }

        // Validación mínima
        const name = formData.name.trim();
        if (!name) {
            setError('El nombre comercial es obligatorio.');
            return;
        }

        const payload = {
            name,
            contact: formData.contact.trim() || undefined,
            email: formData.email.trim() || undefined,
            phone: formData.phone.trim() || undefined,
            address: formData.address.trim() || undefined,
            notes: formData.notes.trim() || undefined,
        };

        try {
            setSubmitting(true);
            await addProvider(clientId, payload);
            alert('Proveedor creado con éxito');
            router.push('/panel#providers');
        } catch (err: any) {
            console.error('Error creating provider:', err);
            setError(err?.response?.data?.message || 'Error al guardar el proveedor.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
      <div className="container-form">
          <header className="form-header">
              <h1>Nuevo Proveedor</h1>
          </header>
          <main>
              <form id="form-proveedor" onSubmit={handleSubmit}>
                  <div className="form-group">
                      <label htmlFor="name">Nombre comercial:</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        autoFocus
                      />
                  </div>

                  <div className="form-group">
                      <label htmlFor="contact">Persona de contacto:</label>
                      <input
                        type="text"
                        id="contact"
                        name="contact"
                        value={formData.contact}
                        onChange={handleChange}
                        placeholder="Ej: Juan Pérez"
                      />
                  </div>

                  <div className="form-group">
                      <label htmlFor="email">Email:</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="contacto@proveedor.com"
                        autoComplete="email"
                      />
                  </div>

                  <div className="form-group">
                      <label htmlFor="phone">Teléfono:</label>
                      <input
                        type="text"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+54 9 ..."
                        autoComplete="tel"
                      />
                  </div>

                  <div className="form-group">
                      <label htmlFor="address">Dirección:</label>
                      <textarea
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        rows={2}
                        placeholder="Calle 123, Ciudad"
                      />
                  </div>

                  <div className="form-group">
                      <label htmlFor="notes">Notas:</label>
                      <textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Observaciones internas..."
                      />
                  </div>

                  {error && <p className="error-message">{error}</p>}

                  <div className="form-actions">
                      <button type="submit" className="btn-submit" disabled={submitting}>
                          {submitting ? 'Guardando…' : 'Guardar'}
                      </button>
                      <button
                        type="button"
                        className="btn-cancel"
                        onClick={() => router.push('/panel#providers')}
                        disabled={submitting}
                      >
                          Cancelar
                      </button>
                  </div>
              </form>
          </main>
      </div>
    );
}
