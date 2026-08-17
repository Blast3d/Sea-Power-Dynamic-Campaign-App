/**
 * Mission planner: turns a mission candidate + campaign state + discovered
 * catalog into a complete, previewable ExportBundle.
 *
 * Rules honored:
 * - Only discovered (export-eligible) units appear in generated files.
 * - The player anchor is [Taskforce1Vessel1] with exactly one anchor.
 * - The mission stays completable when enemies never spawn/engage: the
 *   patrol-timer completion path never depends on enemy contact.
 * - Same-domain units are never stacked: formation offsets in nautical miles.
 */

import type { CampaignState } from "../campaign/campaignState";
import type { MissionCandidate } from "./missionCandidate";
import type { UnitCatalogEntry } from "../catalog/unitCatalog";
import { isExportableUnit } from "../catalog/unitCatalog";
import type { ExportBundle } from "./exportBundle";
import {
  generateCampaignIni,
  generateCommanderSettingsIni,
  generateMissionIni,
  generateRosterIni,
  mergeReferenceMissionKeys,
  type MissionUnitSpec,
} from "./iniGenerators";
import { toSafeFileName } from "./exportPlan";

export interface MissionPlanOptions {
  modName: string;
  /** Raw nation values counted as enemy for enemy-unit selection. */
  enemyNationValues: string[];
  /** Max enemy vessels to place. */
  maxEnemyVessels: number;
  /** Text of a base-game reference mission for unverified [Mission] keys. */
  referenceMissionText?: string;
  /** Relative path of that reference mission (for bundle metadata). */
  referenceMissionPath?: string;
  patrolMinutes: number;
}

export const DEFAULT_PLAN_OPTIONS: Omit<MissionPlanOptions, "enemyNationValues"> = {
  modName: "SPDC_Campaign",
  maxEnemyVessels: 2,
  patrolMinutes: 60,
};

/** Line-abreast offsets in NM so same-domain units never stack. */
function offsetFor(index: number): [number, number, number] {
  return [index * 1.5, 0, index % 2 === 0 ? 0 : 1.5];
}

function pickPlayerVessels(catalog: UnitCatalogEntry[]): UnitCatalogEntry[] {
  // Prefer discovered vessels with a parsed Task Force cost; the anchor is
  // the first pick. One vessel is enough for a Generated mission — the
  // player's real persistent force replaces it at generation time.
  return catalog
    .filter((u) => isExportableUnit(u) && u.category === "vessel")
    .sort((a, b) => (b.taskForceCost ?? 0) - (a.taskForceCost ?? 0));
}

function pickEnemyVessels(
  catalog: UnitCatalogEntry[],
  enemyNations: string[],
  max: number,
): UnitCatalogEntry[] {
  const enemySet = new Set(enemyNations);
  return catalog
    .filter(
      (u) =>
        isExportableUnit(u) &&
        u.category === "vessel" &&
        u.rawNationValues.some((n) => enemySet.has(n)),
    )
    .slice(0, max);
}

function toUnitSpec(
  u: UnitCatalogEntry,
  sectionName: string,
  index: number,
  heading: number,
  isAnchor: boolean,
): MissionUnitSpec {
  return {
    sectionName,
    unitType: u.unitType,
    variantReference: u.variants[0],
    relativePositionNM: offsetFor(index),
    heading,
    telegraph: 3,
    isAnchor,
  };
}

export interface MissionPlanResult {
  bundle: ExportBundle | null;
  /** Human-readable reasons when no bundle could be produced. */
  problems: string[];
}

