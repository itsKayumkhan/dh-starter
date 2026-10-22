import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { describe, expect, it, vi } from "vitest";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared/data-table";

type Person = { name: string; status: string };
const columns: DataTableColumn<Person>[] = [
  { accessorKey: "name", header: "Name", enableSorting: true },
  { accessorKey: "status", header: "Status" },
];
const data: Person[] = [
  { name: "Ada", status: "Active" },
  { name: "Lin", status: "Paused" },
];

describe("DataTable", () => {
  it("renders supplied rows, search, filters, and page controls", () => {
    render(
      <NuqsTestingAdapter>
        <DataTable
          columns={columns}
          data={data}
          pageCount={3}
          searchPlaceholder="Find people"
          filters={[
            {
              key: "status",
              label: "Status filter",
              options: [{ label: "Active", value: "active" }],
            },
          ]}
        />
      </NuqsTestingAdapter>,
    );
    expect(screen.getByRole("cell", { name: "Ada" })).toBeTruthy();
    expect(screen.getByRole("cell", { name: "Lin" })).toBeTruthy();
    expect(
      screen
        .getByRole("textbox", { name: "Search table" })
        .getAttribute("placeholder"),
    ).toBe("Find people");
    expect(
      screen.getByRole("combobox", { name: "Status filter" }),
    ).toBeTruthy();
    expect(screen.getByText("Page 1 of 3")).toBeTruthy();
    expect(
      (
        screen.getByRole("button", {
          name: "Previous page",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(
      (screen.getByRole("button", { name: "Next page" }) as HTMLButtonElement)
        .disabled,
    ).toBe(false);
  });

  it("shows its empty message and disables pagination for one page", () => {
    render(
      <NuqsTestingAdapter>
        <DataTable
          columns={columns}
          data={[]}
          pageCount={0}
          emptyMessage="No people"
        />
      </NuqsTestingAdapter>,
    );
    expect(screen.getByRole("cell", { name: "No people" })).toBeTruthy();
    expect(screen.getByText("Page 1 of 1")).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: "Next page" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it("respects the current page and toggles a sortable header", async () => {
    const onUrlUpdate = vi.fn();
    const first = render(
      <NuqsTestingAdapter searchParams="?page=2" onUrlUpdate={onUrlUpdate}>
        <DataTable columns={columns} data={data} pageCount={3} />
      </NuqsTestingAdapter>,
    );
    expect(screen.getByText("Page 2 of 3")).toBeTruthy();
    expect(
      (
        screen.getByRole("button", {
          name: "Previous page",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Sort by name" }));
    await waitFor(() => expect(onUrlUpdate).toHaveBeenCalled());
    expect(onUrlUpdate.mock.lastCall?.[0].searchParams.get("sort")).toBe(
      "name:asc",
    );
    first.unmount();
    onUrlUpdate.mockClear();
    render(
      <NuqsTestingAdapter
        searchParams="?page=2&sort=name%3Aasc"
        onUrlUpdate={onUrlUpdate}
      >
        <DataTable columns={columns} data={data} pageCount={3} />
      </NuqsTestingAdapter>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Sort by name" }));
    await waitFor(() =>
      expect(onUrlUpdate.mock.lastCall?.[0].searchParams.get("sort")).toBe(
        "name:desc",
      ),
    );
  });
});
