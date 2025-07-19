import { Session } from "next-auth";

/**
 * Creates a mock NextAuth session for testing
 * @param overrides Optional overrides for the session
 * @returns A mock session object
 */
export function createMockSession(overrides: Partial<Session> = {}): Session {
  return {
    user: {
      id: "user-1",
      email: "test@example.com",
      name: "Test User",
      ...overrides.user,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
    ...overrides,
  };
}

/**
 * Creates a mock request object for testing API routes
 * @param url The URL for the request
 * @param method The HTTP method
 * @param body The request body
 * @returns A mock request object
 */
export function createMockRequest(
  url: string,
  method: string = "GET",
  body: any = null
): Request {
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  return new Request(url, options);
}

/**
 * Creates a complete mock user for testing
 * @param overrides Optional overrides for the user
 * @returns A mock user object
 */
export function createMockUser(
  overrides: Partial<{ id: string; email: string; name: string }> = {}
) {
  return {
    id: "user-123",
    email: "test@example.com",
    name: "Test User",
    ...overrides,
  };
}

/**
 * Creates a mock session with a complete user object
 * @param userOverrides Optional overrides for the user
 * @param sessionOverrides Optional overrides for the session
 * @returns A mock session with complete user
 */
export function createMockSessionWithUser(
  userOverrides: Partial<{ id: string; email: string; name: string }> = {},
  sessionOverrides: Partial<Session> = {}
): Session {
  return createMockSession({
    user: createMockUser(userOverrides),
    ...sessionOverrides,
  });
}
