import prisma from "@WhatLead/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../index";

export const conversationRouter = router({
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const conversation = await prisma.conversation.findUnique({
        where: { id: input.id },
        include: {
          messages: {
            orderBy: { occurredAt: "asc" },
          },
          lead: true,
        },
      });

      if (!conversation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Conversation not found" });
      }

      return conversation;
    }),

  listByLead: protectedProcedure
    .input(z.object({ leadId: z.string() }))
    .query(async ({ input }) => {
      return prisma.conversation.findMany({
        where: { leadId: input.leadId },
        orderBy: { lastMessageAt: "desc" },
        include: {
          messages: {
            orderBy: { occurredAt: "desc" },
            take: 1,
          },
        },
      });
    }),
});
