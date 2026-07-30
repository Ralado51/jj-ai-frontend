import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "@/lib/api";
import {
  clearAccessToken,
  getAccessToken,
  getCurrentUser,
  login,
  saveAccessToken,
} from "@/lib/auth";

vi.mock("@/lib/api", () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe("auth helpers", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  it("persists, reads and clears the access token", () => {
    expect(getAccessToken()).toBeNull();

    saveAccessToken("token-123");
    expect(getAccessToken()).toBe("token-123");

    clearAccessToken();
    expect(getAccessToken()).toBeNull();
  });

  it("sends login credentials and returns the authenticated user", async () => {
    const response = {
      access_token: "jwt-token",
      token_type: "bearer",
      user: {
        id: "user-1",
        email: "airton@example.com",
        full_name: "Airton Justino",
        role: "admin",
        is_active: true,
      },
    };

    vi.mocked(api.post).mockResolvedValueOnce({ data: response });

    await expect(
      login({ email: "airton@example.com", password: "secret" }),
    ).resolves.toEqual(response);

    expect(api.post).toHaveBeenCalledWith("/api/v1/auth/login", {
      email: "airton@example.com",
      password: "secret",
    });
  });

  it("propagates invalid login errors", async () => {
    const error = new Error("Credenciais inválidas");
    vi.mocked(api.post).mockRejectedValueOnce(error);

    await expect(
      login({ email: "airton@example.com", password: "wrong" }),
    ).rejects.toBe(error);
  });

  it("loads the current authenticated user", async () => {
    const user = {
      id: "user-1",
      email: "airton@example.com",
      full_name: "Airton Justino",
      role: "admin",
      is_active: true,
    };

    vi.mocked(api.get).mockResolvedValueOnce({ data: user });

    await expect(getCurrentUser()).resolves.toEqual(user);
    expect(api.get).toHaveBeenCalledWith("/api/v1/auth/me");
  });
});
