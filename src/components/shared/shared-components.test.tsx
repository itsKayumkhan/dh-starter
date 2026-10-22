import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CircleHelp } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";

describe("shared display components", () => {
  it("renders empty guidance and action", () => {
    render(
      <EmptyState
        icon={CircleHelp}
        title="Nothing here"
        description="Add a record"
        action={<button>Add</button>}
      />,
    );
    expect(screen.getByText("Nothing here")).toBeTruthy();
    expect(screen.getByText("Add a record")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Add" })).toBeTruthy();
  });

  it("renders page heading and actions", () => {
    render(
      <PageHeader
        title="People"
        description="Manage accounts"
        actions={<button>Invite</button>}
      />,
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "People" }),
    ).toBeTruthy();
    expect(screen.getByText("Manage accounts")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Invite" })).toBeTruthy();
  });

  it("renders stat value and delta", () => {
    render(
      <StatCard icon={CircleHelp} title="Users" value={42} delta="Up 2" />,
    );
    expect(screen.getByText("Users")).toBeTruthy();
    expect(screen.getByText("42")).toBeTruthy();
    expect(screen.getByText("Up 2")).toBeTruthy();
  });
});

describe("ConfirmDialog", () => {
  it("opens, confirms, and disables actions while pending", async () => {
    let resolveConfirm: () => void = () => {};
    const onConfirm = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveConfirm = resolve;
        }),
    );
    render(
      <ConfirmDialog
        trigger={<button>Open confirm</button>}
        title="Archive item"
        description="Archive it now?"
        onConfirm={onConfirm}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Open confirm" }));
    expect(screen.getByRole("alertdialog")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(
      (screen.getByRole("button", { name: "Confirm" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(
      (screen.getByRole("button", { name: "Cancel" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    resolveConfirm();
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
  });

  it("uses the destructive button variant", () => {
    render(
      <ConfirmDialog
        trigger={<button>Delete</button>}
        title="Delete item"
        description="Delete it?"
        confirmLabel="Delete now"
        destructive
        onConfirm={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(
      screen
        .getByRole("button", { name: "Delete now" })
        .getAttribute("data-variant"),
    ).toBe("destructive");
  });
});
