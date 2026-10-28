import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BlockForm } from "@/modules/cms/components/block-form";

const { saveBlock, resetBlock } = vi.hoisted(() => ({
  saveBlock: vi.fn(),
  resetBlock: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/modules/cms/server/actions", () => ({ saveBlock, resetBlock }));

beforeEach(() => {
  vi.clearAllMocks();
  saveBlock.mockResolvedValue({ ok: true, data: { key: "home.faq" } });
  resetBlock.mockResolvedValue({ ok: true, data: { key: "home.faq" } });
});

describe("generated block form", () => {
  it("adds, removes and reorders list items", async () => {
    render(
      <BlockForm
        initialRevision={null}
        blockKey="home.faq"
        initialValue={{ heading: "Questions", items: [] }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Add questions" }));
    fireEvent.change(screen.getByLabelText("Question"), {
      target: { value: "First" },
    });
    fireEvent.change(screen.getByLabelText("Answer"), {
      target: { value: "One" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add questions" }));
    fireEvent.change(screen.getAllByLabelText("Question")[1], {
      target: { value: "Second" },
    });
    fireEvent.change(screen.getAllByLabelText("Answer")[1], {
      target: { value: "Two" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Move up" })[1]);
    expect(
      (screen.getAllByLabelText("Question")[0] as HTMLInputElement).value,
    ).toBe("Second");
    fireEvent.click(screen.getAllByRole("button", { name: "Remove" })[1]);
    expect(screen.getAllByLabelText("Question")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Save block" }));
    await waitFor(() =>
      expect(saveBlock).toHaveBeenCalledWith({
        key: "home.faq",
        revision: null,
        value: {
          heading: "Questions",
          items: [{ question: "Second", answer: "Two" }],
        },
      }),
    );
  });
  it("shows schema validation errors for missing item fields", async () => {
    render(
      <BlockForm
        initialRevision={null}
        blockKey="home.faq"
        initialValue={{ heading: "Questions", items: [] }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Add questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Save block" }));
    await waitFor(() =>
      expect(screen.getAllByRole("alert").length).toBeGreaterThan(0),
    );
    expect(saveBlock).not.toHaveBeenCalled();
  });
});
