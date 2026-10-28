import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BanForm,
  InviteUserDialog,
  RoleForm,
  UserDangerActions,
} from "@/modules/admin/components/user-forms";

const mocks = vi.hoisted(() => ({
  banUser: vi.fn(),
  changeRole: vi.fn(),
  deleteUser: vi.fn(),
  inviteUser: vi.fn(),
  revokeUserSessions: vi.fn(),
  unbanUser: vi.fn(),
  push: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock("@/modules/admin/server/actions", () => ({
  banUser: mocks.banUser,
  changeRole: mocks.changeRole,
  deleteUser: mocks.deleteUser,
  inviteUser: mocks.inviteUser,
  revokeUserSessions: mocks.revokeUserSessions,
  unbanUser: mocks.unbanUser,
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("sonner", () => ({
  toast: { success: mocks.success, error: mocks.error },
}));

function deferred<T>() {
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function fill(label: string, value: string) {
  fireEvent.change(screen.getByRole("textbox", { name: label }), {
    target: { value },
  });
}

async function chooseRole(role: "User" | "Staff" | "Admin") {
  const trigger = screen.getByRole("combobox", { name: "Role" });
  const select = trigger.parentElement?.querySelector("select");
  if (!select) throw new Error("Role select is missing");
  fireEvent.change(select, { target: { value: role.toLowerCase() } });
  await waitFor(() => expect(trigger.textContent).toContain(role));
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.inviteUser.mockResolvedValue({ ok: true, data: { id: "new-1" } });
  mocks.changeRole.mockResolvedValue({
    ok: true,
    data: { id: "user-1", role: "staff" },
  });
  mocks.banUser.mockResolvedValue({ ok: true, data: { id: "user-1" } });
  mocks.unbanUser.mockResolvedValue({ ok: true, data: { id: "user-1" } });
  mocks.revokeUserSessions.mockResolvedValue({
    ok: true,
    data: { id: "user-1" },
  });
  mocks.deleteUser.mockResolvedValue({ ok: true, data: { id: "user-1" } });
});

describe("InviteUserDialog", () => {
  async function open() {
    fireEvent.click(screen.getByRole("button", { name: "Invite user" }));
    return screen.findByRole("dialog");
  }

  it("renders fields and sends an invitation before closing", async () => {
    render(<InviteUserDialog />);
    const dialog = await open();
    expect(within(dialog).getByRole("textbox", { name: "Name" })).toBeTruthy();
    expect(within(dialog).getByRole("textbox", { name: "Email" })).toBeTruthy();
    expect(within(dialog).getByRole("combobox", { name: "Role" })).toBeTruthy();
    fill("Name", "Ada Lovelace");
    fill("Email", "ada@example.com");
    fireEvent.click(screen.getByRole("button", { name: "Send invitation" }));
    await waitFor(() =>
      expect(mocks.inviteUser).toHaveBeenCalledWith({
        name: "Ada Lovelace",
        email: "ada@example.com",
        role: "user",
      }),
    );
    expect(mocks.success).toHaveBeenCalledWith("Invitation sent");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("validates missing, malformed and too long input before calling the action", async () => {
    render(<InviteUserDialog />);
    await open();
    fireEvent.click(screen.getByRole("button", { name: "Send invitation" }));
    expect(await screen.findAllByRole("alert")).toHaveLength(2);
    expect(mocks.inviteUser).not.toHaveBeenCalled();
    fill("Name", "a".repeat(101));
    fill("Email", "bad-email");
    fireEvent.click(screen.getByRole("button", { name: "Send invitation" }));
    await waitFor(() => expect(screen.getAllByRole("alert")).toHaveLength(2));
    expect(mocks.inviteUser).not.toHaveBeenCalled();
  });

  it("shows server field and form errors without closing", async () => {
    mocks.inviteUser.mockResolvedValue({
      ok: false,
      error: "Invitation could not be sent",
      fieldErrors: { email: ["Email already invited"] },
    });
    render(<InviteUserDialog />);
    await open();
    fill("Name", "Ada Lovelace");
    fill("Email", "ada@example.com");
    fireEvent.click(screen.getByRole("button", { name: "Send invitation" }));
    expect(await screen.findByText("Email already invited")).toBeTruthy();
    expect(screen.getAllByRole("alert")).toHaveLength(2);
    expect(screen.getByText("Invitation could not be sent")).toBeTruthy();
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(mocks.success).not.toHaveBeenCalled();
  });

  it("disables submit while sending", async () => {
    const pending = deferred<{ ok: true; data: { id: string } }>();
    mocks.inviteUser.mockReturnValue(pending.promise);
    render(<InviteUserDialog />);
    await open();
    fill("Name", "Ada Lovelace");
    fill("Email", "ada@example.com");
    fireEvent.click(screen.getByRole("button", { name: "Send invitation" }));
    const button = await screen.findByRole("button", { name: "Sending..." });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(button);
    expect(mocks.inviteUser).toHaveBeenCalledTimes(1);
    pending.resolve({ ok: true, data: { id: "new-1" } });
    await waitFor(() =>
      expect(mocks.success).toHaveBeenCalledWith("Invitation sent"),
    );
  });
});

describe("RoleForm", () => {
  it("starts clean and saves a changed role", async () => {
    render(<RoleForm id="user-1" role="user" disabled={false} />);
    expect(screen.getByRole("combobox", { name: "Role" })).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: "Save role" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    await chooseRole("Staff");
    fireEvent.click(screen.getByRole("button", { name: "Save role" }));
    await waitFor(() =>
      expect(mocks.changeRole).toHaveBeenCalledWith({
        id: "user-1",
        role: "staff",
      }),
    );
    expect(mocks.success).toHaveBeenCalledWith("Role updated");
  });

  it("keeps the form disabled for a protected user", () => {
    render(<RoleForm id="user-1" role="admin" disabled />);
    expect(
      (screen.getByRole("combobox", { name: "Role" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(
      (screen.getByRole("button", { name: "Save role" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(mocks.changeRole).not.toHaveBeenCalled();
  });

  it("shows server field and form errors", async () => {
    mocks.changeRole.mockResolvedValue({
      ok: false,
      error: "Role update failed",
      fieldErrors: { role: ["Role cannot be assigned"] },
    });
    render(<RoleForm id="user-1" role="user" disabled={false} />);
    await chooseRole("Staff");
    fireEvent.click(screen.getByRole("button", { name: "Save role" }));
    expect(await screen.findByText("Role cannot be assigned")).toBeTruthy();
    expect(screen.getByText("Role update failed")).toBeTruthy();
    expect(mocks.success).not.toHaveBeenCalled();
  });

  it("disables role and submit while saving", async () => {
    const pending = deferred<{
      ok: true;
      data: { id: string; role: string };
    }>();
    mocks.changeRole.mockReturnValue(pending.promise);
    render(<RoleForm id="user-1" role="user" disabled={false} />);
    await chooseRole("Staff");
    fireEvent.click(screen.getByRole("button", { name: "Save role" }));
    await waitFor(() =>
      expect(
        (screen.getByRole("button", { name: "Save role" }) as HTMLButtonElement)
          .disabled,
      ).toBe(true),
    );
    expect(
      (screen.getByRole("combobox", { name: "Role" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    pending.resolve({ ok: true, data: { id: "user-1", role: "staff" } });
    await waitFor(() =>
      expect(mocks.success).toHaveBeenCalledWith("Role updated"),
    );
  });
});

describe("BanForm", () => {
  it("renders reason and optional expiry and submits them", async () => {
    render(<BanForm id="user-1" />);
    expect(screen.getByRole("textbox", { name: "Reason" })).toBeTruthy();
    expect(screen.getByLabelText("Expiry (optional)")).toBeTruthy();
    fill("Reason", "Policy violation");
    fireEvent.change(screen.getByLabelText("Expiry (optional)"), {
      target: { value: "2030-01-02T12:30" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ban user" }));
    await waitFor(() =>
      expect(mocks.banUser).toHaveBeenCalledWith({
        id: "user-1",
        reason: "Policy violation",
        expiresAt: new Date("2030-01-02T12:30").toISOString(),
      }),
    );
    expect(mocks.success).toHaveBeenCalledWith("User banned");
    expect(
      (screen.getByRole("textbox", { name: "Reason" }) as HTMLTextAreaElement)
        .value,
    ).toBe("");
  });

  it("validates missing and too long reasons without calling the action", async () => {
    render(<BanForm id="user-1" />);
    fireEvent.click(screen.getByRole("button", { name: "Ban user" }));
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(mocks.banUser).not.toHaveBeenCalled();
    fill("Reason", "a".repeat(501));
    fireEvent.click(screen.getByRole("button", { name: "Ban user" }));
    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
    expect(mocks.banUser).not.toHaveBeenCalled();
  });

  it("shows server field and form errors", async () => {
    mocks.banUser.mockResolvedValue({
      ok: false,
      error: "Ban failed",
      fieldErrors: { reason: ["Reason was rejected"] },
    });
    render(<BanForm id="user-1" />);
    fill("Reason", "Policy violation");
    fireEvent.click(screen.getByRole("button", { name: "Ban user" }));
    expect(await screen.findByText("Reason was rejected")).toBeTruthy();
    expect(screen.getByText("Ban failed")).toBeTruthy();
    expect(mocks.success).not.toHaveBeenCalled();
  });

  it("disables submit while banning", async () => {
    const pending = deferred<{ ok: true; data: { id: string } }>();
    mocks.banUser.mockReturnValue(pending.promise);
    render(<BanForm id="user-1" />);
    fill("Reason", "Policy violation");
    fireEvent.click(screen.getByRole("button", { name: "Ban user" }));
    const button = await screen.findByRole("button", { name: "Banning..." });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    pending.resolve({ ok: true, data: { id: "user-1" } });
    await waitFor(() =>
      expect(mocks.success).toHaveBeenCalledWith("User banned"),
    );
  });
});

describe("UserDangerActions", () => {
  it("hides unban for active users and disables self actions", () => {
    render(<UserDangerActions id="self-1" banned={false} isSelf />);
    expect(screen.queryByRole("button", { name: "Unban user" })).toBeNull();
    expect(
      (
        screen.getByRole("button", {
          name: "Revoke sessions",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(
      (screen.getByRole("button", { name: "Delete user" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(mocks.revokeUserSessions).not.toHaveBeenCalled();
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });

  it("unbans a banned user and reports ActionResult errors", async () => {
    mocks.unbanUser.mockResolvedValueOnce({
      ok: false,
      error: "Unable to unban",
    });
    render(<UserDangerActions id="user-1" banned isSelf={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Unban user" }));
    await waitFor(() =>
      expect(mocks.error).toHaveBeenCalledWith("Unable to unban"),
    );
    expect(mocks.unbanUser).toHaveBeenCalledWith({ id: "user-1" });
    fireEvent.click(screen.getByRole("button", { name: "Unban user" }));
    await waitFor(() =>
      expect(mocks.success).toHaveBeenCalledWith("User unbanned"),
    );
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("revokes sessions after confirmation", async () => {
    render(<UserDangerActions id="user-1" banned={false} isSelf={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Revoke sessions" }));
    expect(await screen.findByRole("alertdialog")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(mocks.revokeUserSessions).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Revoke sessions" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirm" }));
    await waitFor(() =>
      expect(mocks.revokeUserSessions).toHaveBeenCalledWith({ id: "user-1" }),
    );
    expect(mocks.success).toHaveBeenCalledWith("Sessions revoked");
  });

  it("deletes after confirmation and navigates only after success", async () => {
    const pending = deferred<{ ok: true; data: { id: string } }>();
    mocks.deleteUser.mockReturnValue(pending.promise);
    render(<UserDangerActions id="user-1" banned={false} isSelf={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Delete user" }));
    const dialog = await screen.findByRole("alertdialog");
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Delete user" }),
    );
    await waitFor(() =>
      expect(mocks.deleteUser).toHaveBeenCalledWith({ id: "user-1" }),
    );
    expect(mocks.push).not.toHaveBeenCalled();
    pending.resolve({ ok: true, data: { id: "user-1" } });
    await waitFor(() =>
      expect(mocks.push).toHaveBeenCalledWith("/admin/users"),
    );
    expect(mocks.success).toHaveBeenCalledWith("User deleted");
  });

  it("shows a failed deletion and stays on the user page", async () => {
    mocks.deleteUser.mockResolvedValue({ ok: false, error: "Deletion failed" });
    render(<UserDangerActions id="user-1" banned={false} isSelf={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Delete user" }));
    const dialog = await screen.findByRole("alertdialog");
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Delete user" }),
    );
    await waitFor(() =>
      expect(mocks.error).toHaveBeenCalledWith("Deletion failed"),
    );
    expect(mocks.push).not.toHaveBeenCalled();
    expect(mocks.success).not.toHaveBeenCalled();
  });
});
