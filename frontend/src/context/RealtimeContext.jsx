import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { API_URL } from "../config/api";

const RealtimeContext = createContext({ version: 0, connected: false });

export function RealtimeProvider({ children }) {
  const [version, setVersion] = useState(0);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let source;
    let reconnectTimeout;
    let cancelled = false;
    let retryMs = 2000;

    const connect = () => {
      const token = localStorage.getItem("token");

      if (!token || cancelled) {
        setConnected(false);
        reconnectTimeout = setTimeout(connect, retryMs);
        return;
      }

      source = new EventSource(`${API_URL}/realtime/events?token=${encodeURIComponent(token)}`);

      source.onopen = () => {
        retryMs = 2000;
        setConnected(true);
      };

      source.onmessage = () => {
        setVersion((prev) => prev + 1);
      };

      source.onerror = () => {
        setConnected(false);
        source.close();

        if (cancelled) return;

        retryMs = Math.min(retryMs * 2, 15000);
        reconnectTimeout = setTimeout(connect, retryMs);
      };
    };

    connect();

    return () => {
      cancelled = true;
      clearTimeout(reconnectTimeout);
      source?.close();
    };
  }, []);

  const value = useMemo(() => ({ version, connected }), [version, connected]);

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtimeVersion() {
  const { version } = useContext(RealtimeContext);
  return version;
}

export function useRealtimeStatus() {
  const { connected } = useContext(RealtimeContext);
  return connected;
}