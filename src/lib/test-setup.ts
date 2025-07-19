import { vi } from "vitest";
import "@testing-library/jest-dom";

// Mock environment variables
process.env.JWT_SECRET = "test-secret-for-testing";
process.env.NEXTAUTH_SECRET = "test-nextauth-secret";
process.env.NEXTAUTH_URL = "http://localhost:3000";

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
};

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: vi.fn(() => "/dashboard"),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

// Mock NextAuth
vi.mock("next-auth/react", () => ({
  useSession: vi.fn(() => ({
    data: null,
    status: "loading",
    update: vi.fn(),
  })),
  signOut: vi.fn(),
  signIn: vi.fn(),
}));
