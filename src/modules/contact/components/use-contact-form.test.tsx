import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useContactForm } from "@/modules/contact/components/use-contact-form";

const submitInquiry = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ usePathname: () => "/contact" }));
vi.mock("@/modules/contact/server/actions", () => ({ submitInquiry }));

beforeEach(() => submitInquiry.mockReset());

describe("useContactForm", () => {
  it("submits the signed token and honeypot and exposes server field errors", async () => {
    submitInquiry.mockResolvedValue({
      ok: false,
      error: "Please check the form.",
      fieldErrors: { email: ["Email is already used."] },
    });
    const { result } = renderHook(() =>
      useContactForm({ formToken: "test-token" }),
    );
    act(() => {
      result.current.form.setValue("name", "Ada Lovelace");
      result.current.form.setValue("email", "ada@example.com");
      result.current.form.setValue(
        "message",
        "Please contact me about a project.",
      );
      result.current.form.setValue("website", "bot-value");
    });

    await act(async () => {
      await result.current.onSubmit();
    });

    expect(submitInquiry).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Ada Lovelace",
        source: "/contact",
        formToken: "test-token",
        website: "bot-value",
      }),
    );
    expect(result.current.formError).toBe("Please check the form.");
    expect(result.current.fieldErrors.email?.message).toBe(
      "Email is already used.",
    );
    expect(result.current.result?.ok).toBe(false);
  });

  it("retains the action result and clears values after success", async () => {
    submitInquiry.mockResolvedValue({ ok: true, data: { id: "inquiry-1" } });
    const { result } = renderHook(() =>
      useContactForm({ formToken: "test-token" }),
    );
    act(() => {
      result.current.form.setValue("name", "Ada Lovelace");
      result.current.form.setValue("email", "ada@example.com");
      result.current.form.setValue(
        "message",
        "Please contact me about a project.",
      );
    });

    await act(async () => {
      await result.current.onSubmit();
    });

    await waitFor(() =>
      expect(result.current.result).toEqual({
        ok: true,
        data: { id: "inquiry-1" },
      }),
    );
    expect(result.current.form.getValues("name")).toBe("");
    expect(result.current.form.getValues("formToken")).toBe("test-token");
    expect(result.current.isPending).toBe(false);
  });
});
