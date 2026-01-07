import { type NextRequest, NextResponse } from "next/server";

/**
 * Middleware de proteção de rotas
 *
 * Verifica a presença do cookie de sessão do Better Auth
 * para proteger rotas que requerem autenticação.
 *
 * Nota: Este middleware verifica apenas a PRESENÇA do cookie,
 * não sua validade. A validação completa é feita no server-side
 * de cada página protegida via authClient.getSession().
 */

// Rotas que requerem autenticação
const protectedRoutes = [
	"/dashboard",
	"/admin",
	"/organization",
	"/todos",
	"/ai",
];

// Rotas públicas (não requerem autenticação)
const publicRoutes = [
	"/",
	"/login",
	"/verify-email",
	"/forgot-password",
	"/reset-password",
	"/invite",
];

// Nome do cookie de sessão do Better Auth
const SESSION_COOKIE_NAME = "better-auth.session_token";

export function middleware(request: NextRequest): NextResponse {
	const { pathname } = request.nextUrl;

	// Verificar se é uma rota protegida
	const isProtectedRoute = protectedRoutes.some((route) =>
		pathname.startsWith(route),
	);

	// Verificar se é uma rota pública
	const isPublicRoute = publicRoutes.some(
		(route) => pathname === route || pathname.startsWith(`${route}/`),
	);

	// Ignorar arquivos estáticos e API routes
	if (
		pathname.startsWith("/_next") ||
		pathname.startsWith("/api") ||
		pathname.includes(".") // arquivos estáticos
	) {
		return NextResponse.next();
	}

	// Obter cookie de sessão
	const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
	const hasSession = !!sessionCookie?.value;

	// Se é rota protegida e não tem sessão, redirecionar para login
	if (isProtectedRoute && !hasSession) {
		const loginUrl = new URL("/login", request.url);
		// Adicionar redirect para voltar após login
		loginUrl.searchParams.set("redirect", pathname);
		return NextResponse.redirect(loginUrl);
	}

	// Se está na página de login e já tem sessão, redirecionar para dashboard
	if (pathname === "/login" && hasSession) {
		// Verificar se há um redirect pendente
		const redirect = request.nextUrl.searchParams.get("redirect");
		if (redirect && !publicRoutes.some((route) => redirect.startsWith(route))) {
			return NextResponse.redirect(new URL(redirect, request.url));
		}
		return NextResponse.redirect(new URL("/dashboard", request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public folder
		 */
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
