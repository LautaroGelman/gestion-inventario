// src/components/client/ReturnsHistory.jsx
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../services/api";
import "./ReturnsHistory.css";

export default function ReturnsHistory() {
    const { user } = useAuth();
    const [saleId, setSaleId]   = useState("");
    const [from, setFrom]       = useState("");
    const [to, setTo]           = useState("");
    const [list, setList]       = useState([]);
    const [msg, setMsg]         = useState("");
    const [loading, setLoading] = useState(false);

    const fetchReturns = async () => {
        setMsg(""); setList([]);
        const params = new URLSearchParams();
        if (saleId) params.append("saleId", saleId);
        if (from)   params.append("from", from);
        if (to)     params.append("to", to);
        try {
            setLoading(true);
            const { data } = await apiClient.get(
                `/client-panel/${user.clientId}/returns?${params.toString()}`
            );
            setList(data);
            if (data.length === 0) setMsg("No se encontraron devoluciones.");
        } catch (e) {
            setMsg("Error al cargar devoluciones.");
        } finally { setLoading(false); }
    };

    return (
        <div className="returns-history">
            <h2>Historial de devoluciones</h2>

            <div className="filters">
                <input
                    type="number"
                    placeholder="ID venta"
                    value={saleId}
                    onChange={e => setSaleId(e.target.value)}
                />
                <input
                    type="date"
                    value={from}
                    onChange={e => setFrom(e.target.value)}
                />
                <input
                    type="date"
                    value={to}
                    onChange={e => setTo(e.target.value)}
                />
                <button onClick={fetchReturns} disabled={loading}>
                    {loading ? "Buscando..." : "Buscar"}
                </button>
            </div>

            {msg && <p className="msg">{msg}</p>}

            {list.length > 0 && (
                <table>
                    <thead>
                    <tr>
                        <th>Devolución</th>
                        <th>Venta</th>
                        <th>Fecha</th>
                        <th>Motivo</th>
                    </tr>
                    </thead>
                    <tbody>
                    {list.map(r => (
                        <tr key={r.saleReturnId}>
                            <td>{r.saleReturnId}</td>
                            <td>{r.saleId}</td>
                            <td>{new Date(r.returnedAt).toLocaleString()}</td>
                            <td>{r.reason}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
