import { describe, expect, it } from "vitest";
import { createSeedCampaign } from "../../data/seed/seedCampaign";
import type { CampaignState } from "../campaign/campaignState";
import type { UnitCatalogEntry } from "../catalog/unitCatalog";
import { planMissionExport, type MissionPlanOptions } from "./missionPlanner";
import { mergeReferenceMissionKeys } from "./iniGenerators";
import { validateExportBundle } from "../validation/exportValidator";

function discoveredUnit(
  unitType: string,
  category: UnitCatalogEntry["category"],
  nation: string,
  cost?: number,
): UnitCatalogEntry {
  return {
    id: `unit-discovered-original-${category}-${unitType}`,
    unitType,
    displayName: unitType,
    category,
    rawNationValues: [nation],
    variants: category === "vessel" || category === "submarine" ? ["Variant1"] : [],
    squadrons: category === "aircraft" || category === "helicopter" ? ["Squadron1"] : [],
    loadouts: [],
    taskForceCost: cost,
    loadoutCosts: {},
    provenance: {
      kind: "discovered",
      sourceRoot: "original",
      sourcePath: `original/${category}s/${unitType}.ini`,
    },
  };
}

function campaignWithDiscovered(): CampaignState {
  const state = createSeedCampaign();
  state.unitCatalog = [
    discoveredUnit("usn_dd_alpha", "vessel", "US", 27),
    discoveredUnit("usn_ff_bravo", "vessel", "US", 14),
    discoveredUnit("wp_pt_p6", "vessel", "Iraq", 8),
    discoveredUnit("usn_ssn_charlie", "submarine", "US", 30),
  ];
  return state;
}

function options(overrides: Partial<MissionPlanOptions> = {}): MissionPlanOptions {
  return {
    modName: "SPDC_Campaign",
    enemyNationValues: ["Iraq", "iraq"],
    maxEnemyVessels: 2,
    patrolMinutes: 60,
    ...overrides,
  };
}

describe("planMissionExport", () => {
  it("refuses to plan from a seed-only catalog", () => {
    const state = createSeedCampaign();
    const result = planMissionExport(state, state.missionCandidates[0], options());
    expect(result.bundle).toBeNull();
    expect(result.problems.some((p) => p.includes("seed"))).toBe(true);
  });

  it("produces a complete bundle from discovered units", () => {
    const state = campaignWithDiscovered();
    const result = planMissionExport(state, state.missionCandidates[0], options());
    expect(result.bundle).not.toBeNull();
    const bundle = result.bundle!;
    const paths = bundle.files.map((f) => f.relativePath);
    expect(paths).toContain(`campaigns/${bundle.campaignFolder}/campaign.ini`);
    expect(paths).toContain(`campaigns/${bundle.campaignFolder}/commander_settings.ini`);
    expect(paths).toContain(`campaigns/${bundle.campaignFolder}/player_task_force_roster.ini`);
    expect(paths).toContain(bundle.missionRelativePath);
    expect(bundle.files.every((f) => !f.relativePath.includes("original"))).toBe(true);
  });

  it("places exactly one anchor on Taskforce1Vessel1", () => {
    const state = campaignWithDiscovered();
    const bundle = planMissionExport(state, state.missionCandidates[0], options()).bundle!;
    const mission = bundle.files.find((f) => f.relativePath === bundle.missionRelativePath)!;
    const anchorCount = (mission.content.match(/TaskForceModeAnchor=True/g) ?? []).length;
    expect(anchorCount).toBe(1);
    expect(mission.content).toContain("[Taskforce1Vessel1]");
    const anchorIdx = mission.content.indexOf("TaskForceModeAnchor=True");
    const vessel1Idx = mission.content.indexOf("[Taskforce1Vessel1]");
    const vessel2Idx = mission.content.indexOf("[Taskforce1Vessel2]");
    expect(anchorIdx).toBeGreaterThan(vessel1Idx);
    if (vessel2Idx >= 0) expect(anchorIdx).toBeLessThan(vessel2Idx);
  });

  it("keeps the mission completable without enemy contact (patrol OR enemy-destroyed)", () => {
    const state = campaignWithDiscovered();
    const bundle = planMissionExport(state, state.missionCandidates[0], options()).bundle!;
    const mission = bundle.files.find((f) => f.relativePath === bundle.missionRelativePath)!;
    expect(mission.content).toContain("Condition_PatrolComplete_Type=Time");
    expect(mission.content).toContain("ConditionsCompleted=<PatrolComplete> OR <EnemyDestroyed>");
    expect(mission.content).toContain("Action_EndMission=True");
  });

  it("does not stack same-domain units at the same position", () => {
    const state = campaignWithDiscovered();
    const bundle = planMissionExport(state, state.missionCandidates[0], options()).bundle!;
    const mission = bundle.files.find((f) => f.relativePath === bundle.missionRelativePath)!;
    const positions = [...mission.content.matchAll(/RelativePositionInNM=([^\n]+)/g)].map(
      (m) => m[1],
    );
    expect(new Set(positions).size).toBe(positions.length);
  });
});