export function planMissionExport(
  campaign: CampaignState,
  candidate: MissionCandidate,
  options: MissionPlanOptions,
): MissionPlanResult {
  const problems: string[] = [];

  const discovered = campaign.unitCatalog.filter(isExportableUnit);
  if (discovered.length === 0) {
    problems.push(
      "No discovered units in the campaign catalog. Build and apply discovered catalogs first — seed units can never be exported.",
    );
    return { bundle: null, problems };
  }

  const playerVessels = pickPlayerVessels(campaign.unitCatalog);
  if (playerVessels.length === 0) {
    problems.push("No discovered vessels available for the player anchor.");
    return { bundle: null, problems };
  }
  const enemyVessels = pickEnemyVessels(
    campaign.unitCatalog,
    options.enemyNationValues,
    options.maxEnemyVessels,
  );
  if (enemyVessels.length === 0) {
    problems.push(
      `No discovered vessels matched enemy nation value(s) ${options.enemyNationValues.join(", ")}; the mission will be a pure patrol. ` +
        "This is allowed but check the enemy-side selection.",
    );
  }

  const modName = toSafeFileName(options.modName) || "SPDC_Campaign";
  const campaignFolder = toSafeFileName(campaign.settings.campaignName).toLowerCase() || "campaign";
  const missionFileName = `${toSafeFileName(candidate.title) || "mission_01"}.ini`;

  // Player: anchor + one escort when available.
  const playerPicks = playerVessels.slice(0, 2);
  const playerUnits = playerPicks.map((u, i) =>
    toUnitSpec(u, `Taskforce1Vessel${i + 1}`, i, 90, i === 0),
  );
  // Enemy placed ~20 NM out on the threat axis.
  const enemyUnits = enemyVessels.map((u, i) => {
    const spec = toUnitSpec(u, `Taskforce2Vessel${i + 1}`, i, 270, false);
    spec.relativePositionNM = [20 + i * 2, 0, 8 + (i % 2) * 2];
    return spec;
  });

  const objective = candidate.objectives.find((o) => o.sufficientForCompletion);
  const objectiveText = objective?.description ?? candidate.strategicReason;

  let missionIni = generateMissionIni({
    missionDisplayName: candidate.title,
    briefing: `${candidate.strategicReason} ${objectiveText}`,
    objectiveText,
    playerUnits,
    enemyUnits,
    patrolSeconds: Math.max(60, Math.round(options.patrolMinutes * 60)),
    exitDelaySeconds: 45,
    introDelaySeconds: 20,
  });
  if (options.referenceMissionText) {
    missionIni = mergeReferenceMissionKeys(missionIni, options.referenceMissionText);
  }

  const byCategory = (cat: UnitCatalogEntry["category"]) =>
    discovered.filter((u) => u.category === cat);
  const rosterIni = generateRosterIni({
    vessels: byCategory("vessel"),
    submarines: byCategory("submarine"),
    aircraft: byCategory("aircraft"),
    helicopters: byCategory("helicopter"),
    fallbackCost: 10,
  });

  const campaignIni = generateCampaignIni({
    campaignFolder,
    displayName: campaign.settings.campaignName,
    defaultTaskForceName: campaign.taskForces.find((tf) => tf.side === "player")?.name ?? "Task Group 77.3",
    difficultyPresets: ["Easy", "Moderate", "Difficult"],
    defaultPreset: campaign.settings.difficultyPreset || "Moderate",
    startingPoints: 50,
    pointCap: 50,
    missionFileName,
    missionDisplayName: candidate.title,
    threat: candidate.expectedThreats,
    completionPoints: 10,
  });

  const commanderIni = generateCommanderSettingsIni(campaign.settings.commanderName);

  const base = `campaigns/${campaignFolder}`;
  const bundle: ExportBundle = {
    modName,
    campaignFolder,
    missionCandidateId: candidate.id,
    missionRelativePath: `${base}/missions/${missionFileName}`,
    referenceMissionPath: options.referenceMissionPath,
    usedUnitTypes: [
      ...new Set([...playerPicks, ...enemyVessels, ...discovered].map((u) => u.unitType)),
    ],
    files: [
      { relativePath: `${base}/campaign.ini`, content: campaignIni },
      { relativePath: `${base}/commander_settings.ini`, content: commanderIni },
      { relativePath: `${base}/player_task_force_roster.ini`, content: rosterIni },
      { relativePath: `${base}/missions/${missionFileName}`, content: missionIni },
    ],
  };
  return { bundle, problems };
}
