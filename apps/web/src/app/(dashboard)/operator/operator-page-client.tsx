"use client";

import { useEffect, useMemo, useState } from "react";

import { MyConversations } from "@/components/operator/my-conversations";
import { OperatorQueue } from "@/components/operator/operator-queue";
import { useApiSWR } from "@/lib/api/swr";
import type {
  ListOperatorsResponse,
  OperatorListItem,
  OperatorMeResponse,
} from "@/lib/operators/operator-types";
import {
  assignConversationToOperator,
  releaseConversation,
} from "@/lib/operators/operators-api";

interface ConversationsResponse {
  items: Array<{
    id: string;
    instanceId: string;
    contactId: string;
    contactName?: string | null;
    status: string;
    assignedOperatorId?: string | null;
    unreadCount: number;
    lastMessageAt: string;
  }>;
  total: number;
}

export default function OperatorPageClient() {
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>("");
  const [activeOperatorId, setActiveOperatorId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: operatorsData, mutate: mutateOperators } =
    useApiSWR<ListOperatorsResponse>("/api/operators");
  const { data: operatorMeData } = useApiSWR<OperatorMeResponse>("/api/operators/me");

  const { data: instancesData } = useApiSWR<{
    items: Array<{ id: string; name: string }>;
  }>("/api/instances");

  const instances = instancesData?.items ?? [];
  const operators = operatorsData?.items ?? [];

  useEffect(() => {
    if (!selectedInstanceId && instances.length) {
      setSelectedInstanceId(instances[0]!.id);
    }
  }, [instances, selectedInstanceId]);

  useEffect(() => {
    if (!activeOperatorId && operatorMeData?.operator) {
      setActiveOperatorId(operatorMeData.operator.id);
    }
  }, [activeOperatorId, operatorMeData]);

  const conversationsQuery = useMemo(() => {
    if (!selectedInstanceId) return null;
    const params = new URLSearchParams({ instanceId: selectedInstanceId });
    if (activeOperatorId) {
      params.set("operatorId", activeOperatorId);
      params.set("includeUnassigned", "true");
    }
    return `/api/conversations?${params.toString()}`;
  }, [selectedInstanceId, activeOperatorId]);

  const { data: conversationsData, mutate: mutateConversations } =
    useApiSWR<ConversationsResponse>(conversationsQuery, {
      refreshInterval: 5000,
    });

  const activeOperator =
    operators.find((operator) => operator.id === activeOperatorId) ?? null;
  const canOperate = Boolean(selectedInstanceId && activeOperatorId);

  const handleClaim = async (params: {
    conversationId: string;
    operatorId: string;
  }) => {
    setIsSubmitting(true);
    try {
      await assignConversationToOperator(params);
      await Promise.all([mutateConversations(), mutateOperators()]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRelease = async (params: {
    conversationId: string;
    operatorId: string;
  }) => {
    setIsSubmitting(true);
    try {
      await releaseConversation(params);
      await Promise.all([mutateConversations(), mutateOperators()]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col gap-6 bg-background -m-4 md:-m-8 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Operator View</h1>
        <p className="text-sm text-muted-foreground">
          Atribua conversas a operadores humanos antes da IA assumir.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[280px_1fr]">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm font-semibold text-foreground">Instância</p>
          <select
            className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
            value={selectedInstanceId}
            onChange={(event) => setSelectedInstanceId(event.target.value)}
          >
            <option value="">Selecione uma instância</option>
            {instances.map((instance) => (
              <option key={instance.id} value={instance.id}>
                {instance.name}
              </option>
            ))}
          </select>

          <div className="mt-4 border-t border-border pt-4">
            <p className="text-sm font-semibold text-foreground">
              Operador ativo
            </p>
            <select
              className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
              value={activeOperatorId}
              onChange={(event) => setActiveOperatorId(event.target.value)}
            >
              <option value="">Selecione um operador</option>
              {operators.map((operator: OperatorListItem) => (
                <option key={operator.id} value={operator.id}>
                  {operator.name} • {operator.status}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4">
          <OperatorQueue
            conversations={conversationsData?.items ?? []}
            operators={operators}
            onClaim={handleClaim}
            isBusy={isSubmitting || !canOperate}
          />
          <MyConversations
            conversations={conversationsData?.items ?? []}
            operator={activeOperator}
            onRelease={handleRelease}
            isBusy={isSubmitting || !canOperate}
          />
        </div>
      </div>
    </div>
  );
}
