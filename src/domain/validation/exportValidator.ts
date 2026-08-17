/**
 * Export-bundle validator: the gate every export must pass.
 *
 * Implements the campaign/roster/mission rules from
 * `skills/sea-power-campaign-planning/references/validation.md` that apply
 * to generated bundles, plus scaffold safety rules. Hard game requirements
 * are errors; design-quality and unverified-schema issues are warnings.
 */

import type { ExportBundle } from "../missions/exportBundle";
import type { UnitCatalogEntry } from "../catalog/unitCatalog";
import { buildResult, type ValidationIssue, type ValidationResult } from "./validation";

const SAFE_NAME = /^[A-Za-z0-9_-]+$/;

interface ParsedIni {
  sections: Map<string, Map<string, string>>;
  sectionOrder: string[];
}

function parseIni(content: string): ParsedIni {
  const sections = new Map<string, Map<string, string>>();
  const sectionOrder: string[] = [];
  let current: Map<string, string> | null = null;
  for (const raw of content.split(/\r?\n/)) {
    const line = raw.trim();
    if (line === "" || line.startsWith(";") || line.startsWith("//") || line.startsWith("#")) {
      continue;
    }
    if (line.startsWith("[") && line.includes("]")) {
      const name = line.slice(1, line.indexOf("]")).trim();
      current = sections.get(name) ?? new Map();
      if (!sections.has(name)) {
        sections.set(name, current);
        sectionOrder.push(name);
      }
      continue;
    }
    const eq = line.indexOf("=");
    if (eq > 0 && current) {
      current.set(line.slice(0, eq).trim(), line.slice(eq + 1).trim());
    }
  }
  return { sections, sectionOrder };
}

function fileOf(bundle: ExportBundle, suffix: string): string | undefined {
  return bundle.files.find((f) => f.relativePath.endsWith(suffix))?.content;
}

