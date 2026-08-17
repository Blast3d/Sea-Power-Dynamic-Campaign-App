import type { CampaignState } from "../campaign/campaignState";
import { buildResult, type ValidationIssue, type ValidationResult } from "./validation";

/** Result of the native path check, mirrored from the Tauri command. */
export interface GamePathStatus {
  isValid: boolean;
  streamingAssetsRoot?: string;
  hasOriginal: boolean;
  hasUser: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * First-validator milestone checks (docs/IMPLEMENTATION_READINESS.md):
 *
 * - selected game path missing
 * - selected path is not Sea Power / StreamingAssets
 * - attempted export target under `original`
 * - empty player side or opposing side
 * - no player task force in campaign state
 * - mission candidate with no objective
 * - mission candidate whose required contacts are all uncertain with no
 *   fallback completion path
 *
 * Plus the scaffold's permanent gate: export is not implemented.
 */
export function validateScaffoldCampaign(
  state: CampaignState,
  pathStatus: GamePathStatus | null,
): ValidationResult {
  const issues: ValidationIssue[] = [];

  // --- Game path ---
  if (!state.settings.gameInstallPath.trim()) {
    issues.push({
      ruleId: "path.missing",
      severity: "error",
      message: "No Sea Power install/content path is configured.",
    });
  } else if (pathStatus === null) {
    issues.push({
      ruleId: "path.unverified",
      severity: "warning",
      message:
        "The configured game path has not been verified yet (native check unavailable or not run).",
    });
  } else if (!pathStatus.isValid) {
    issues.push({
      ruleId: "path.invalid",
      severity: "error",
      message:
        pathStatus.errors[0] ??
        "Configured path is not a Sea Power install or StreamingAssets folder.",
    });
  } else {
    for (const w of pathStatus.warnings) {
      issues.push({ ruleId: "path.warning", severity: "warning", message: w });
    }
  }

  // --- Export boundary ---
  // Export now exists but only through the Mission Export flow, where a
  // bundle must pass validateExportBundle before any file is written, and
  // writes are restricted to StreamingAssets/user/<Mod Name>/.
  issues.push({
    ruleId: "export.gated",
    severity: "info",
    message:
      "Export is available only through the Mission Export panel: a generated bundle must pass " +
      "export validation, and files are written only under StreamingAssets/user/<Mod Name>/.",
  });
  if (pathStatus?.streamingAssetsRoot) {
    // Defensive: if any future export plan ever resolves under `original`, block it.
    const lower = pathStatus.streamingAssetsRoot.toLowerCase();
    if (lower.endsWith("original") || lower.includes("original/") || lower.includes("original\\")) {
      issues.push({
        ruleId: "export.under-original",
        severity: "error",
        message:
          "Resolved output root points inside StreamingAssets/original. Base game content is read-only.",
      });
    }
  }

  // --- Sides ---
  if (!state.settings.playerFactionId) {
    issues.push({
      ruleId: "sides.player-empty",
      severity: "error",
      message: "No player side selected.",
    });
  }
  if (state.settings.opposingFactionIds.length === 0) {
    issues.push({
      ruleId: "sides.opposing-empty",
      severity: "error",
      message: "No opposing side selected.",
    });
  }

  // --- Forces ---
  const playerTaskForces = state.taskForces.filter((tf) => tf.side === "player");
  if (playerTaskForces.length === 0) {
    issues.push({
      ruleId: "forces.no-player-task-force",
      severity: "error",
      message: "Campaign state contains no player task force.",
    });
  }

  // --- Mission candidates ---
  for (const mc of state.missionCandidates) {
    if (mc.objectives.length === 0) {
      issues.push({
        ruleId: "mission.no-objective",
        severity: "error",
        message: `Mission candidate "${mc.title}" has no objective.`,
        subjectId: mc.id,
      });
      continue;
    }
    const completionPaths = mc.objectives.filter((o) => o.sufficientForCompletion);
    const allUncertain =
      completionPaths.length > 0 &&
      completionPaths.every((o) => o.dependsOnUncertainContact);
    if (completionPaths.length === 0) {
      issues.push({
        ruleId: "mission.no-completion-path",
        severity: "error",
        message: `Mission candidate "${mc.title}" has no objective that can complete the mission.`,
        subjectId: mc.id,
      });
    } else if (allUncertain) {
      issues.push({
        ruleId: "mission.uncertain-completion",
        severity: "error",
        message:
          `Mission candidate "${mc.title}": every completion objective depends on an uncertain ` +
          "contact and there is no fallback completion path. The mission could become unwinnable " +
          "if contacts do not spawn.",
        subjectId: mc.id,
      });
    }
  }

  // --- Seed data notice ---
  const seedUnits = state.unitCatalog.filter((u) => u.provenance.kind === "seed").length;
  if (seedUnits > 0) {
    issues.push({
      ruleId: "catalog.seed-data",
      severity: "info",
      message:
        `${seedUnits} unit catalog entries are placeholder seed data. ` +
        "They will be replaced by discovered Sea Power units once scanning is implemented and can never be exported.",
    });
  }

  return buildResult(issues);
}
