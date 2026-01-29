"use client";

import type { OperatorListItem } from "@/lib/operators/operator-types";

interface MyConversationsProps {
  conversations: Array<{
    id: string;
    contactId: string;
    contactName?: string | null;
    lastMessageAt: string;
    unreadCount: number;
    assignedOperatorId?: string | null;
  }>;
  operator: OperatorListItem | null;
  onRelease: (params: {
    conversationId: string;
    operatorId: string;
  }) => Promise<void>;
  isBusy?: boolean;
}

export const MyConversations = ({
  conversations,
  operator,
  onRelease,
  isBusy,
}: MyConversationsProps) => {
  const assigned = operator
    ? conversations.filter(
        (conversation) => conversation.assignedOperatorId === operator.id,
      )
    : [];

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-foreground">
          Minhas conversas
        </p>
        <p className="text-xs text-muted-foreground">
          Conversa já assumida por você.
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {!operator && (
          <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            Selecione um operador para ver as conversas atribuídas.
          </div>
        )}

        {operator && assigned.length === 0 && (
          <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            Nenhuma conversa atribuída.
          </div>
        )}

        {assigned.map((conversation) => (
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
              className="btn-secondary text-xs"
              disabled={isBusy}
              onClick={() =>
                onRelease({
                  conversationId: conversation.id,
                  operatorId: operator.id,
                })
              }
            >
              Liberar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
