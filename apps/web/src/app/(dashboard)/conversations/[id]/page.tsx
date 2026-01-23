"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  Clock,
  MoreVertical,
  Send,
  ShieldAlert,
  User,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
type Message = {
  id: string;
  direction: string;
  type: string;
  sentBy: string;
  occurredAt: string | Date;
};

export default function ConversationPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [newMessage, setNewMessage] = useState("");

  const conversationQuery = trpc.conversation.get.queryOptions({ id });
  const { data: conversation, isLoading } = useQuery({
    ...conversationQuery,
    refetchInterval: 5000,
  });

  const leadQuery = trpc.lead.get.queryOptions({
    id: conversation?.leadId ?? "noop",
  });
  const { data: lead } = useQuery({
    ...leadQuery,
    enabled: !!conversation?.leadId,
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        Loading conversation...
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex h-full items-center justify-center">
        Conversation not found.
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-2rem)] flex-col gap-4 md:flex-row">
      {/* Main Chat Area */}
      <Card className="flex flex-1 flex-col overflow-hidden border-white/10 bg-white/5">
        {/* Chat Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback className="bg-indigo-500/20 text-indigo-400 font-bold">
                  {lead?.name?.slice(0, 2).toUpperCase() || "CN"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold leading-none">
                  {lead?.name || "Contact"}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-[10px] h-4 px-1">
                    {conversation.status}
                  </Badge>
                  {conversation.slaBreachedAt && (
                    <Badge
                      variant="destructive"
                      className="text-[10px] h-4 px-1"
                    >
                      SLA Breached
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-xs text-muted-foreground">Assigned to</span>
              <span className="text-sm font-medium">
                {conversation.assignedAgentId ? "Agent Smith" : "Unassigned"}
              </span>
            </div>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages Timeline */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-6">
            {conversation.messages.map((message: Message) => {
              const isOutbound = message.direction === "OUTBOUND";
              const isSystem = message.sentBy === "SYSTEM";
              const isAgent =
                message.sentBy === "AGENT" || message.sentBy === "AI_AGENT";

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex w-full gap-2",
                    isOutbound ? "justify-end" : "justify-start",
                    isSystem && "justify-center",
                  )}
                >
                  {/* Avatar for Inbound */}
                  {!isOutbound && !isSystem && (
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarFallback className="bg-zinc-700 text-xs">
                        {lead?.name?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div
                    className={cn(
                      "flex flex-col max-w-[70%]",
                      isOutbound ? "items-end" : "items-start",
                      isSystem && "items-center w-full max-w-full",
                    )}
                  >
                    {/* Metadata / Actor Badge */}
                    {!isSystem && (
                      <div className="flex items-center gap-2 mb-1 text-[10px] text-muted-foreground">
                        {isOutbound ? (
                          <>
                            <span>
                              {format(new Date(message.occurredAt), "HH:mm")}
                            </span>
                            <Badge
                              variant="secondary"
                              className="h-4 px-1 text-[9px] gap-1"
                            >
                              {isAgent ? (
                                <Bot className="h-3 w-3" />
                              ) : (
                                <User className="h-3 w-3" />
                              )}
                              {message.sentBy === "AI_AGENT"
                                ? "AI Agent"
                                : "Human"}
                            </Badge>
                          </>
                        ) : (
                          <>
                            <span>{lead?.name}</span>
                            <span>
                              {format(new Date(message.occurredAt), "HH:mm")}
                            </span>
                          </>
                        )}
                      </div>
                    )}

                    {/* Message Bubble */}
                    {isSystem ? (
                      <div className="flex items-center gap-2 py-2 px-4 rounded-full bg-zinc-800/50 text-xs text-zinc-400 border border-white/5">
                        <Clock className="h-3 w-3" />
                        {/* Assuming content is stored in metadata or contentRef for now */}
                        <span>System Event: {message.type}</span>
                      </div>
                    ) : (
                      <div
                        className={cn(
                          "p-3 rounded-2xl text-sm relative group",
                          isOutbound
                            ? "bg-indigo-600 text-white rounded-tr-none"
                            : "bg-zinc-800 text-zinc-200 rounded-tl-none",
                        )}
                      >
                        {/* Message Content - simplified for demo */}
                        <p>
                          {/* In a real app, fetch content from storage using contentRef */}
                          This is a placeholder for message content. Type:{" "}
                          {message.type}
                        </p>

                        {/* Gate Decision Visualization (Mock) */}
                        {isOutbound && message.sentBy === "AI_AGENT" && (
                          <div className="absolute -left-6 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <ShieldAlert className="h-4 w-4 text-green-500" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Gate: Allowed (Confidence 98%)</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t border-white/10 bg-black/20">
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="bg-zinc-900 border-white/10"
            />
            <Button size="icon" className="bg-indigo-600 hover:bg-indigo-500">
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
            <div className="flex gap-2">
              <span className="flex items-center gap-1">
                <Bot className="h-3 w-3" /> AI Copilot Active
              </span>
            </div>
            <span>Press Enter to send</span>
          </div>
        </div>
      </Card>

      {/* Context Sidebar */}
      <Card className="w-full md:w-80 border-white/10 bg-white/5 p-4 flex flex-col gap-6">
        <div>
          <h3 className="font-semibold text-sm mb-4 text-muted-foreground uppercase tracking-wider">
            Lead Context
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium truncate max-w-[150px]">
                {lead?.email}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-muted-foreground">Phone</span>
              <span className="font-medium">{lead?.phone}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-muted-foreground">Stage</span>
              <Badge variant="outline" className="h-5">
                {lead?.stage}
              </Badge>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-sm mb-4 text-muted-foreground uppercase tracking-wider">
            Actor Context
          </h3>
          <div className="rounded-lg bg-zinc-900/50 p-3 border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-xs text-indigo-400 font-medium">
              <Bot className="h-3 w-3" />
              <span>Current AI State</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Agent is currently analyzing customer intent. Sentiment detected
              as neutral. Next recommended action: Propose a demo call.
            </p>
          </div>
        </div>

        <div className="mt-auto">
          <Button
            variant="outline"
            className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10"
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            Escalate to Human
          </Button>
        </div>
      </Card>
    </div>
  );
}
