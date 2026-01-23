import prisma from "@WhatLead/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../index";

export const leadRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().nullish(),
        stage: z.string().optional(),
        search: z.string().optional(),
        organizationId: z.string(), // Obrigatório para filtrar por tenant
      }),
    )
    .query(async ({ input }) => {
      const { limit, cursor, stage, search, organizationId } = input;

      const items = await prisma.lead.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        where: {
          tenantId: organizationId, // Usando organizationId como tenantId
          stage: stage,
          OR: search
            ? [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } },
              ]
            : undefined,
        },
        include: {
          conversations: {
            orderBy: { lastMessageAt: "desc" },
            take: 1,
            select: {
              id: true,
              lastMessageAt: true,
              status: true,
              messages: {
                orderBy: { occurredAt: "desc" },
                take: 1,
                select: {
                  contentRef: true, // Assumindo que o conteúdo está aqui ou adaptar
                  type: true,
                },
              },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (items.length > limit) {
        const nextItem = items.pop();
        nextCursor = nextItem!.id;
      }

      return {
        items,
        nextCursor,
      };
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const lead = await prisma.lead.findUnique({
        where: { id: input.id },
        include: {
          conversations: {
            orderBy: { lastMessageAt: "desc" },
            take: 5,
          },
        },
      });

      if (!lead) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found" });
      }

      return lead;
    }),

  updateStage: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        stage: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      return prisma.lead.update({
        where: { id: input.id },
        data: { stage: input.stage },
      });
    }),
});
