// src/components/client/Notifications.tsx
'use client';

import { useState, useEffect } from 'react';
import { getAlerts, markAlertAsRead } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

interface AlertRecord {
    id: string;
    message: string;
}

const BellIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
);

export default function Notifications() {
    const { user } = useAuth();
    const clientId = user?.clientId;

    const [alerts, setAlerts] = useState<AlertRecord[]>([]);
    const [showNotifications, setShowNotifications] = useState<boolean>(false);

    useEffect(() => {
        if (!clientId) return;
        const fetchAlerts = async () => {
            try {
                const response = await getAlerts(clientId);
                setAlerts(response.data as AlertRecord[]);
            } catch (error) {
                console.error('Error fetching alerts:', error);
            }
        };
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 60000);
        return () => clearInterval(interval);
    }, [clientId]);

    const toggleNotifications = () => {
        setShowNotifications(prev => !prev);
    };

    const markAsRead = async (alertId: string) => {
        if (!clientId) return;
        try {
            await markAlertAsRead(clientId, alertId);
            setAlerts(prev => prev.filter(alert => alert.id !== alertId));
        } catch (error) {
            console.error('Error marking alert as read:', error);
        }
    };

    const unreadAlertCount = alerts.length;

    return (
        <div className="notifications-container">
            <button
                onClick={toggleNotifications}
                className="notifications-button"
                aria-label="Ver alertas"
            >
                <BellIcon />
                {unreadAlertCount > 0 && (
                    <span className="notification-badge">{unreadAlertCount}</span>
                )}
            </button>
            {showNotifications && (
                <div className="notifications-dropdown">
                    <h4>Alertas de Stock Bajo</h4>
                    {alerts.length === 0 ? (
                        <p>No hay alertas nuevas.</p>
                    ) : (
                        <ul>
                            {alerts.map(alert => (
                                <li key={alert.id} className="notification-item">
                                    <p>{alert.message}</p>
                                    <button
                                        onClick={() => markAsRead(alert.id)}
                                        className="btn-mark-read"
                                    >
                                        Marcar como leído
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
