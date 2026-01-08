import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";

import { auth } from "@WhatLead/auth";
import { fromNodeHeaders } from "better-auth/node";

export async function createContext({ req, res }: CreateFastifyContextOptions) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  // Extract traceId from Fastify request (set by middleware)
  const traceId = (req as any).traceId || (req as any).id;

  return {
    session,
    req: { id: traceId },
    user: session?.user,
    traceId,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
