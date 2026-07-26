"use client";

import { LoaderCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/providers/auth-provider";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const isPublicRoute = pathname === "/login";

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isPublicRoute) {
      router.replace("/login");
    }

    if (!isLoading && isAuthenticated && isPublicRoute) {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, isPublicRoute, router]);

  if (isLoading || (!isAuthenticated && !isPublicRoute) || (isAuthenticated && isPublicRoute)) {
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
