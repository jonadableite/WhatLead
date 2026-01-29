"use client";

import { useMemo, useState } from "react";

import type { OperatorListItem } from "@/lib/operators/operator-types";
import { cn } from "@/lib/utils";

interface OperatorQueueProps {
  conversations: Array<{
    id: string;
    contactId: string;
    contactName?: string | null;
    status: string;
    lastMessageAt: string;
    unreadCount: number;
    assignedOperatorId?: string | null;
  }>;
  operators: OperatorListItem[];
  onClaim: (params: {
    conversationId: string;
    operatorId: string;
  }) => Promise<void>;
  isBusy?: boolean;
}

export const OperatorQueue = ({
  conversations,
  operators,
  onClaim,
  isBusy,
}: OperatorQueueProps) => {
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>("");

  const queue = useMemo(
    () =>
      conversations.filter((conversation) => !conversation.assignedOperatorId),
    [conversations],
  );

  const availableOperators = useMemo(
    () => operators.filter((operator) => operator.status === "ONLINE"),
    [operators],
  );

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-foreground">Fila disponível</p>
        <p className="text-xs text-muted-foreground">
          Conversa sem dono, pronta para assumir.
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <label className="text-xs font-medium text-muted-foreground">
          Operador
          <select
            className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
            value={selectedOperatorId}
            onChange={(event) => setSelectedOperatorId(event.target.value)}
          >
            <option value="">Selecione um operador</option>
            {availableOperators.map((operator) => (
              <option key={operator.id} value={operator.id}>
                {operator.name} • {operator.currentConversationCount}/
                {operator.maxConcurrentConversations}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-col gap-3">
          {queue.length === 0 && (
            <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
              Nenhuma conversa aguardando.
            </div>
          )}

          {queue.map((conversation) => (
            <div
              key={conversation.id}
              className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-3"
            >
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold text-foreground">
                  {conversation.contactName ?? conversation.contactId}
                </p>
                <p className="text-xs text-muted-foreground">
                  Última mensagem em{" "}
                  {new Date(conversation.lastMessageAt).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                className={cn(
                  "btn-primary text-xs",
                  (!selectedOperatorId || isBusy) && "opacity-50",
                )}
                disabled={!selectedOperatorId || isBusy}
                onClick={() =>
                  onClaim({
                    conversationId: conversation.id,
                    operatorId: selectedOperatorId,
                  })
                }
              >
                Assumir
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
