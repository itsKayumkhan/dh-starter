import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ContactForm } from "@/modules/contact/components/contact-form";

const submitInquiry = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ usePathname: () => "/contact" }));
vi.mock("@/modules/contact/server/actions", () => ({ submitInquiry }));

beforeEach(() => submitInquiry.mockReset());

describe("ContactForm", () => {
  it("keeps its honeypot out of the accessible form and validates fields", async () => {
    const { container } = render(<ContactForm formToken="test-token" />);
    const honeypot = container.querySelector('input[name="website"]');
    expect(honeypot?.getAttribute("tabindex")).toBe("-1");
    expect(honeypot?.parentElement?.getAttribute("aria-hidden")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    expect(await screen.findByText("Enter your name.")).toBeTruthy();
    expect(screen.getByText("Enter a valid email address.")).toBeTruthy();
    expect(screen.getByText("Enter at least 10 characters.")).toBeTruthy();
    expect(submitInquiry).not.toHaveBeenCalled();
  });

  it("shows a pending state and resets after success", async () => {
    let resolve: (result: { ok: true; data: null }) => void = () => {};
    submitInquiry.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    render(<ContactForm formToken="test-token" />);
    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
      target: { value: "Ada Lovelace" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Email" }), {
      target: { value: "ada@example.com" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Message" }), {
      target: { value: "Please contact me about a project." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    expect(
      await screen.findByRole("button", { name: "Sending..." }),
    ).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: "Sending..." }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(submitInquiry).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Ada Lovelace",
        source: "/contact",
        formToken: "test-token",
      }),
    );
    resolve({ ok: true, data: null });
    await waitFor(() =>
      expect(screen.getByRole("textbox", { name: "Name" })).toHaveProperty(
        "value",
        "",
      ),
    );
    expect(screen.getByRole("button", { name: "Sent" })).toBeTruthy();
  });
});
