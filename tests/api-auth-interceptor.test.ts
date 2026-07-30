import type { AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { api, AUTH_EXPIRED_EVENT, TOKEN_KEY } from "@/lib/api";

describe("API authentication interceptors", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("adds the bearer token to outgoing requests", async () => {
    window.localStorage.setItem(TOKEN_KEY, "jwt-token");

    const handler = api.interceptors.request.handlers[0]?.fulfilled;
    expect(handler).toBeTypeOf("function");

    const config = {
      headers: {},
    } as InternalAxiosRequestConfig;

    const result = await handler?.(config);

    expect(result?.headers.Authorization).toBe("Bearer jwt-token");
  });

  it("clears the token and dispatches the expiration event on 401", async () => {
    window.localStorage.setItem(TOKEN_KEY, "expired-token");
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");

    const handler = api.interceptors.response.handlers[0]?.rejected;
    expect(handler).toBeTypeOf("function");

    const error = { response: { status: 401 } };

    await expect(handler?.(error)).rejects.toBe(error);

    expect(window.localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(Event));
    expect((dispatchSpy.mock.calls[0]?.[0] as Event).type).toBe(AUTH_EXPIRED_EVENT);
  });

  it("keeps the token for non-authentication errors", async () => {
    window.localStorage.setItem(TOKEN_KEY, "valid-token");

    const handler = api.interceptors.response.handlers[0]?.rejected;
    const error = { response: { status: 500 } };

    await expect(handler?.(error)).rejects.toBe(error);
    expect(window.localStorage.getItem(TOKEN_KEY)).toBe("valid-token");
  });
});
