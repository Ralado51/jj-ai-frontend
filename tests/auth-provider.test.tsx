import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AUTH_EXPIRED_EVENT } from "@/lib/api";
import {
  clearAccessToken,
  getAccessToken,
  getCurrentUser,
  login as loginRequest,
  saveAccessToken,
} from "@/lib/auth";
import { AuthProvider, useAuth } from "@/providers/auth-provider";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("@/lib/auth", () => ({
  clearAccessToken: vi.fn(),
  getAccessToken: vi.fn(),
  getCurrentUser: vi.fn(),
  login: vi.fn(),
  saveAccessToken: vi.fn(),
}));

function AuthProbe() {
  const auth = useAuth();

  return (
    <div>
      <span data-testid="loading">{String(auth.isLoading)}</span>
      <span data-testid="authenticated">{String(auth.isAuthenticated)}</span>
      <span data-testid="user">{auth.user?.email ?? "none"}</span>
      <button
        type="button"
        onClick={() =>
          void auth.login({ email: "airton@example.com", password: "secret" })
        }
      >
        Login
      </button>
      <button type="button" onClick={auth.logout}>
        Logout
      </button>
    </div>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAccessToken).mockReturnValue(null);
  });

  it("finishes initialization as unauthenticated when there is no token", async () => {
    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("loading")).toHaveTextContent("false"),
    );
    expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
    expect(getCurrentUser).not.toHaveBeenCalled();
  });

  it("restores an authenticated session from a stored token", async () => {
    vi.mocked(getAccessToken).mockReturnValue("jwt-token");
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "user-1",
      email: "airton@example.com",
      full_name: "Airton Justino",
      role: "admin",
      is_active: true,
    });

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("authenticated")).toHaveTextContent("true"),
    );
    expect(screen.getByTestId("user")).toHaveTextContent("airton@example.com");
  });

  it("persists login data and redirects to the dashboard", async () => {
    vi.mocked(loginRequest).mockResolvedValue({
      access_token: "jwt-token",
      token_type: "bearer",
      user: {
        id: "user-1",
        email: "airton@example.com",
        full_name: "Airton Justino",
        role: "admin",
        is_active: true,
      },
    });

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("loading")).toHaveTextContent("false"),
    );

    await act(async () => {
      screen.getByRole("button", { name: "Login" }).click();
    });

    expect(saveAccessToken).toHaveBeenCalledWith("jwt-token");
    expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
    expect(replace).toHaveBeenCalledWith("/");
  });

  it("clears the session and redirects on logout", async () => {
    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("loading")).toHaveTextContent("false"),
    );

    screen.getByRole("button", { name: "Logout" }).click();

    expect(clearAccessToken).toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith("/login");
  });

  it("ends the session when the API reports an expired token", async () => {
    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("loading")).toHaveTextContent("false"),
    );

    act(() => {
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    });

    expect(clearAccessToken).toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith("/login?reason=session-expired");
  });
});
