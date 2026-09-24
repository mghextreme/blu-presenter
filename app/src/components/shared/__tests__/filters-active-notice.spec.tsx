import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "@/test/test-utils";

import { FiltersActiveNotice } from "../filters-active-notice";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en" },
  }),
}));

describe("FiltersActiveNotice", () => {
  it("shows the active filters message with a reset button", async () => {
    const onReset = vi.fn();

    render(<FiltersActiveNotice onReset={onReset} />);

    expect(screen.getByText("filters.active")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /filters.reset/ }));
    expect(onReset).toHaveBeenCalled();
  });
});
