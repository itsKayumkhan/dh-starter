import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { site } from "@/config/site";
import { Providers } from "@/components/shared/providers";

const { setTheme, themeProviderProps } = vi.hoisted(() => ({
  setTheme: vi.fn(),
  themeProviderProps: vi.fn(),
}));
vi.mock("next-themes", () => ({
  ThemeProvider: ({ children, ...props }: { children: React.ReactNode }) => {
    themeProviderProps(props);
    return children;
  },
  useTheme: () => ({ theme: "unsupported", setTheme }),
}));
vi.mock("@/components/ui/sonner", () => ({ Toaster: () => null }));

beforeEach(() => vi.clearAllMocks());

describe("theme provider", () => {
  it("uses configured modes and replaces a stored unsupported mode", async () => {
    render(
      <Providers>
        <div>Content</div>
      </Providers>,
    );
    expect(themeProviderProps).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultTheme: site.theme.defaultMode,
        themes: ["light", "dark"],
        enableSystem: true,
      }),
    );
    await waitFor(() =>
      expect(setTheme).toHaveBeenCalledWith(site.theme.defaultMode),
    );
  });
});
