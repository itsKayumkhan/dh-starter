import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { settingsDefaults } from "@/config/settings";
import { SettingsForm } from "@/modules/cms/components/settings-form";

const { saveSettings } = vi.hoisted(() => ({ saveSettings: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/modules/cms/server/actions", () => ({ saveSettings }));

beforeEach(() => {
  vi.clearAllMocks();
  saveSettings.mockResolvedValue({
    ok: true,
    data: { changedKeys: ["email"] },
  });
});

describe("site settings form", () => {
  it("saves edited email colors and numeric button radius", async () => {
    render(
      <SettingsForm
        initialValue={settingsDefaults}
        initialRevision={"0".repeat(64)}
      />,
    );
    fireEvent.change(screen.getByLabelText("Button background color"), {
      target: { value: "#123456" },
    });
    fireEvent.change(screen.getByLabelText("Button radius (px)"), {
      target: { value: "12" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save settings" }));
    await waitFor(() => expect(saveSettings).toHaveBeenCalled());
    expect(
      saveSettings.mock.calls[0][0].value.email.buttonBackgroundColor,
    ).toBe("#123456");
    expect(saveSettings.mock.calls[0][0].value.email.buttonRadius).toBe(12);
  });
});
