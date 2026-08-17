import { describe, expect, it } from "vitest";
import { createSeedCampaign } from "../../data/seed/seedCampaign";
import { validateScaffoldCampaign, type GamePathStatus } from "./scaffoldValidator";

const validPath: GamePathStatus = {
  isValid: true,
  streamingAssetsRoot: "H:/SteamLibrary/steamapps/common/Sea Power/Sea Power_Data/StreamingAssets",
  hasOriginal: true,
  hasUser: true,
  errors: [],
  warnings: [],
};

describe("validateScaffoldCampaign", () => {
  it("reports the export gate as informational", () => {
    const result = validateScaffoldCampaign(createSeedCampaign(), validPath);
    expect(
      result.issues.some((i) => i.ruleId === "export.gated" && i.severity === "info"),
    ).toBe(true);
  });

  it("flags a missing game path", () => {
    const state = createSeedCampaign();
    state.settings.gameInstallPath = "";
    const result = validateScaffoldCampaign(state, null);
    expect(result.issues.some((i) => i.ruleId === "path.missing" && i.severity === "error")).toBe(
      true,
    );
  });

  it("flags an invalid game path", () => {
    const result = validateScaffoldCampaign(createSeedCampaign(), {
      isValid: false,
      hasOriginal: false,
      hasUser: false,
      errors: ["Selected path is not a Sea Power install"],
      warnings: [],
    });
    expect(result.issues.some((i) => i.ruleId === "path.invalid")).toBe(true);
  });

  it("flags empty player and opposing sides", () => {
    const state = createSeedCampaign();
    state.settings.playerFactionId = "";
    state.settings.opposingFactionIds = [];
    const result = validateScaffoldCampaign(state, validPath);
    expect(result.issues.some((i) => i.ruleId === "sides.player-empty")).toBe(true);
    expect(result.issues.some((i) => i.ruleId === "sides.opposing-empty")).toBe(true);
  });

  it("flags missing player task forces", () => {
    const state = createSeedCampaign();
    state.taskForces = state.taskForces.filter((tf) => tf.side !== "player");
    const result = validateScaffoldCampaign(state, validPath);
    expect(result.issues.some((i) => i.ruleId === "forces.no-player-task-force")).toBe(true);
  });

  it("flags mission candidates without objectives", () => {
    const state = createSeedCampaign();
    state.missionCandidates[0].objectives = [];
    const result = validateScaffoldCampaign(state, validPath);
    expect(result.issues.some((i) => i.ruleId === "mission.no-objective")).toBe(true);
  });

  it("flags missions whose only completion path depends on uncertain contacts", () => {
    const state = createSeedCampaign();
    state.missionCandidates[0].objectives = [
      {
        id: "obj-x",
        description: "Destroy the (maybe) submarine",
        dependsOnUncertainContact: true,
        sufficientForCompletion: true,
      },
    ];
    const result = validateScaffoldCampaign(state, validPath);
    expect(result.issues.some((i) => i.ruleId === "mission.uncertain-completion")).toBe(true);
  });

  it("accepts missions with a certain fallback completion path", () => {
    const state = createSeedCampaign();
    const result = validateScaffoldCampaign(state, validPath);
    expect(result.issues.some((i) => i.ruleId === "mission.uncertain-completion")).toBe(false);
  });

  it("reports seed catalog data as info", () => {
    const result = validateScaffoldCampaign(createSeedCampaign(), validPath);
    expect(result.issues.some((i) => i.ruleId === "catalog.seed-data" && i.severity === "info")).toBe(
      true,
    );
  });
});
