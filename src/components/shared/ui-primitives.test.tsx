import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

describe("shared UI primitives", () => {
  it("renders button variants and disabled inputs", () => {
    render(
      <>
        <Button variant="destructive" disabled>
          Remove
        </Button>
        <Input aria-label="Email" type="email" disabled />
      </>,
    );
    const button = screen.getByRole("button", {
      name: "Remove",
    }) as HTMLButtonElement;
    expect(button.getAttribute("data-variant")).toBe("destructive");
    expect(button.disabled).toBe(true);
    const input = screen.getByRole("textbox", {
      name: "Email",
    }) as HTMLInputElement;
    expect(input.type).toBe("email");
    expect(input.disabled).toBe(true);
  });

  it("opens a dialog from its trigger", () => {
    render(
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">Open details</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Details</DialogTitle>
          <DialogDescription>More information</DialogDescription>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Open details" }));
    expect(screen.getByRole("dialog", { name: "Details" })).toBeTruthy();
    expect(screen.getByText("More information")).toBeTruthy();
  });
});
