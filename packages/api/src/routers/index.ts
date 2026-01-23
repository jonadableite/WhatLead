import { protectedProcedure, publicProcedure, router } from "../index";
import { todoRouter } from "./todo";
import { leadRouter } from "./lead";
import { conversationRouter } from "./conversation";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => {
		return "OK";
	}),
	privateData: protectedProcedure.query(({ ctx }) => {
		return {
			message: "This is private",
			user: ctx.session.user,
		};
	}),
	todo: todoRouter,
	lead: leadRouter,
	conversation: conversationRouter,
});
export type AppRouter = typeof appRouter;
