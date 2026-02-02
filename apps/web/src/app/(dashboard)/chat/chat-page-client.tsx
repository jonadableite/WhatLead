"use client";

import { useEffect, useMemo, useState } from "react";

import { ChatLayout } from "@/components/chat/chat-layout";
import { ChatView } from "@/components/chat/chat-view";
import { ConversationList } from "@/components/chat/conversation-list";
import { MessageInput } from "@/components/chat/message-input";
import { apiFetch } from "@/lib/api/api-fetch";
import { useApiSWR } from "@/lib/api/swr";
import {
  translateConnectionStatus,
  translateLifecycleStatus,
} from "@/lib/instances/instance-status-translations";
import type {
  InstanceListItem,
  ListInstancesResponse,
} from "@/lib/instances/instance-types";
import { useRealtime } from "@/lib/realtime/use-realtime";

interface ConversationsResponse {
  items: Array<{
    id: string;
    instanceId: string;
    contactId: string;
    contactName?: string | null;
    profilePicUrl?: string | null;
    status: string;
    unreadCount: number;
    lastMessageAt: string;
    lastMessage?: {
      body: string;
      direction: string;
      occurredAt: string;
    } | null;
  }>;
  total: number;
}

interface TimelineResponse {
  items: Array<
    | {
        type: "MESSAGE";
        messageId: string;
        direction: "INBOUND" | "OUTBOUND";
        origin: "MANUAL" | "AI" | "AUTOMATION";
        payload: {
          kind: "TEXT" | "MEDIA" | "AUDIO" | "REACTION";
          text?: string;
          media?: {
            url?: string;
            base64?: string;
            mimeType?: string;
            caption?: string;
          };
          audio?: {
            url?: string;
            base64?: string;
            mimeType?: string;
          };
          reaction?: {
            emoji: string;
            targetMessageId?: string;
          };
        };
        createdAt: string;
      }
    | {
        type: "SYSTEM";
        action: "CONVERSATION_OPENED" | "CONVERSATION_CLOSED";
        createdAt: string;
      }
    | {
        type: "ASSIGNMENT";
        assignedTo: { type: "OPERATOR" | "AI"; id: string };
        createdAt: string;
      }
    | {
        type: "TAG";
        tag: string;
        createdAt: string;
      }
  >;
  nextCursor?: string;
}

interface ExecutionJobsResponse {
  items: Array<{
    id: string;
    type: string;
    status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
    scheduledFor: string;
    attempts: number;
    maxAttempts: number;
    lastError: string | null;
    createdAt: string;
    executedAt: string | null;
    failedAt: string | null;
    cancelledAt: string | null;
  }>;
}

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 768px)");
    const onChange = () => setIsMobile(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return isMobile;
};

