import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  adminSend: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));
vi.mock("@/modules/notifications/server/actions", () => ({
  adminSend: mocks.adminSend,
}));
vi.mock("sonner", () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}));

import { SendNotificationForm } from "./send-notification-form";

const broadcastId = "376aef70-f63a-47f9-9228-6cb84c36dcbf";

function fillRequiredFields() {
  fireEvent.change(screen.getByRole("textbox", { name: "User ID" }), {
    target: { value: "recipient-1" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: "Title" }), {
    target: { value: "Update" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: "Message" }), {
    target: { value: "News" },
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(crypto, "randomUUID").mockReturnValue(broadcastId);
});

describe("SendNotificationForm", () => {
  it("renders the send fields and validates required values locally", async () => {
    render(<SendNotificationForm canReachAdmins={false} />);
    expect(screen.getByText("Recipients")).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "User ID" })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Title" })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Message" })).toBeTruthy();
    expect(
      screen.getByRole("textbox", { name: "Link (optional)" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("checkbox", { name: "Also send email" }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Send notification" }));
    expect(await screen.findByText("Enter a user ID.")).toBeTruthy();
    expect(mocks.adminSend).not.toHaveBeenCalled();
  });

  it("shows server field and form errors from the action result", async () => {
    mocks.adminSend.mockResolvedValue({
      ok: false,
      error: "Could not send this notification.",
      fieldErrors: {
        title: ["This title is unavailable."],
        userId: ["User was not found."],
      },
    });
    render(<SendNotificationForm canReachAdmins={false} />);
    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: "Send notification" }));
    expect(
      await screen.findByText("Could not send this notification."),
    ).toBeTruthy();
    expect(screen.getByText("This title is unavailable.")).toBeTruthy();
    expect(screen.getByText("User was not found.")).toBeTruthy();
    expect(mocks.toastSuccess).not.toHaveBeenCalled();
  });

  it("disables submit while pending and resets after success", async () => {
    let complete: (value: unknown) => void = () => {};
    mocks.adminSend.mockReturnValue(
      new Promise((resolve) => {
        complete = resolve;
      }),
    );
    render(<SendNotificationForm canReachAdmins={false} />);
    fillRequiredFields();
    fireEvent.change(screen.getByRole("textbox", { name: "Link (optional)" }), {
      target: { value: "/dashboard" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send notification" }));
    const pending = await screen.findByRole("button", { name: "Sending..." });
    expect((pending as HTMLButtonElement).disabled).toBe(true);
    expect(mocks.adminSend).toHaveBeenCalledWith({
      broadcastId,
      target: "user",
      role: "user",
      userId: "recipient-1",
      title: "Update",
      body: "News",
      href: "/dashboard",
      email: false,
    });
    complete({ ok: true, data: { created: 1, emailed: 0, emailFailed: 0 } });
    await waitFor(() =>
      expect(mocks.toastSuccess).toHaveBeenCalledWith(
        "1 notification created.",
      ),
    );
    expect(screen.getByRole("textbox", { name: "Title" })).toHaveProperty(
      "value",
      "",
    );
    expect(
      screen.getByRole("button", { name: "Send notification" }),
    ).toBeTruthy();
  });

  it("reports partial email delivery failures after a successful send", async () => {
    mocks.adminSend.mockResolvedValue({
      ok: true,
      data: { created: 2, emailed: 1, emailFailed: 1 },
    });
    render(<SendNotificationForm canReachAdmins={true} />);
    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: "Send notification" }));
    await waitFor(() =>
      expect(mocks.toastSuccess).toHaveBeenCalledWith(
        "2 notifications created.",
      ),
    );
    expect(mocks.toastError).toHaveBeenCalledWith("1 email deliveries failed.");
  });

  it("converts an empty optional link to undefined", async () => {
    mocks.adminSend.mockResolvedValue({
      ok: true,
      data: { created: 1, emailed: 0, emailFailed: 0 },
    });
    render(<SendNotificationForm canReachAdmins={false} />);
    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: "Send notification" }));
    await waitFor(() => expect(mocks.adminSend).toHaveBeenCalled());
    expect(mocks.adminSend).toHaveBeenCalledWith(
      expect.objectContaining({ href: undefined }),
    );
  });
});
