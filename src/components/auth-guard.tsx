"use client";

import { LoaderCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/providers/auth-provider";

const PUBLIC_ROUTES = ["/login", "/forgot-password", "/reset-password"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
  const isLoginRoute = pathname === "/login";

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isPublicRoute) {
      router.replace("/login");
    }

    if (!isLoading && isAuthenticated && isLoginRoute) {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, isLoginRoute, isPublicRoute, router]);

  if (
    isLoading ||
    (!isAuthenticated && !isPublicRoute) ||
    (isAuthenticated && isLoginRoute)
  ) {
    return (
      <main className="grid min-h-screen place-items-center bg-background">
        <div className="flex items-center gap-3 text-sm text-muted">
          <LoaderCircle className="animate-spin" size={20} />
          Carregando sessão
        </div>
      </main>
    );
  }

  return children;
}
