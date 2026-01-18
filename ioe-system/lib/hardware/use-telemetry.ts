'use client';

import { useState, useEffect, useRef } from 'react';
import { SensorFusionFrame } from '@/lib/simulation/types';

export interface TelemetryState {
    online: boolean;
    frame: SensorFusionFrame | null;
    lastSeen?: number;
}

export function useLiveTelemetry(pollingIntervalMs: number = 200) {
    const [state, setState] = useState<TelemetryState>({
        online: false,
        frame: null
    });

    useEffect(() => {
        let isMounted = true;

        const fetchTelemetry = async () => {
            try {
                const res = await fetch('/api/ingest/v1/stream');
                if (!res.ok) throw new Error('Stream Error');

                const data = await res.json();

                if (isMounted) {
                    if (data.online) {
                        setState({
                            online: true,
                            frame: data.frame,
                            lastSeen: Date.now()
                        });
                    } else {
                        setState(prev => ({ ...prev, online: false }));
                    }
                }
            } catch (e) {
                console.error("Telemetry fetch failed", e);
                if (isMounted) setState(prev => ({ ...prev, online: false }));
            }
        };

        // Initial fetch
        fetchTelemetry();

        // Polling Loop
        const interval = setInterval(fetchTelemetry, pollingIntervalMs);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [pollingIntervalMs]);

    return state;
}
