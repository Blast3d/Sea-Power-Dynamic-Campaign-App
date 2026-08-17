import { describe, expect, it } from "vitest";
import {
  mergeCatalogs,
  mergeFactions,
  parseCost,
  toDiscoveredFactions,
  toUnitCatalogEntries,
  type DiscoveredCatalogs,
} from "./discoveredCatalog";
import { seedFactions, seedUnitCatalog } from "../../data/seed/seedCampaign";
import { isExportableUnit } from "./unitCatalog";

function fixtureCatalogs(): DiscoveredCatalogs {
  return {
    streamingAssetsRoot: "H:/fake/StreamingAssets",
    nationsReference: [
      { prefix: "usn", nationName: "US", sourceRoot: "original", relativePath: "original/nations_reference.ini" },
      { prefix: "wp", nationName: "Soviet", sourceRoot: "original", relativePath: "original/nations_reference.ini" },
    ],
    nations: [
      {
        rawValue: "US",
        occurrenceCount: 40,
        fileCount: 12,
        examplePaths: ["original/vessels/usn_dd_test.ini"],
        referencePrefixes: ["usn"],
        caseInsensitiveReferenceMatch: false,
      },
      {
        rawValue: "Iraq",
        occurrenceCount: 6,
        fileCount: 3,
        examplePaths: ["original/vessels/wp_pt_p6_variants.ini"],
        referencePrefixes: [],
        caseInsensitiveReferenceMatch: false,
      },
      {
        rawValue: "iraq",
        occurrenceCount: 2,
        fileCount: 1,
        examplePaths: ["original/missions/Other/Operation Morvarid.ini"],
        referencePrefixes: [],
        caseInsensitiveReferenceMatch: false,
      },
      {
        rawValue: "Testland",
        occurrenceCount: 1,
        fileCount: 1,
        examplePaths: ["user/MyMod/vessels/xx_custom_ship.ini"],
        referencePrefixes: [],
        caseInsensitiveReferenceMatch: false,
      },
    ],
    units: [
      {
        unitType: "usn_dd_test",
        category: "vessels",
        sourceRoot: "original",
        sourceMod: null,
        sourcePaths: ["original/vessels/usn_dd_test.ini"],
        nations: ["US"],
        referenceNation: "US",
        variants: [
          { section: "Variant1", nation: "US", sourcePath: "original/vessels/usn_dd_test.ini" },
        ],
        squadronSections: [],
        loadoutSections: [],
        taskForceCostRaw: "27",
        taskForceCostSection: "TaskForce",
        loadoutCosts: [{ loadout: "Late", rawValue: "10" }],
        displayNameGuess: null,
      },
      {
        unitType: "xx_custom_ship",
        category: "vessels",
        sourceRoot: "user",
        sourceMod: "MyMod",
        sourcePaths: ["user/MyMod/vessels/xx_custom_ship.ini"],
        nations: ["Testland"],
        referenceNation: null,
        variants: [],
        squadronSections: [],
        loadoutSections: [],
        taskForceCostRaw: "not-a-number",
        taskForceCostSection: "TaskForce",
        loadoutCosts: [],
        displayNameGuess: "Custom Ship",
      },
    ],
    squadronFiles: [],
    loadoutFiles: [],
    stats: {
      parsedFiles: 3,
      parseWarnings: 0,
      unitCount: 2,
      unitsWithTaskForceCost: 2,
      unitsWithVariants: 1,
      nationValueCount: 4,
      categoryCounts: { vessels: 2 },
    },
    warnings: [],
    heuristicNotes: [],
  };
}

describe("parseCost", () => {
  it("parses valid numbers and rejects garbage", () => {
    expect(parseCost("27")).toBe(27);
    expect(parseCost(" 10 ")).toBe(10);
    expect(parseCost("not-a-number")).toBeUndefined();
    expect(parseCost(null)).toBeUndefined();
    expect(parseCost(undefined)).toBeUndefined();
  });
});

describe("toDiscoveredFactions", () => {
  it("keeps Iraq and iraq as distinct raw-value factions", () => {
    const factions = toDiscoveredFactions(fixtureCatalogs());
    const values = factions.map((f) => f.rawNationValues[0]);
    expect(values).toContain("Iraq");
    expect(values).toContain("iraq");
  });

  it("attributes mod-sourced nations to their mod", () => {
    const factions = toDiscoveredFactions(fixtureCatalogs());
    const testland = factions.find((f) => f.displayName === "Testland")!;
    expect(testland.provenance).toMatchObject({
      kind: "discovered",
      sourceRoot: "user",
      sourceMod: "MyMod",
    });
  });
});

describe("toUnitCatalogEntries", () => {
  it("produces export-eligible entries with preserved source paths", () => {
    const entries = toUnitCatalogEntries(fixtureCatalogs());
    const dd = entries.find((e) => e.unitType === "usn_dd_test")!;
    expect(isExportableUnit(dd)).toBe(true);
    expect(dd.taskForceCost).toBe(27);
    expect(dd.loadoutCosts).toEqual({ Late: 10 });
    expect(dd.variants).toEqual(["Variant1"]);
    expect(dd.provenance).toMatchObject({
      kind: "discovered",
      sourceRoot: "original",
      sourcePath: "original/vessels/usn_dd_test.ini",
    });
  });

  it("leaves unparsable costs undefined instead of guessing", () => {
    const entries = toUnitCatalogEntries(fixtureCatalogs());
    const custom = entries.find((e) => e.unitType === "xx_custom_ship")!;
    expect(custom.taskForceCost).toBeUndefined();
    expect(custom.displayName).toBe("Custom Ship");
  });
});

describe("mergeCatalogs", () => {
  it("replaces seed entries in categories that have discovered units", () => {
    const discovered = toUnitCatalogEntries(fixtureCatalogs());
    const merged = mergeCatalogs(seedUnitCatalog, discovered);
    const seedVessels = merged.filter(
      (e) => e.category === "vessel" && e.provenance.kind === "seed",
    );
    expect(seedVessels).toHaveLength(0);
    // Categories without discovered data keep their seed placeholders.
    const seedSubs = merged.filter(
      (e) => e.category === "submarine" && e.provenance.kind === "seed",
    );
    expect(seedSubs.length).toBeGreaterThan(0);
  });
});

describe("mergeFactions", () => {
  it("keeps scaffold factions first and skips already-claimed raw values", () => {
    const discovered = toDiscoveredFactions(fixtureCatalogs());
    const merged = mergeFactions(seedFactions, discovered);
    // US/Soviet/Iraq/iraq are claimed by scaffold factions; Testland is new.
    expect(merged.filter((f) => f.rawNationValues.includes("US"))).toHaveLength(1);
    expect(merged.filter((f) => f.rawNationValues.includes("Iraq"))).toHaveLength(1);
    expect(merged.some((f) => f.displayName === "Testland")).toBe(true);
    expect(merged[0].id).toBe(seedFactions[0].id);
  });
});
