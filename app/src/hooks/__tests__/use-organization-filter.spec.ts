import { describe, it, expect, beforeEach } from "vitest";

import { filterToSelection, resolveFilter, useOrganizationFilter } from "../use-organization-filter";

const orgs = [
  { id: 1, name: "Org One" },
  { id: 2, name: "Org Two" },
];

describe("useOrganizationFilter", () => {
  beforeEach(() => {
    useOrganizationFilter.getState().reset();
    localStorage.clear();
  });

  it("persists the filter to localStorage", () => {
    useOrganizationFilter.getState().setFilter({ organizations: [1], searchPublicArchive: true });

    expect(useOrganizationFilter.getState().organizations).toEqual([1]);
    expect(JSON.parse(localStorage.getItem("organizationFilter")!)).toMatchObject({
      state: { organizations: [1], searchPublicArchive: true },
    });
  });

  it("normalizes empty organization lists to all organizations", () => {
    useOrganizationFilter.getState().setFilter({ organizations: [] });

    expect(useOrganizationFilter.getState().organizations).toBeUndefined();
  });

  it("maps the stored filter back to a selection including the public archive", () => {
    useOrganizationFilter.getState().setFilter({ organizations: [2], searchPublicArchive: true });

    expect(filterToSelection(orgs)).toEqual([{ id: 2, name: "Org Two" }, null]);
  });

  it("resets the filter when it references organizations the user no longer belongs to", () => {
    useOrganizationFilter.getState().setFilter({ organizations: [1, 3], searchPublicArchive: true });

    expect(resolveFilter(orgs)).toEqual({});
    expect(useOrganizationFilter.getState().organizations).toBeUndefined();
    expect(filterToSelection(orgs)).toEqual([]);
  });
});