export function validateExportBundle(
  bundle: ExportBundle,
  catalog: UnitCatalogEntry[],
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const err = (ruleId: string, message: string) =>
    issues.push({ ruleId, severity: "error", message });
  const warn = (ruleId: string, message: string) =>
    issues.push({ ruleId, severity: "warning", message });
  const info = (ruleId: string, message: string) =>
    issues.push({ ruleId, severity: "info", message });

  // --- Path safety ---
  if (!SAFE_NAME.test(bundle.modName)) {
    err("export.mod-name", `Mod name "${bundle.modName}" contains unsafe characters.`);
  }
  if (!SAFE_NAME.test(bundle.campaignFolder)) {
    err("export.campaign-folder", `Campaign folder "${bundle.campaignFolder}" contains unsafe characters.`);
  }
  for (const f of bundle.files) {
    if (f.relativePath.includes("..") || f.relativePath.startsWith("/")) {
      err("export.path-escape", `Generated path escapes the mod folder: ${f.relativePath}`);
    }
    if (/(^|\/)original(\/|$)/i.test(f.relativePath)) {
      err("export.under-original", `Generated path points at base-game content: ${f.relativePath}`);
    }
    const fileName = f.relativePath.split("/").pop() ?? "";
    if (!SAFE_NAME.test(fileName.replace(/\.ini$/i, ""))) {
      err("mission.unsafe-filename", `Unsafe file name: ${fileName}`);
    }
  }

  // --- Seed data can never be exported ---
  const seedTypes = new Set(
    catalog.filter((u) => u.provenance.kind === "seed").map((u) => u.unitType),
  );
  const discoveredTypes = new Set(
    catalog.filter((u) => u.provenance.kind === "discovered").map((u) => u.unitType),
  );
  for (const t of bundle.usedUnitTypes) {
    if (seedTypes.has(t)) {
      err("export.seed-unit", `Seed placeholder unit "${t}" appears in the export bundle.`);
    } else if (!discoveredTypes.has(t)) {
      err("roster.unknown-unit", `Unit "${t}" does not exist in the discovered catalog.`);
    }
  }

  // --- campaign.ini ---
  const campaignText = fileOf(bundle, "campaign.ini");
  if (!campaignText) {
    err("campaign.missing", "Bundle has no campaign.ini.");
  } else {
    const ini = parseIni(campaignText);
    const campaign = ini.sections.get("Campaign");
    const tfm = ini.sections.get("TaskForceMode");
    if (!campaign) err("campaign.no-campaign-section", "campaign.ini is missing [Campaign].");
    if (!tfm) {
      err("campaign.no-tfm", "campaign.ini is missing [TaskForceMode].");
    } else {
      if (tfm.get("Enabled") !== "True") {
        err("campaign.tfm-disabled", "[TaskForceMode] Enabled=True is required.");
      }
      if (!tfm.get("CommanderSettingsFile")) {
        err("campaign.no-commander-file", "CommanderSettingsFile is missing.");
      }
      if (!tfm.get("RosterFile")) {
        err("campaign.no-roster-file", "RosterFile is missing.");
      }
      const presets = (tfm.get("TaskForceDifficultyPresets") ?? "").split("|").filter(Boolean);
      if (presets.length === 0) {
        err("campaign.no-presets", "TaskForceDifficultyPresets lists no presets.");
      }
      for (const p of presets) {
        if (!ini.sections.has(`TaskForceModeDifficulty_${p}`)) {
          err(
            "campaign.preset-missing-section",
            `Preset "${p}" has no [TaskForceModeDifficulty_${p}] section.`,
          );
        }
      }
      const referenced = [tfm.get("CommanderSettingsFile"), tfm.get("RosterFile")];
      for (const ref of referenced) {
        if (ref && !bundle.files.some((f) => f.relativePath.endsWith(`/${ref}`))) {
          err("campaign.referenced-file-missing", `Referenced file "${ref}" is not in the bundle.`);
        }
      }
    }
    const mission1 = ini.sections.get("Mission1");
    if (!mission1) {
      err("campaign.no-mission", "campaign.ini defines no [Mission1].");
    } else {
      const missionFile = mission1.get("MissionFile") ?? "";
      if (!bundle.files.some((f) => missionFile.endsWith(f.relativePath.split("/").pop() ?? ""))) {
        err("campaign.mission-file-missing", `MissionFile "${missionFile}" is not in the bundle.`);
      }
      if (mission1.get("TaskForceModeMissionGenerationType") !== "Generated") {
        err("mission.not-generated", "First version supports Generated missions only.");
      }
    }
  }

  // --- roster ---
  const rosterText = fileOf(bundle, "player_task_force_roster.ini");
  if (!rosterText) {
    err("roster.missing", "Bundle has no player_task_force_roster.ini.");
  } else {
    const ini = parseIni(rosterText);
    const sections = ["AllowedVessels", "AllowedSubmarines", "AllowedAircraft", "AllowedHelicopters"];
    const present = sections.filter((s) => ini.sections.has(s));
    if (present.length === 0) {
      err("roster.empty", "Roster defines no allowed unit sections.");
    }
    for (const s of present) {
      for (const [unitType, value] of ini.sections.get(s)!) {
        if (!discoveredTypes.has(unitType)) {
          err("roster.unknown-unit", `Roster unit "${unitType}" is not in the discovered catalog.`);
        }
        if (!value.includes("|")) {
          err("roster.no-cost", `Roster line for "${unitType}" has no point cost separator.`);
        } else {
          const cost = Number(value.split("|").pop());
          if (!Number.isFinite(cost)) {
            err("roster.bad-cost", `Roster cost for "${unitType}" is not a number.`);
          } else if (cost === 0) {
            warn("roster.zero-cost", `Roster cost for "${unitType}" is zero.`);
          }
        }
        const entry = catalog.find((u) => u.unitType === unitType);
        if (
          entry &&
          (entry.category === "vessel" || entry.category === "submarine") &&
          entry.variants.length === 0
        ) {
          warn(
            "roster.no-variants",
            `"${unitType}" lists no VariantReference names; verify the unit's variants file.`,
          );
        }
      }
    }
  }

  // --- mission file ---
  const missionText = bundle.files.find(
    (f) => f.relativePath === bundle.missionRelativePath,
  )?.content;
  if (!missionText) {
    err("mission.missing", "Bundle has no mission file.");
  } else {
    const ini = parseIni(missionText);
    const mission = ini.sections.get("Mission");
    if (!mission) {
      err("mission.no-mission-section", "Mission file is missing [Mission].");
    } else {
      if (mission.get("PlayerTaskforce") !== "Taskforce1") {
        err("mission.no-player-taskforce", "Mission must set PlayerTaskforce=Taskforce1.");
      }
    }
    // Anchor rules: exactly one anchor, on Taskforce1Vessel1.
    const anchors = ini.sectionOrder.filter(
      (s) => ini.sections.get(s)?.get("TaskForceModeAnchor") === "True",
    );
    if (anchors.length === 0) {
      err("mission.no-anchor", "No section sets TaskForceModeAnchor=True.");
    } else if (anchors.length > 1) {
      err("mission.multiple-anchors", `Multiple anchors: ${anchors.join(", ")}.`);
    } else if (anchors[0] !== "Taskforce1Vessel1") {
      err(
        "mission.anchor-wrong-section",
        `Anchor must be on [Taskforce1Vessel1] for Generated missions (found on [${anchors[0]}]).`,
      );
    }
    // Completion + exit paths.
    const triggerSections = ini.sectionOrder.filter((s) => /^Trigger\d+$/.test(s));
    const hasEndMission = triggerSections.some(
      (s) => ini.sections.get(s)?.get("Action_EndMission") === "True",
    );
    if (!hasEndMission) err("mission.no-exit", "No trigger ends the mission (Action_EndMission).");
    const hasVictory = triggerSections.some((s) => ini.sections.get(s)?.has("Action_Victory"));
    if (!hasVictory) warn("mission.no-victory", "No trigger assigns victory.");
    const language = ini.sections.get("Language_en");
    if (!language) {
      warn("mission.no-language", "Mission has no [Language_en] messages.");
    } else {
      if (![...language.keys()].some((k) => k.includes("Intro"))) {
        warn("mission.no-intro", "Mission has no intro/briefing message.");
      }
      if (![...language.keys()].some((k) => k.includes("Completion"))) {
        warn("mission.no-completion-message", "Mission has no completion message.");
      }
    }
    // Guaranteed completion path: at least one completion trigger must not
    // depend solely on enemy destruction.
    const completionTriggers = triggerSections.filter((s) =>
      ini.sections.get(s)?.has("Action_Victory"),
    );
    const hasStableCompletion = completionTriggers.some((s) => {
      const sec = ini.sections.get(s)!;
      const conditions = (sec.get("ConditionsCompleted") ?? "");
      const timeConditions = [...sec.keys()].filter(
        (k) => /^Condition_.+_Type$/.test(k) && sec.get(k) === "Time",
      );
      return timeConditions.length > 0 && conditions.includes("OR");
    });
    const enemyOnly = completionTriggers.length > 0 && !hasStableCompletion;
    if (completionTriggers.length > 0 && enemyOnly) {
      // Check whether the only conditions are enemy-dependent.
      const allTime = completionTriggers.every((s) => {
        const sec = ini.sections.get(s)!;
        return [...sec.keys()].some((k) => /^Condition_.+_Type$/.test(k) && sec.get(k) === "Time");
      });
      if (!allTime) {
        err(
          "mission.uncertain-completion",
          "Every completion path depends on enemy units; the mission could become unwinnable.",
        );
      }
    }
  }

  // --- Unverified-schema notices ---
  if (!bundle.referenceMissionPath) {
    warn(
      "mission.no-reference",
      "No reference mission selected: the generated mission carries no world location/date/environment keys. " +
        "Pick a base-game mission (ideally in the target theater) so those keys are copied from real game data.",
    );
  }
  info(
    "export.commander-placeholder",
    "commander_settings.ini is a minimal placeholder; its schema is not yet verified against base-game examples.",
  );
  info(
    "export.playtest",
    "This is a playtest export: verify the mission loads in Sea Power and report anything the game rejects so the generators can be corrected.",
  );

  return buildResult(issues);
}
