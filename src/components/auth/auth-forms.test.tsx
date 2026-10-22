import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { LoginForm } from "@/components/auth/login-form";
import { SignupForm } from "@/components/auth/signup-form";

const authMocks = vi.hoisted(() => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
  reset: vi.fn(),
  replace: vi.fn(),
}));
vi.mock("@/lib/auth/client", () => ({
  authClient: {
    signIn: { email: authMocks.signIn },
    signUp: { email: authMocks.signUp },
    requestPasswordReset: authMocks.reset,
  },
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: authMocks.replace }),
}));

function fill(label: string, value: string) {
  fireEvent.change(screen.getByRole("textbox", { name: label }), {
    target: { value },
  });
}

function fillPassword(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function deferred<T>() {
  let resolve: (value: T) => void = () => {};
  let reject: (reason: Error) => void = () => {};
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

beforeEach(() => vi.clearAllMocks());

describe("LoginForm", () => {
  const view = () =>
    render(<LoginForm next="" googleEnabled={false} oauthError={false} />);

  it("shows field errors for invalid credentials", async () => {
    view();
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("Enter a valid email address")).toBeTruthy();
    expect(screen.getByText("Enter your password")).toBeTruthy();
    expect(authMocks.signIn).not.toHaveBeenCalled();
  });

  it("disables submit while pending and shows a server error", async () => {
    const request = deferred<{ error: { message: string } }>();
    authMocks.signIn.mockReturnValue(request.promise);
    view();
    fill("Email", "ada@example.com");
    fillPassword("Password", "password123");
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(
      await screen.findByRole("button", { name: "Signing in..." }),
    ).toBeTruthy();
    expect(
      (
        screen.getByRole("button", {
          name: "Signing in...",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    request.resolve({ error: { message: "Invalid credentials" } });
    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      "Invalid credentials",
    );
  });
});

describe("SignupForm", () => {
  function validForm() {
    fill("Name", "Ada Lovelace");
    fill("Email", "ada@example.com");
    fillPassword("Password", "Password123!");
    fillPassword("Confirm password", "Password123!");
  }

  it("shows field errors for invalid input", async () => {
    render(<SignupForm />);
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByText("Enter at least 2 characters")).toBeTruthy();
    expect(screen.getByText("Enter a valid email address")).toBeTruthy();
    expect(screen.getByText("Use at least 8 characters")).toBeTruthy();
    expect(authMocks.signUp).not.toHaveBeenCalled();
  });

  it("disables submit while pending and shows a server error", async () => {
    const request = deferred<{ error: { message: string } }>();
    authMocks.signUp.mockReturnValue(request.promise);
    render(<SignupForm />);
    validForm();
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(
      await screen.findByRole("button", { name: "Creating account..." }),
    ).toBeTruthy();
    expect(
      (
        screen.getByRole("button", {
          name: "Creating account...",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    request.resolve({ error: { message: "Account already exists" } });
    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      "Account already exists",
    );
  });
});

describe("ForgotPasswordForm", () => {
  it("shows email validation and does not call the auth client", async () => {
    render(<ForgotPasswordForm />);
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));
    expect(await screen.findByText("Enter a valid email address")).toBeTruthy();
    expect(authMocks.reset).not.toHaveBeenCalled();
  });

  it("disables submit while pending and shows the same receipt after an auth error", async () => {
    const request = deferred<never>();
    authMocks.reset.mockReturnValue(request.promise);
    render(<ForgotPasswordForm />);
    fill("Email", "ada@example.com");
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));
    expect(
      await screen.findByRole("button", { name: "Sending..." }),
    ).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: "Sending..." }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    request.reject(new Error("Network error"));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveProperty(
        "textContent",
        "If an account exists for this email, a reset link is on its way.",
      ),
    );
  });
});
