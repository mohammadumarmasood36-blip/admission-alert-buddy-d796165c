import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import FeeSubmission from "../FeeSubmission";
import ErrorBoundary from "@/components/ErrorBoundary";

// Mock supabase client
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: null }),
        }),
      }),
      insert: () => Promise.resolve({ data: null, error: null }),
    }),
    functions: { invoke: () => Promise.resolve({ data: null, error: null }) },
  },
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: { name: "Cashier" }, session: "2025-26" }),
}));

vi.mock("@/context/SchoolContext", () => ({
  useSchool: () => ({ students: [] }),
}));

describe("FeeSubmission", () => {
  it("renders the search step without a selected student and does not crash", () => {
    render(
      <MemoryRouter>
        <ErrorBoundary>
          <FeeSubmission />
        </ErrorBoundary>
      </MemoryRouter>
    );
    // Search heading visible
    expect(screen.getByText(/Search Student/i)).toBeInTheDocument();
    // PaymentModeDialog must NOT be in the DOM when no student is selected
    expect(screen.queryByText(/Select Payment Mode/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Locked Amount/i)).not.toBeInTheDocument();
  });

  it("ErrorBoundary catches runtime errors and shows fallback", () => {
    const Boom = () => {
      throw new Error("boom");
    };
    // Silence expected error log
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    spy.mockRestore();
  });
});
