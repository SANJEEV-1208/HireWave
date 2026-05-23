import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export function useWebSocket({ token, onNotification, onMessage, onReadReceipt, enabled }) {
    const onNotifRef = useRef(onNotification);
    const onMessageRef = useRef(onMessage);
    const onReadReceiptRef = useRef(onReadReceipt);
    useEffect(() => { onNotifRef.current = onNotification; });
    useEffect(() => { onMessageRef.current = onMessage; });
    useEffect(() => { onReadReceiptRef.current = onReadReceipt; });

    useEffect(() => {
        if (!token || !enabled) return;

        const client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8081/ws'),
            connectHeaders: { Authorization: `Bearer ${token}` },
            reconnectDelay: 5000,
            onConnect: () => {
                client.subscribe('/user/queue/notifications', (msg) => {
                    try { onNotifRef.current?.(JSON.parse(msg.body)); } catch {}
                });
                client.subscribe('/user/queue/messages', (msg) => {
                    try { onMessageRef.current?.(JSON.parse(msg.body)); } catch {}
                });
                client.subscribe('/user/queue/read-receipts', (msg) => {
                    try { onReadReceiptRef.current?.(JSON.parse(msg.body)); } catch {}
                });
            },
            onStompError: () => {},
            onDisconnect: () => {},
        });

        client.activate();
        return () => { client.deactivate(); };
    }, [token, enabled]);
}
