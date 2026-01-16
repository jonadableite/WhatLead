import prisma from "@WhatLead/db";
import { businessLogger, perfLogger } from "@WhatLead/logger";
import { TRPCError } from "@trpc/server";
import z from "zod";

import { publicProcedure, router } from "../index";

export const todoRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const timer = perfLogger.startTimer("get_all_todos", { userId: ctx.user?.id });

    try {
      const todos = await prisma.todo.findMany({
        orderBy: { id: "asc" },
      });

      timer.end({ todoCount: todos.length });
      return todos;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      timer.fail(err);
      throw err;
    }
  }),

  create: publicProcedure
    .input(z.object({ text: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const timer = perfLogger.startTimer("create_todo", {
        userId: ctx.user?.id,
        textLength: input.text.length
      });

      try {
        const todo = await prisma.todo.create({
          data: {
            text: input.text,
          },
        });

        timer.end({ todoId: todo.id });
        businessLogger.userAction("created_todo", {
          todoId: todo.id,
          userId: ctx.user?.id,
          textLength: input.text.length,
        });

        return todo;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        timer.fail(err);
        throw err;
      }
    }),

  toggle: publicProcedure
    .input(z.object({ id: z.number(), completed: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const timer = perfLogger.startTimer("toggle_todo", {
        userId: ctx.user?.id,
        todoId: input.id,
        newStatus: input.completed
      });

      try {
        const todo = await prisma.todo.update({
          where: { id: input.id },
          data: { completed: input.completed },
        });

        timer.end({ todoId: todo.id });
        businessLogger.userAction("toggled_todo", {
          todoId: todo.id,
          userId: ctx.user?.id,
          completed: input.completed,
        });

        return todo;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        timer.fail(err);
        const prismaCode =
          typeof error === "object" && error !== null && "code" in error
            ? (error as { code?: unknown }).code
            : undefined;

        if (prismaCode === "P2025") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Todo not found",
          });
        }
        throw err;
      }
    }),

  delete: publicProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
    const timer = perfLogger.startTimer("delete_todo", {
      userId: ctx.user?.id,
      todoId: input.id
    });

    try {
      const todo = await prisma.todo.delete({
        where: { id: input.id },
      });

      timer.end({ todoId: todo.id });
      businessLogger.userAction("deleted_todo", {
        todoId: todo.id,
        userId: ctx.user?.id,
        text: todo.text.substring(0, 50),
      });

      return todo;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      timer.fail(err);
      const prismaCode =
        typeof error === "object" && error !== null && "code" in error
          ? (error as { code?: unknown }).code
          : undefined;

      if (prismaCode === "P2025") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Todo not found",
        });
      }
      throw err;
    }
  }),
});
