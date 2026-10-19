import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/react";
import { format } from "date-fns";

import { render } from "@/test/test-utils";
import { DateRangePicker } from "../date-range-picker";

const currentMonth = new Date();

// Day-cell selector for a given day of the current month (the shadcn
// CalendarDayButton exposes the localized date as a data-day attribute).
const dayCell = (day: number) => {
  const el = document.querySelector<HTMLButtonElement>(
    `[data-day="${currentMonth.getMonth() + 1}/${day}/${currentMonth.getFullYear()}"]`,
  );
  if (!el) {
    throw new Error(`Day cell for day ${day} not found`);
  }
  return el;
};

// The picker is open when the calendar grid is rendered (in a portal).
const isOpen = () => document.querySelector('[role="grid"]') !== null;

const clearButton = () => screen.getByRole("button", { name: "Clear" });

const openPicker = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: /range/i }));
};

describe("DateRangePicker", () => {
  const dayStr = (day: number) =>
    format(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day), "yyyy-MM-dd");

  it("keeps the picker open after selecting the start date", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onChange = vi.fn();
    render(<DateRangePicker value={null} onChange={onChange} placeholder="Pick a range" clearLabel="Clear" />);

    await openPicker(user);
    await user.click(dayCell(14));

    // Still open and nothing committed yet.
    expect(isOpen()).toBe(true);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not render the clear button when no value is set", () => {
    render(<DateRangePicker value={null} onChange={vi.fn()} placeholder="Pick a range" clearLabel="Clear" />);

    expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();
  });

  it("commits the range and closes on the second click", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onChange = vi.fn();
    render(<DateRangePicker value={null} onChange={onChange} placeholder="Pick a range" clearLabel="Clear" />);

    await openPicker(user);
    await user.click(dayCell(14));
    await user.click(dayCell(16));

    expect(onChange).toHaveBeenCalledWith({
      from: dayStr(14),
      to: dayStr(16),
    });
    expect(isOpen()).toBe(false);
  });

  it("supports a single-day range by clicking the same date twice", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onChange = vi.fn();
    render(<DateRangePicker value={null} onChange={onChange} placeholder="Pick a range" clearLabel="Clear" />);

    await openPicker(user);
    await user.click(dayCell(14));
    await user.click(dayCell(14));

    expect(onChange).toHaveBeenCalledWith({
      from: dayStr(14),
      to: dayStr(14),
    });
  });

  it("uses the start date as the end date when dismissed early", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onChange = vi.fn();
    render(<DateRangePicker value={null} onChange={onChange} placeholder="Pick a range" clearLabel="Clear" />);

    await openPicker(user);
    await user.click(dayCell(14));
    await user.keyboard("{Escape}");

    expect(onChange).toHaveBeenCalledWith({
      from: dayStr(14),
      to: dayStr(14),
    });
    expect(isOpen()).toBe(false);
  });

  it("restarts the range when clicking an earlier date", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onChange = vi.fn();
    render(<DateRangePicker value={null} onChange={onChange} placeholder="Pick a range" clearLabel="Clear" />);

    await openPicker(user);
    await user.click(dayCell(16));
    await user.click(dayCell(12));
    // Restarted from the earlier date: nothing committed yet.
    expect(onChange).not.toHaveBeenCalled();

    await user.click(dayCell(14));
    expect(onChange).toHaveBeenCalledWith({
      from: dayStr(12),
      to: dayStr(14),
    });
  });

  it("clears the selection from the x on the closed field", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onChange = vi.fn();
    render(
      <DateRangePicker
        value={{ from: dayStr(14), to: dayStr(16) }}
        onChange={onChange}
        placeholder="Pick a range"
        clearLabel="Clear"
      />,
    );

    // The x sits on the closed field; clicking it must not open the picker.
    await user.click(clearButton());

    expect(onChange).toHaveBeenCalledWith(null);
    expect(isOpen()).toBe(false);
  });
});
