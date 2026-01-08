import { TRPCError } from "@trpc/server";
import prisma from "@WhatLead/db";
import { businessLogger, perfLogger } from "@WhatLead/logger";
import z from "zod";

import { publicProcedure, router } from "../index";

export const todoRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const timer = perfLogger.startTimer("get_all_todos", { userId: ctx.user?.id });

    try {
      const todos = await prisma.todo.findMany({
        where: ctx.user?.id ? { userId: ctx.user.id } : undefined,
        orderBy: { id: "asc" },
      });

      timer.end({ todoCount: todos.length });
      return todos;
    } catch (error) {
      timer.fail(error);
      throw error;
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
            userId: ctx.user?.id,
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
        timer.fail(error);
        throw error;
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
          where: { id: input.id, userId: ctx.user?.id },
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
        timer.fail(error);
        if (error.code === 'P2025') {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Todo not found",
          });
        }
        throw error;
      }
    }),

  delete: publicProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
    const timer = perfLogger.startTimer("delete_todo", {
      userId: ctx.user?.id,
      todoId: input.id
    });

    try {
      const todo = await prisma.todo.delete({
        where: { id: input.id, userId: ctx.user?.id },
      });

      timer.end({ todoId: todo.id });
      businessLogger.userAction("deleted_todo", {
        todoId: todo.id,
        userId: ctx.user?.id,
        text: todo.text.substring(0, 50),
      });

      return todo;
    } catch (error) {
      timer.fail(error);
      if (error.code === 'P2025') {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Todo not found",
        });
      }
      throw error;
    }
  }),
});
