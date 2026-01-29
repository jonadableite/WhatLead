import { env } from "@WhatLead/env/web";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";

const realtimeEventSchema = z.object({
	type: z.string(),
	payload: z.object({
		conversationId: z.string(),
		instanceId: z.string(),
		message: z.object({
			id: z.string(),
			direction: z.enum(["INBOUND", "OUTBOUND"]),
			type: z.string(),
			sentBy: z.string(),
			status: z.string(),
			body: z.string().nullable().optional(),
			occurredAt: z.string(),
		}),
	}),
});

export type RealtimeEvent = z.infer<typeof realtimeEventSchema>;

interface UseRealtimeParams {
	instanceId?: string | null;
	organizationId?: string | null;
	enabled?: boolean;
}

type RealtimeStatus = "idle" | "connecting" | "open" | "closed" | "error";

export const useRealtime = ({
	instanceId,
	organizationId,
	enabled = true,
}: UseRealtimeParams) => {
	const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
	const [status, setStatus] = useState<RealtimeStatus>("idle");
	const socketRef = useRef<WebSocket | null>(null);
	const reconnectTimerRef = useRef<number | null>(null);
	const backoffRef = useRef(1000);
	const shouldReconnectRef = useRef(true);
	const connectRef = useRef<() => void>(() => {});

	const websocketUrl = useMemo(() => {
		const base = new URL(env.NEXT_PUBLIC_SERVER_URL);
		base.protocol = base.protocol === "https:" ? "wss:" : "ws:";
		base.pathname = "/realtime";
		base.search = "";
		return base.toString();
	}, []);

	const sendMessage = useCallback((payload: object) => {
		const socket = socketRef.current;
		if (!socket || socket.readyState !== WebSocket.OPEN) {
			return;
		}
		socket.send(JSON.stringify(payload));
	}, []);

	const subscribe = useCallback(() => {
		if (!enabled) return;
		if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
			return;
		}
		const payload: { type: "subscribe"; instanceId?: string; organizationId?: string } = {
			type: "subscribe",
		};
		if (instanceId) {
			payload.instanceId = instanceId;
		}
		if (organizationId) {
			payload.organizationId = organizationId;
		}
		sendMessage(payload);
	}, [enabled, instanceId, organizationId, sendMessage]);

	const scheduleReconnect = useCallback(() => {
		if (!shouldReconnectRef.current || !enabled) {
			return;
		}
		if (reconnectTimerRef.current) {
			window.clearTimeout(reconnectTimerRef.current);
		}
		const delay = Math.min(backoffRef.current, 10000);
		reconnectTimerRef.current = window.setTimeout(() => {
			backoffRef.current = Math.min(backoffRef.current * 2, 10000);
			connectRef.current();
		}, delay);
	}, [enabled]);

	const connect = useCallback(() => {
		if (!enabled) {
			return;
		}
		if (socketRef.current) {
			socketRef.current.close();
		}

		setStatus("connecting");
		const socket = new WebSocket(websocketUrl);
		socketRef.current = socket;

		socket.onopen = () => {
			backoffRef.current = 1000;
			setStatus("open");
			subscribe();
		};

		socket.onmessage = (event) => {
			const parsed = safeParse(event.data);
			const result = realtimeEventSchema.safeParse(parsed);
			if (result.success) {
				setLastEvent(result.data);
			}
		};

		socket.onerror = () => {
			setStatus("error");
		};

		socket.onclose = () => {
			setStatus("closed");
			scheduleReconnect();
		};
	}, [enabled, scheduleReconnect, subscribe, websocketUrl]);

	useEffect(() => {
		connectRef.current = connect;
	}, [connect]);

	useEffect(() => {
		shouldReconnectRef.current = true;
		connect();

		return () => {
			shouldReconnectRef.current = false;
			if (reconnectTimerRef.current) {
				window.clearTimeout(reconnectTimerRef.current);
			}
			socketRef.current?.close();
		};
	}, [connect]);

	useEffect(() => {
		subscribe();
	}, [subscribe]);

	return { lastEvent, status };
};

const safeParse = (data: unknown): unknown => {
	if (typeof data !== "string") {
		return null;
	}
	try {
		return JSON.parse(data);
	} catch {
		return null;
	}
};
