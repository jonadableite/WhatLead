"use client";

import { useQuery } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, Clock, Filter, Mail, Phone, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useActiveOrganization } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";
import type { AppRouter } from "@WhatLead/api/routers/index";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type LeadItem = RouterOutputs["lead"]["list"]["items"][number];

const STAGE_COLORS: Record<string, string> = {
  NEW: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  QUALIFIED: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  NEGOTIATION: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  WON: "bg-green-500/10 text-green-500 border-green-500/20",
  LOST: "bg-red-500/10 text-red-500 border-red-500/20",
};

export default function LeadsPage() {
  const router = useRouter();
  const { data: activeOrg } = useActiveOrganization();
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState<string | undefined>(undefined);

  const leadsQuery = trpc.lead.list.queryOptions({
    organizationId: activeOrg?.id ?? "noop",
    search: searchTerm || undefined,
    stage: stageFilter,
    limit: 50,
  });

  const { data: leadsData, isLoading } = useQuery({
    ...leadsQuery,
    enabled: !!activeOrg?.id,
  });

  if (!activeOrg) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">
          Select an organization to view leads.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leads & CRM</h1>
          <p className="text-muted-foreground">
            Manage your leads and track their journey through the funnel.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search leads by name, email or phone..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {["NEW", "QUALIFIED", "NEGOTIATION", "WON", "LOST"].map((stage) => (
            <Badge
              key={stage}
              variant="outline"
              className={`cursor-pointer ${
                stageFilter === stage
                  ? STAGE_COLORS[stage]
                  : "bg-background hover:bg-accent"
              }`}
              onClick={() =>
                setStageFilter(stageFilter === stage ? undefined : stage)
              }
            >
              {stage}
            </Badge>
          ))}
        </div>
      </div>

      {/* Leads List */}
      <div className="grid gap-4 md:grid-cols-1">
        {isLoading ? (
          <div className="text-center py-10 text-muted-foreground">
            Loading leads...
          </div>
        ) : leadsData?.items.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            No leads found.
          </div>
        ) : (
          leadsData?.items.map((lead: LeadItem) => {
            const lastConversation = lead.conversations[0];
            const lastMessage = lastConversation?.messages[0];

            return (
              <Card
                key={lead.id}
                className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-md"
                onClick={() =>
                  router.push(`/conversations/${lastConversation?.id || ""}`)
                }
              >
                <CardContent className="p-4 flex items-center gap-4">
                  {/* Avatar / Initials */}
                  <Avatar className="h-10 w-10 border">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {lead.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  {/* Main Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{lead.name}</h3>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 h-5 ${STAGE_COLORS[lead.stage] || "bg-gray-500/10 text-gray-500"}`}
                      >
                        {lead.stage}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {lead.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {lead.phone}
                      </span>
                    </div>
                  </div>

                  {/* Last Activity */}
                  <div className="flex flex-col items-end gap-1 text-right min-w-[150px]">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {lastConversation?.lastMessageAt
                        ? formatDistanceToNow(
                            new Date(lastConversation.lastMessageAt),
                            { addSuffix: true },
                          )
                        : "No activity"}
                    </div>
                    {lastMessage && (
                      <p className="text-xs text-zinc-500 max-w-[200px] truncate">
                        {lastMessage.type === "text"
                          ? "Last message content..."
                          : `Sent a ${lastMessage.type}`}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}
