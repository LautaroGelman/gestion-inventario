import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
// 1. IMPORTACIONES CORREGIDAS:
//    Importamos la función específica y el hook de autenticación.
import { getBestSellers } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function BestSellersChart({ startDate, endDate }) {
    const { user } = useAuth(); // Para obtener el clientId
    const [chartData, setChartData] = useState(null);
    const [error, setError] = useState(''); // Estado para manejar errores

    useEffect(() => {
        // Nos aseguramos de tener toda la información necesaria
        if (user?.clientId && startDate && endDate) {
            const fetchBestSellers = async () => {
                setError(''); // Limpiamos errores previos
                setChartData(null); // Limpiamos datos previos para mostrar carga
                try {
                    // 2. LLAMADA A LA API CORREGIDA:
                    //    Usamos la función específica con clientId y las fechas.
                    const response = await getBestSellers(user.clientId, startDate, endDate);
                    const data = response.data;

                    setChartData({
                        labels: data.map(item => item.productName),
                        datasets: [{
                            label: 'Cantidad Vendida',
                            data: data.map(item => item.totalQuantitySold),
                            backgroundColor: 'rgba(4, 128, 163, 0.6)',
                            borderColor: 'rgba(4, 128, 163, 1)',
                            borderWidth: 1,
                        }]
                    });
                } catch (err) {
                    console.error("Error fetching best sellers:", err);
                    setError(err.response?.data?.message || "No se pudieron cargar los productos más vendidos.");
                }
            };
            fetchBestSellers();
        }
    }, [startDate, endDate, user]); // Agregamos 'user' a las dependencias

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    if (!chartData) {
        return <div>Cargando datos del gráfico...</div>;
    }

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Productos más vendidos',
            },
        },
    };

    return <Bar options={options} data={chartData} />;
}

export default BestSellersChart;