export default function ChatPageClient() {
  const isMobile = useIsMobile();
  const [showConversationList, setShowConversationList] = useState(true);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(
    null,
  );
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [search, setSearch] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const { data: instancesData, isLoading: isLoadingInstances } =
    useApiSWR<ListInstancesResponse>("/api/instances");
  const instances = instancesData?.items ?? [];

  useEffect(() => {
    if (!selectedInstanceId && instances.length) {
      setSelectedInstanceId(instances[0]!.id);
    }
  }, [instances, selectedInstanceId]);

  const conversationsQuery = useMemo(() => {
    if (!selectedInstanceId) return null;
    const params = new URLSearchParams({ instanceId: selectedInstanceId });
    if (search.trim()) params.set("search", search.trim());
    return `/api/conversations?${params.toString()}`;
  }, [selectedInstanceId, search]);

  const {
    data: conversationsData,
    isLoading: isLoadingConversations,
    mutate: mutateConversations,
  } = useApiSWR<ConversationsResponse>(conversationsQuery, {
    refreshInterval: 5000,
  });

  useEffect(() => {
    if (!conversationsData?.items?.length) {
      setActiveConversationId(null);
      return;
    }
    if (
      !activeConversationId ||
      !conversationsData.items.some((item) => item.id === activeConversationId)
    ) {
      setActiveConversationId(conversationsData.items[0]!.id);
    }
  }, [conversationsData, activeConversationId]);

  const timelineQuery = activeConversationId
    ? `/api/conversations/${activeConversationId}/timeline?limit=60`
    : null;

  const {
    data: timelineData,
    isLoading: isLoadingTimeline,
    mutate: mutateTimeline,
  } = useApiSWR<TimelineResponse>(timelineQuery, {
    refreshInterval: 3000,
  });

  const executionJobsQuery = activeConversationId
    ? `/api/conversations/${activeConversationId}/jobs?limit=20`
    : null;

  const {
    data: executionJobsData,
    isLoading: isLoadingExecutionJobs,
    mutate: mutateExecutionJobs,
  } = useApiSWR<ExecutionJobsResponse>(executionJobsQuery, {
    refreshInterval: 10000,
  });

  const { lastEvent } = useRealtime({
    instanceId: selectedInstanceId,
    enabled: Boolean(selectedInstanceId),
  });

  useEffect(() => {
    if (!lastEvent || !selectedInstanceId) {
      return;
    }
    if (lastEvent.payload.instanceId !== selectedInstanceId) {
      return;
    }
    void mutateConversations();
    if (lastEvent.payload.conversationId === activeConversationId) {
      void mutateTimeline();
      void mutateExecutionJobs();
    }
  }, [
    activeConversationId,
    lastEvent,
    mutateConversations,
    mutateTimeline,
    mutateExecutionJobs,
    selectedInstanceId,
  ]);

  useEffect(() => {
    if (!isMobile) {
      setShowConversationList(true);
    }
  }, [isMobile]);

  const activeInstance = instances.find(
    (instance) => instance.id === selectedInstanceId,
  );
  const activeConversation = conversationsData?.items.find(
    (item) => item.id === activeConversationId,
  );

  const disabledReason = useMemo(() => {
    if (!selectedInstanceId) {
      return {
        title: "Selecione uma instância para começar",
        description:
          "Escolha a instância conectada para visualizar e responder.",
        variant: "info" as const,
      };
    }
    if (!activeConversation) {
      return {
        title: "Selecione uma conversa",
        description: "Clique em uma conversa para responder mensagens.",
        variant: "info" as const,
      };
    }
    if (!activeInstance) {
      return {
        title: "Instância indisponível",
        description: "Não foi possível carregar os detalhes desta instância.",
        variant: "blocked" as const,
      };
    }
    if (activeInstance.connectionStatus !== "CONNECTED") {
      return {
        title: "Instância desconectada",
        description: "Conecte a instância para enviar mensagens.",
        variant: "blocked" as const,
      };
    }
    if (activeInstance.lifecycleStatus === "BANNED") {
      return {
        title: "Instância banida",
        description: "Esta instância não pode enviar mensagens.",
        variant: "blocked" as const,
      };
    }
    if (!activeInstance.allowedActions.includes("ALLOW_DISPATCH")) {
      return {
        title: "Instância em resfriamento",
        description: "Aguarde o cooldown para retomar os envios.",
        variant: "cooldown" as const,
      };
    }
    return null;
  }, [activeInstance, activeConversation, selectedInstanceId]);

  const canSend = !disabledReason;

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    if (isMobile) setShowConversationList(false);
  };

  const handleSend = async () => {
    const trimmed = newMessage.trim();
    if (!trimmed || !activeConversationId || !canSend || isSending) return;

    setIsSending(true);
    try {
      await apiFetch(`/api/conversations/${activeConversationId}/messages`, {
        method: "POST",
        body: JSON.stringify({ body: trimmed }),
      });
      setNewMessage("");
      await Promise.all([mutateTimeline(), mutateConversations()]);
    } catch {
      // Errors are handled by UI state; no toast needed in phase 1.
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="relative flex h-[calc(100vh-64px)] flex-col overflow-hidden bg-background -m-4 md:-m-8 p-4 md:p-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-indigo-500/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-none flex-1 min-h-0 flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-white">Chat CRM</h1>
          <p className="text-sm text-zinc-400">
            Visualize conversas reais do WhatsApp e responda manualmente com
            segurança.
          </p>
        </div>

        <ChatLayout
          isMobile={isMobile}
          showConversationList={showConversationList}
          conversationList={
            <ConversationList
              instances={instances}
              selectedInstanceId={selectedInstanceId}
              onInstanceChange={(value) => {
                setSelectedInstanceId(value);
                setSearch("");
                setActiveConversationId(null);
              }}
              search={search}
              onSearch={setSearch}
              conversations={conversationsData?.items ?? []}
              isLoading={isLoadingInstances || isLoadingConversations}
              activeConversationId={activeConversationId}
              onSelectConversation={handleSelectConversation}
            />
          }
          chatView={
            <ChatView
              isMobile={isMobile}
              showBack={isMobile}
              onBack={() => setShowConversationList(true)}
              conversation={activeConversation ?? null}
              timeline={timelineData?.items ?? []}
              isLoading={isLoadingTimeline}
              executionJobs={executionJobsData?.items ?? []}
              isLoadingJobs={isLoadingExecutionJobs}
              instanceName={activeInstance?.name}
              instanceStatus={
                activeInstance
                  ? `${translateConnectionStatus(
                      activeInstance.connectionStatus,
                    )} • ${translateLifecycleStatus(
                      activeInstance.lifecycleStatus,
                    )}`
                  : undefined
              }
            >
              <MessageInput
                value={newMessage}
                onChange={setNewMessage}
                onSend={handleSend}
                disabled={!canSend}
                disabledReason={disabledReason ?? undefined}
                isSending={isSending}
              />
            </ChatView>
          }
        />
      </div>
    </div>
  );
}
