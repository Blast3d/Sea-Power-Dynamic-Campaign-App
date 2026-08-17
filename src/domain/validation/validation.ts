/**
 * Validation domain (docs/IMPLEMENTATION_READINESS.md "First Validator
 * Definition Of Done" + docs/PROJECT_PLAN.md "Validation Philosophy").
 *
 * Hard game requirements are errors; design-quality issues are warnings.
 */

export type ValidationSeverity = "error" | "warning" | "info";

export interface ValidationIssue {
  /** Stable rule id, e.g. "path.missing", "export.under-original". */
  ruleId: string;
  severity: ValidationSeverity;
  message: string;
  /** Optional pointer to the offending entity. */
  subjectId?: string;
}

export interface ValidationResult {
  issues: ValidationIssue[];
  /** True when no error-severity issues exist. */
  passed: boolean;
  /** ISO timestamp of the run (real time, not campaign time). */
  ranAt: string;
}

export function buildResult(issues: ValidationIssue[]): ValidationResult {
  return {
    issues,
    passed: issues.every((i) => i.severity !== "error"),
    ranAt: new Date().toISOString(),
  };
}
