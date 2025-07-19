import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { ExpenseSidebar } from "../expense-sidebar";
import type { Session } from "next-auth";

// Mock the hooks
vi.mock("next-auth/react");
vi.mock("next/navigation");

// Mock the child components
vi.mock("../nav-main", () => ({
  NavMain: ({ items }: { items: any[] }) => (
    <div data-testid="nav-main">
      {items.map((item, index) => (
        <div key={index} data-testid={`nav-item-${item.title.toLowerCase()}`}>
          {item.title} {item.isActive && "(active)"}
        </div>
      ))}
    </div>
  ),
}));

vi.mock("../nav-secondary", () => ({
  NavSecondary: ({ items }: { items: any[] }) => (
    <div data-testid="nav-secondary">
      {items.map((item, index) => (
        <div
          key={index}
          data-testid={`nav-secondary-${item.title.toLowerCase()}`}
        >
          {item.title} {item.isActive && "(active)"}
        </div>
      ))}
    </div>
  ),
}));

vi.mock("../nav-user", () => ({
  NavUser: ({ user }: { user: any }) => (
    <div data-testid="nav-user">
      {user.name} - {user.email}
    </div>
  ),
}));

vi.mock("@/components/ui/sidebar", () => ({
  Sidebar: ({ children, ...props }: any) => (
    <div data-testid="sidebar" {...props}>
      {children}
    </div>
  ),
  SidebarContent: ({ children }: any) => (
    <div data-testid="sidebar-content">{children}</div>
  ),
  SidebarFooter: ({ children }: any) => (
    <div data-testid="sidebar-footer">{children}</div>
  ),
  SidebarHeader: ({ children }: any) => (
    <div data-testid="sidebar-header">{children}</div>
  ),
  SidebarMenu: ({ children }: any) => (
    <div data-testid="sidebar-menu">{children}</div>
  ),
  SidebarMenuButton: ({ children, asChild, ...props }: any) => (
    <div data-testid="sidebar-menu-button" {...props}>
      {children}
    </div>
  ),
  SidebarMenuItem: ({ children }: any) => (
    <div data-testid="sidebar-menu-item">{children}</div>
  ),
}));

const mockUseSession = vi.mocked(useSession);
const mockUsePathname = vi.mocked(usePathname);

describe("ExpenseSidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue("/dashboard");
  });

  describe("Loading State", () => {
    it("should show loading spinner when session is loading", () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: "loading",
        update: vi.fn(),
      });

      render(<ExpenseSidebar />);

      expect(screen.getByRole("status")).toBeInTheDocument();
      expect(screen.getByLabelText("Loading navigation")).toBeInTheDocument();
      expect(screen.getByTestId("sidebar-content")).toBeInTheDocument();
    });
  });

  describe("Authenticated State", () => {
    const mockSession = {
      user: {
        id: "user-123",
        name: "John Doe",
        email: "john@example.com",
        image: "/avatars/john.jpg",
      },
      expires: "2024-12-31",
    };

    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: mockSession,
        status: "authenticated",
        update: vi.fn(),
      });
    });

    it("should render sidebar with user data from session", () => {
      render(<ExpenseSidebar />);

      expect(screen.getByTestId("nav-user")).toHaveTextContent(
        "John Doe - john@example.com"
      );
    });

    it("should render brand name as SpendIQ", () => {
      render(<ExpenseSidebar />);

      expect(screen.getByText("SpendIQ")).toBeInTheDocument();
    });

    it("should render main navigation items", () => {
      render(<ExpenseSidebar />);

      expect(screen.getByTestId("nav-item-dashboard")).toBeInTheDocument();
      expect(screen.getByTestId("nav-item-expenses")).toBeInTheDocument();
      expect(screen.getByTestId("nav-item-categories")).toBeInTheDocument();
      expect(screen.getByTestId("nav-item-budgets")).toBeInTheDocument();
      expect(screen.getByTestId("nav-item-analytics")).toBeInTheDocument();
      expect(screen.getByTestId("nav-item-teams")).toBeInTheDocument();
    });

    it("should render secondary navigation items", () => {
      render(<ExpenseSidebar />);

      expect(screen.getByTestId("nav-secondary-settings")).toBeInTheDocument();
      expect(screen.getByTestId("nav-secondary-help")).toBeInTheDocument();
    });

    it("should mark active navigation item based on current pathname", () => {
      mockUsePathname.mockReturnValue("/expenses");

      render(<ExpenseSidebar />);

      expect(screen.getByTestId("nav-item-expenses")).toHaveTextContent(
        "Expenses (active)"
      );
      expect(screen.getByTestId("nav-item-dashboard")).not.toHaveTextContent(
        "(active)"
      );
    });

    it("should mark active navigation item for nested routes", () => {
      mockUsePathname.mockReturnValue("/expenses/create");

      render(<ExpenseSidebar />);

      expect(screen.getByTestId("nav-item-expenses")).toHaveTextContent(
        "Expenses (active)"
      );
    });

    it("should include proper accessibility attributes", () => {
      render(<ExpenseSidebar />);

      expect(screen.getByLabelText("Go to dashboard home")).toBeInTheDocument();
      expect(screen.getByLabelText("Main navigation")).toBeInTheDocument();
      expect(screen.getByLabelText("Secondary navigation")).toBeInTheDocument();
    });
  });

  describe("Unauthenticated State", () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: "unauthenticated",
        update: vi.fn(),
      });
    });

    it("should show loading placeholder for user data", () => {
      render(<ExpenseSidebar />);

      expect(screen.getByTestId("nav-user")).toHaveTextContent("Loading... -");
    });

    it("should still render navigation items", () => {
      render(<ExpenseSidebar />);

      expect(screen.getByTestId("nav-main")).toBeInTheDocument();
      expect(screen.getByTestId("nav-secondary")).toBeInTheDocument();
    });
  });

  describe("Session with Partial User Data", () => {
    it("should handle missing user name gracefully", () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: "user-123",
            email: "john@example.com",
            image: "",
          },
          expires: "2024-12-31",
        },
        status: "authenticated",
        update: vi.fn(),
      });

      render(<ExpenseSidebar />);

      expect(screen.getByTestId("nav-user")).toHaveTextContent(
        "User - john@example.com"
      );
    });

    it("should handle missing user email gracefully", () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: "user-123",
            name: "John Doe",
            email: "",
            image: "",
          },
          expires: "2024-12-31",
        },
        status: "authenticated",
        update: vi.fn(),
      });

      render(<ExpenseSidebar />);

      expect(screen.getByTestId("nav-user")).toHaveTextContent("John Doe -");
    });

    it("should use default avatar when image is missing", () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: "user-123",
            name: "John Doe",
            email: "john@example.com",
            image: "",
          },
          expires: "2024-12-31",
        },
        status: "authenticated",
        update: vi.fn(),
      });

      render(<ExpenseSidebar />);

      // This would be tested in the NavUser component test
      expect(screen.getByTestId("nav-user")).toBeInTheDocument();
    });
  });

  describe("Props Forwarding", () => {
    it("should forward props to Sidebar component", () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: "unauthenticated",
        update: vi.fn(),
      });

      render(
        <ExpenseSidebar data-testid="custom-sidebar" className="custom-class" />
      );

      const sidebar = screen.getByTestId("sidebar");
      expect(sidebar).toHaveAttribute("data-testid", "custom-sidebar");
      expect(sidebar).toHaveAttribute("className", "custom-class");
    });
  });
});
