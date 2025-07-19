import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { createMockSession } from "@/lib/test-utils";

// Mock dependencies first, before any imports that might use them
vi.mock("next-auth");
vi.mock("@/lib/services/category-service");
vi.mock("@/lib/prisma", () => ({
  prisma: {
    team: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    teamMember: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Now import the modules that use the mocks
import { GET, POST } from "../route";
import { createDefaultCategoriesForTeam } from "@/lib/services/category-service";
import { prisma } from "@/lib/prisma";

// Test constants - defined first to avoid hoisting issues
const TEST_USER_ID = "user-123";
const BASE_URL = "http://localhost:3000/api/teams";

const TEST_DATES = {
  FIXED_DATE: "2024-01-15T10:00:00.000Z",
  SESSION_EXPIRES: "2024-01-01",
} as const;

const TEST_TEAM_NAMES = {
  DEFAULT: "Test Team",
  NEW_TEAM: "New Team",
  TEAM_1: "Team 1",
  TEAM_2: "Team 2",
  LONG_NAME: "a".repeat(101), // Exceeds max length of 100
} as const;

const TEST_USER_DATA = {
  EMAIL: "test@example.com",
  NAME: "Test User",
} as const;

// Types for better type safety
interface MockTeam {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date; // Added missing required property
  members?: Array<{ role: string }>;
}

// Get the mocked functions
const mockGetServerSession = vi.mocked(getServerSession);
const mockCreateDefaultCategories = vi.mocked(createDefaultCategoriesForTeam);
const mockPrismaTeamFindMany = vi.mocked(prisma.team.findMany);
const mockPrismaTeamCreate = vi.mocked(prisma.team.create);
const mockPrismaTeamMemberCreate = vi.mocked(prisma.teamMember.create);
const mockPrismaTransaction = vi.mocked(prisma.$transaction);

// Test data factories with proper typing
const createMockTeam = (overrides: Partial<MockTeam> = {}): MockTeam => ({
  id: "team-123",
  name: TEST_TEAM_NAMES.DEFAULT,
  createdAt: new Date(TEST_DATES.FIXED_DATE),
  updatedAt: new Date(TEST_DATES.FIXED_DATE), // Added the required updatedAt property
  ...overrides,
});

const createMockTeamWithMembers = (
  overrides: Partial<MockTeam> = {}
): MockTeam => ({
  ...createMockTeam(),
  members: [{ role: "ADMIN" }],
  ...overrides,
});

// Test setup helpers
const setupAuthenticatedUser = () => {
  const mockSession = createMockSession({
    user: {
      id: TEST_USER_ID,
      email: TEST_USER_DATA.EMAIL,
      name: TEST_USER_DATA.NAME,
    },
  });
  mockGetServerSession.mockResolvedValue(mockSession);
  return mockSession;
};

const setupUnauthenticatedUser = () => {
  mockGetServerSession.mockResolvedValue(null);
};

const setupUserWithoutId = () => {
  mockGetServerSession.mockResolvedValue({
    user: {
      email: TEST_USER_DATA.EMAIL,
      name: TEST_USER_DATA.NAME,
      // Missing id property
    },
    expires: TEST_DATES.SESSION_EXPIRES,
  } as any);
};

// Request factory functions
const createGetRequest = () => new NextRequest(BASE_URL);

const createPostRequest = (body: Record<string, unknown>) =>
  new NextRequest(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

// Response assertion helpers
const expectUnauthorizedResponse = async (response: Response) => {
  expect(response.status).toBe(401);
  const data = await response.json();
  expect(data.error).toBe("Unauthorized");
};

const expectValidationErrorResponse = async (response: Response) => {
  expect(response.status).toBe(400);
  const data = await response.json();
  expect(data.error).toBe("Invalid team data");
  return data;
};

const expectSuccessResponse = async (
  response: Response,
  expectedStatus: number = 200
) => {
  expect(response.status).toBe(expectedStatus);
  return await response.json();
};

describe("/api/teams", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/teams", () => {
    it("should return 401 when user is not authenticated", async () => {
      setupUnauthenticatedUser();

      const request = createGetRequest();
      const response = await GET(request);

      await expectUnauthorizedResponse(response);
    });

    it("should return 401 when session exists but user is missing", async () => {
      mockGetServerSession.mockResolvedValue({
        user: null,
        expires: TEST_DATES.SESSION_EXPIRES,
      } as any);

      const request = createGetRequest();
      const response = await GET(request);

      await expectUnauthorizedResponse(response);
    });

    it("should return 401 when user exists but id is missing", async () => {
      setupUserWithoutId();

      const request = createGetRequest();
      const response = await GET(request);

      await expectUnauthorizedResponse(response);
    });

    it("should return teams when user is authenticated", async () => {
      setupAuthenticatedUser();
      const mockTeams = [
        createMockTeamWithMembers({
          id: "team-1",
          name: TEST_TEAM_NAMES.TEAM_1,
          members: [{ role: "ADMIN" }],
        }),
        createMockTeamWithMembers({
          id: "team-2",
          name: TEST_TEAM_NAMES.TEAM_2,
          members: [{ role: "EDITOR" }],
        }),
      ];

      mockPrismaTeamFindMany.mockResolvedValue(mockTeams);

      const request = createGetRequest();
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveLength(2);
      expect(data[0]).toEqual({
        id: "team-1",
        name: "Team 1",
        role: "ADMIN",
        createdAt: mockTeams[0].createdAt,
      });
      expect(data[1]).toEqual({
        id: "team-2",
        name: "Team 2",
        role: "EDITOR",
        createdAt: mockTeams[1].createdAt,
      });

      // Verify the correct Prisma query was called
      expect(mockPrismaTeamFindMany).toHaveBeenCalledWith({
        where: {
          members: {
            some: {
              userId: TEST_USER_ID,
            },
          },
        },
        include: {
          members: {
            where: {
              userId: TEST_USER_ID,
            },
            select: {
              role: true,
            },
          },
        },
      });
    });

    it("should return empty array when user has no teams", async () => {
      const mockSession = createMockSession({
        user: {
          id: TEST_USER_ID,
          email: TEST_USER_DATA.EMAIL,
          name: TEST_USER_DATA.NAME,
        },
      });
      mockGetServerSession.mockResolvedValue(mockSession);
      mockPrismaTeamFindMany.mockResolvedValue([]);

      const request = createGetRequest();
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual([]);
    });

    it("should handle database errors gracefully", async () => {
      const mockSession = createMockSession({
        user: {
          id: TEST_USER_ID,
          email: TEST_USER_DATA.EMAIL,
          name: TEST_USER_DATA.NAME,
        },
      });
      mockGetServerSession.mockResolvedValue(mockSession);
      mockPrismaTeamFindMany.mockRejectedValue(
        new Error("Database connection failed")
      );

      const request = createGetRequest();
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe("Failed to fetch teams");
    });
  });

  describe("POST /api/teams", () => {
    it("should return 401 when user is not authenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = createPostRequest({ name: TEST_TEAM_NAMES.NEW_TEAM });
      const response = await POST(request);

      await expectUnauthorizedResponse(response);
    });

    it("should return 401 when session exists but user is missing", async () => {
      mockGetServerSession.mockResolvedValue({
        user: null,
        expires: TEST_DATES.SESSION_EXPIRES,
      } as any);

      const request = createPostRequest({ name: TEST_TEAM_NAMES.NEW_TEAM });
      const response = await POST(request);

      await expectUnauthorizedResponse(response);
    });

    it("should return 400 when team name is missing", async () => {
      const mockSession = createMockSession({
        user: {
          id: TEST_USER_ID,
          email: TEST_USER_DATA.EMAIL,
          name: TEST_USER_DATA.NAME,
        },
      });
      mockGetServerSession.mockResolvedValue(mockSession);

      const request = createPostRequest({});
      const response = await POST(request);

      const data = await expectValidationErrorResponse(response);
      expect(data.details).toBeDefined();
    });

    it("should return 400 when team name is empty", async () => {
      const mockSession = createMockSession({
        user: {
          id: TEST_USER_ID,
          email: TEST_USER_DATA.EMAIL,
          name: TEST_USER_DATA.NAME,
        },
      });
      mockGetServerSession.mockResolvedValue(mockSession);

      const request = createPostRequest({ name: "" });
      const response = await POST(request);

      await expectValidationErrorResponse(response);
    });

    it("should return 400 when team name is too long", async () => {
      const mockSession = createMockSession({
        user: {
          id: TEST_USER_ID,
          email: TEST_USER_DATA.EMAIL,
          name: TEST_USER_DATA.NAME,
        },
      });
      mockGetServerSession.mockResolvedValue(mockSession);

      const request = createPostRequest({ name: TEST_TEAM_NAMES.LONG_NAME });
      const response = await POST(request);

      await expectValidationErrorResponse(response);
    });

    it("should create team when user is authenticated", async () => {
      const mockSession = createMockSession({
        user: {
          id: TEST_USER_ID,
          email: TEST_USER_DATA.EMAIL,
          name: TEST_USER_DATA.NAME,
        },
      });
      const mockTeam = createMockTeam({
        name: TEST_TEAM_NAMES.NEW_TEAM,
      });

      mockGetServerSession.mockResolvedValue(mockSession);
      mockPrismaTransaction.mockImplementation(async (callback: any) => {
        return await callback({
          team: {
            create: vi.fn().mockResolvedValue(mockTeam),
          },
          teamMember: {
            create: vi.fn(),
          },
        });
      });
      mockCreateDefaultCategories.mockResolvedValue(undefined);

      const request = createPostRequest({ name: TEST_TEAM_NAMES.NEW_TEAM });
      const response = await POST(request);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toEqual({
        id: mockTeam.id,
        name: TEST_TEAM_NAMES.NEW_TEAM,
        role: "ADMIN",
        createdAt: mockTeam.createdAt,
      });
      expect(mockCreateDefaultCategories).toHaveBeenCalledWith(mockTeam.id);
    });

    it("should handle database transaction errors", async () => {
      const mockSession = createMockSession({
        user: {
          id: TEST_USER_ID,
          email: TEST_USER_DATA.EMAIL,
          name: TEST_USER_DATA.NAME,
        },
      });
      mockGetServerSession.mockResolvedValue(mockSession);

      mockPrismaTransaction.mockRejectedValue(new Error("Database error"));

      const request = createPostRequest({ name: TEST_TEAM_NAMES.NEW_TEAM });
      const response = await POST(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe("Failed to create team");
    });

    it("should handle category service errors gracefully", async () => {
      const mockSession = createMockSession({
        user: {
          id: TEST_USER_ID,
          email: TEST_USER_DATA.EMAIL,
          name: TEST_USER_DATA.NAME,
        },
      });
      const mockTeam = createMockTeam({
        name: TEST_TEAM_NAMES.NEW_TEAM,
      });

      mockGetServerSession.mockResolvedValue(mockSession);
      mockPrismaTransaction.mockImplementation(async (callback: any) => {
        return await callback({
          team: {
            create: vi.fn().mockResolvedValue(mockTeam),
          },
          teamMember: {
            create: vi.fn(),
          },
        });
      });
      mockCreateDefaultCategories.mockRejectedValue(
        new Error("Category service error")
      );

      const request = createPostRequest({ name: TEST_TEAM_NAMES.NEW_TEAM });
      const response = await POST(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe("Failed to create team");
    });
  });
});