describe("mergeReferenceMissionKeys", () => {
  it("copies unknown [Mission] keys but never owned ones or other sections", () => {
    const generated = [
      "[Mission]",
      "PlayerTaskforce=Taskforce1",
      "NumberOfTaskforce1Vessels=1",
      "NumberOfTriggers=3",
      "",
      "[Taskforce1Vessel1]",
      "Type=usn_dd_alpha",
    ].join("\n");
    const reference = [
      "[Mission]",
      "SomeLocationKey=26.5,52.3",
      "MissionDate=1984-05-12",
      "PlayerTaskforce=Taskforce9",
      "NumberOfTaskforce1Vessels=99",
      "Taskforce1_Formation1=ShouldNotCopy",
      "",
      "[Taskforce1Vessel1]",
      "Type=enemy_should_not_copy",
    ].join("\n");
    const merged = mergeReferenceMissionKeys(generated, reference);
    expect(merged).toContain("SomeLocationKey=26.5,52.3");
    expect(merged).toContain("MissionDate=1984-05-12");
    expect(merged).not.toContain("Taskforce9");
    expect(merged).not.toContain("NumberOfTaskforce1Vessels=99");
    expect(merged).not.toContain("ShouldNotCopy");
    expect(merged).not.toContain("enemy_should_not_copy");
  });
});

describe("validateExportBundle", () => {
  it("passes a well-formed bundle (with reference warning only)", () => {
    const state = campaignWithDiscovered();
    const bundle = planMissionExport(state, state.missionCandidates[0], options()).bundle!;
    const result = validateExportBundle(bundle, state.unitCatalog);
    const errors = result.issues.filter((i) => i.severity === "error");
    expect(errors).toEqual([]);
    expect(result.passed).toBe(true);
    expect(result.issues.some((i) => i.ruleId === "mission.no-reference")).toBe(true);
  });

  it("suppresses the reference warning when a reference mission was used", () => {
    const state = campaignWithDiscovered();
    const bundle = planMissionExport(
      state,
      state.missionCandidates[0],
      options({
        referenceMissionText: "[Mission]\nSomeLocationKey=1,2\n",
        referenceMissionPath: "original/missions/Other/Reference.ini",
      }),
    ).bundle!;
    const result = validateExportBundle(bundle, state.unitCatalog);
    expect(result.issues.some((i) => i.ruleId === "mission.no-reference")).toBe(false);
    expect(result.passed).toBe(true);
  });

  it("rejects bundles containing seed units", () => {
    const state = campaignWithDiscovered();
    const bundle = planMissionExport(state, state.missionCandidates[0], options()).bundle!;
    const withSeed = {
      ...bundle,
      usedUnitTypes: [...bundle.usedUnitTypes, "seed_usn_destroyer"],
    };
    const seedState = createSeedCampaign();
    const result = validateExportBundle(withSeed, [
      ...state.unitCatalog,
      ...seedState.unitCatalog,
    ]);
    expect(result.issues.some((i) => i.ruleId === "export.seed-unit")).toBe(true);
    expect(result.passed).toBe(false);
  });

  it("rejects paths escaping the mod folder or touching original", () => {
    const state = campaignWithDiscovered();
    const bundle = planMissionExport(state, state.missionCandidates[0], options()).bundle!;
    const bad = {
      ...bundle,
      files: [
        ...bundle.files,
        { relativePath: "../evil.ini", content: "x" },
        { relativePath: "original/vessels/hack.ini", content: "x" },
      ],
    };
    const result = validateExportBundle(bad, state.unitCatalog);
    expect(result.issues.some((i) => i.ruleId === "export.path-escape")).toBe(true);
    expect(result.issues.some((i) => i.ruleId === "export.under-original")).toBe(true);
  });

  it("rejects a mission with no anchor", () => {
    const state = campaignWithDiscovered();
    const bundle = planMissionExport(state, state.missionCandidates[0], options()).bundle!;
    const stripped = {
      ...bundle,
      files: bundle.files.map((f) =>
        f.relativePath === bundle.missionRelativePath
          ? { ...f, content: f.content.replace("TaskForceModeAnchor=True\n", "") }
          : f,
      ),
    };
    const result = validateExportBundle(stripped, state.unitCatalog);
    expect(result.issues.some((i) => i.ruleId === "mission.no-anchor")).toBe(true);
  });
});
