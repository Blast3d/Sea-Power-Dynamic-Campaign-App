//! Read-only discovered-catalog builder.
//!
//! Promotes raw scanner observations into typed catalog records:
//! nations/factions first, then units with variants, squadron/loadout
//! signals, and Task Force costs. This module NEVER writes.
//!
//! Conservatism rules (docs/IMPLEMENTATION_READINESS.md, AGENTS.md):
//! - Preserve exact raw values (`Nation=Iraq` vs `Nation=iraq` stay distinct).
//! - Preserve source root, source mod, and relative path for every record.
//! - Schema assumptions that are heuristic (display names, section-name
//!   prefixes) are surfaced as such via field names and `heuristic_notes`,
//!   never silently treated as verified schema.

use serde::Serialize;
use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::path::Path;

use crate::scanner::{looks_like_gameplay_nation, strip_inline_comment};

/// Content folders that carry purchasable/placeable unit definitions.
const UNIT_FOLDERS: &[&str] = &[
    "vessels",
    "submarines",
    "aircraft",
    "helicopters",
    "land_units",
];

// ---------------------------------------------------------------------------
// Payload types
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NationsReferenceEntry {
    /// Unit-type prefix, e.g. `usn`, `wp`, `ir`.
    pub prefix: String,
    /// Mapped nation name, e.g. `US`, `Soviet`.
    pub nation_name: String,
    pub source_root: String,
    pub relative_path: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiscoveredNation {
    /// Exact raw `Nation=` value, spelling and case preserved.
    pub raw_value: String,
    pub occurrence_count: usize,
    pub file_count: usize,
    pub example_paths: Vec<String>,
    /// Prefixes from nations_reference.ini whose NationName equals this raw
    /// value exactly (case-sensitive match kept separate from ci_matches).
    pub reference_prefixes: Vec<String>,
    /// True when a nations_reference NationName matches only case-insensitively.
    pub case_insensitive_reference_match: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiscoveredLoadoutCost {
    /// Suffix after `LoadoutCost_`, exact case preserved (e.g. `Late`).
    pub loadout: String,
    pub raw_value: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiscoveredVariant {
    /// Section name, exact case preserved (e.g. `Variant3`).
    pub section: String,
    /// Raw `Nation=` value inside that section, when present.
    pub nation: Option<String>,
    /// Relative path of the file the section was found in.
    pub source_path: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiscoveredUnit {
    /// Internal unit type ID = base file stem, exact case preserved.
    /// `<stem>_variants.ini` files are folded into the same unit.
    pub unit_type: String,
    /// Content folder the unit came from: vessels/submarines/aircraft/helicopters/land_units.
    pub category: String,
    pub source_root: String,
    /// First path component under `user/`, when source_root == "user".
    pub source_mod: Option<String>,
    /// Every file that contributed to this record.
    pub source_paths: Vec<String>,
    /// Raw `Nation=` values observed anywhere in the unit's files.
    pub nations: Vec<String>,
    /// NationName from nations_reference.ini via unit-type prefix, if mapped.
    pub reference_nation: Option<String>,
    /// Variant sections observed (heuristic: section name starts with "Variant").
    pub variants: Vec<DiscoveredVariant>,
    /// Squadron sections observed (heuristic: section name starts with "Squadron").
    pub squadron_sections: Vec<String>,
    /// Loadout sections observed (heuristic: section name starts with "Loadout").
    pub loadout_sections: Vec<String>,
    /// Raw TaskForceCost value, unparsed, when present.
    pub task_force_cost_raw: Option<String>,
    /// Section the TaskForceCost was found in (usually `TaskForce`).
    pub task_force_cost_section: Option<String>,
    /// LoadoutCost_* entries, raw values preserved.
    pub loadout_costs: Vec<DiscoveredLoadoutCost>,
    /// Value of a `DisplayName=` key when one exists. Heuristic only.
    pub display_name_guess: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SupportFileRecord {
    /// File stem, exact case preserved.
    pub file_stem: String,
    /// "squadrons" or "loadouts".
    pub content_folder: String,
    pub source_root: String,
    pub source_mod: Option<String>,
    pub relative_path: String,
    /// Section names in the file, order preserved, deduplicated.
    pub sections: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct CatalogStats {
    pub parsed_files: usize,
    pub parse_warnings: usize,
    pub unit_count: usize,
    pub units_with_task_force_cost: usize,
    pub units_with_variants: usize,
    pub nation_value_count: usize,
    pub category_counts: BTreeMap<String, usize>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiscoveredCatalogs {
    pub streaming_assets_root: String,
    pub nations_reference: Vec<NationsReferenceEntry>,
    pub nations: Vec<DiscoveredNation>,
    pub units: Vec<DiscoveredUnit>,
    pub squadron_files: Vec<SupportFileRecord>,
    pub loadout_files: Vec<SupportFileRecord>,
    pub stats: CatalogStats,
    pub warnings: Vec<String>,
    /// Reminders about which fields are heuristic pending local-file schema
    /// verification. Shown in the UI so nothing reads as verified schema.
    pub heuristic_notes: Vec<String>,
}

// ---------------------------------------------------------------------------
// INI reading (line-conservative, encoding-tolerant, read-only)
// ---------------------------------------------------------------------------

struct IniLine {
    section: Option<String>,
    key: Option<String>,
    value: Option<String>,
}

/// Read a file as lossy UTF-8 (game files may carry BOM or odd encodings)
/// and yield (current_section, key, value) triples conservatively.
fn read_ini_lines(path: &Path) -> Option<Vec<IniLine>> {
    let bytes = fs::read(path).ok()?;
    let text = String::from_utf8_lossy(&bytes);
    let mut lines = Vec::new();
    for raw_line in text.lines() {
        let trimmed = raw_line.trim_start_matches('\u{feff}').trim();
        if trimmed.is_empty()
            || trimmed.starts_with('#')
            || trimmed.starts_with(';')
            || trimmed.starts_with("//")
        {
            continue;
        }
        if trimmed.starts_with('[') && trimmed.contains(']') {
            if let Some(section) = trimmed.trim_start_matches('[').split(']').next() {
                let section = section.trim();
                if !section.is_empty() {
                    lines.push(IniLine {
                        section: Some(section.to_string()),
                        key: None,
                        value: None,
                    });
                }
            }
            continue;
        }
        if let Some((key, value)) = trimmed.split_once('=') {
            let key = key.trim();
            if !key.is_empty() {
                lines.push(IniLine {
                    section: None,
                    key: Some(key.to_string()),
                    value: Some(value.trim().to_string()),
                });
            }
        }
    }
    Some(lines)
}

fn source_mod_of(source_root: &str, relative_path: &str) -> Option<String> {
    if source_root != "user" {
        return None;
    }
    let rest = relative_path.strip_prefix("user/")?;
    rest.split('/').next().map(|s| s.to_string())
}

fn unit_prefix(unit_type: &str) -> Option<&str> {
    unit_type.split('_').next().filter(|p| !p.is_empty())
}

// ---------------------------------------------------------------------------
// nations_reference.ini
// ---------------------------------------------------------------------------

fn parse_nations_reference(
    streaming_root: &Path,
    source_root: &str,
    relative_dir: &str,
    out: &mut Vec<NationsReferenceEntry>,
    warnings: &mut Vec<String>,
) {
    let rel = if relative_dir.is_empty() {
        format!("{source_root}/nations_reference.ini")
    } else {
        format!("{source_root}/{relative_dir}/nations_reference.ini")
    };
    let path = streaming_root.join(rel.replace('/', std::path::MAIN_SEPARATOR_STR));
    if !path.is_file() {
        return;
    }
    let Some(lines) = read_ini_lines(&path) else {
        warnings.push(format!("Could not read {rel}"));
        return;
    };
    for line in lines {
        if let (Some(key), Some(value)) = (line.key, line.value) {
            let value = strip_inline_comment(&value).to_string();
            if value.is_empty() {
                continue;
            }
            out.push(NationsReferenceEntry {
                prefix: key,
                nation_name: value,
                source_root: source_root.to_string(),
                relative_path: rel.clone(),
            });
        }
    }
}

// ---------------------------------------------------------------------------
// Unit accumulation
// ---------------------------------------------------------------------------

#[derive(Default)]
struct UnitAccumulator {
    source_root: String,
    source_mod: Option<String>,
    source_paths: BTreeSet<String>,
    nations: BTreeSet<String>,
    variants: Vec<DiscoveredVariant>,
    squadron_sections: BTreeSet<String>,
    loadout_sections: BTreeSet<String>,
    task_force_cost_raw: Option<String>,
    task_force_cost_section: Option<String>,
    loadout_costs: BTreeMap<String, String>,
    display_name_guess: Option<String>,
}

#[derive(Default)]
struct NationAccumulator {
    occurrence_count: usize,
    file_paths: BTreeSet<String>,
    example_paths: Vec<String>,
}

fn observe_unit_file(
    lines: &[IniLine],
    relative_path: &str,
    acc: &mut UnitAccumulator,
    nations: &mut BTreeMap<String, NationAccumulator>,
) {
    let mut current_section: Option<String> = None;

    for line in lines {
        if let Some(section) = &line.section {
            current_section = Some(section.clone());
            if section.starts_with("Variant") {
                acc.variants.push(DiscoveredVariant {
                    section: section.clone(),
                    nation: None,
                    source_path: relative_path.to_string(),
                });
            } else if section.starts_with("Squadron") {
                acc.squadron_sections.insert(section.clone());
            } else if section.starts_with("Loadout") {
                acc.loadout_sections.insert(section.clone());
            }
            continue;
        }
        let (Some(key), Some(value)) = (&line.key, &line.value) else {
            continue;
        };
        let clean = strip_inline_comment(value).to_string();

        if key.eq_ignore_ascii_case("Nation") {
            if looks_like_gameplay_nation(&clean) {
                acc.nations.insert(clean.clone());
                let entry = nations.entry(clean.clone()).or_default();
                entry.occurrence_count += 1;
                if entry.file_paths.insert(relative_path.to_string())
                    && entry.example_paths.len() < 3
                {
                    entry.example_paths.push(relative_path.to_string());
                }
                // Attach to the most recent Variant section from this file.
                if let Some(section) = &current_section {
                    if section.starts_with("Variant") {
                        if let Some(v) = acc
                            .variants
                            .iter_mut()
                            .rev()
                            .find(|v| &v.section == section && v.source_path == relative_path)
                        {
                            if v.nation.is_none() {
                                v.nation = Some(clean.clone());
                            }
                        }
                    }
                }
            }
        } else if key.eq_ignore_ascii_case("TaskForceCost") {
            // First observation wins; later duplicates are unusual and kept out
            // to stay deterministic. Raw string preserved, no numeric parsing.
            if acc.task_force_cost_raw.is_none() {
                acc.task_force_cost_raw = Some(clean.clone());
                acc.task_force_cost_section = current_section.clone();
            }
        } else if let Some(loadout) = key.strip_prefix("LoadoutCost_") {
            if !loadout.is_empty() {
                acc.loadout_costs
                    .entry(loadout.to_string())
                    .or_insert(clean.clone());
            }
        } else if key == "DisplayName" && acc.display_name_guess.is_none() && !clean.is_empty() {
            acc.display_name_guess = Some(clean);
        }
    }
}

fn walk_ini_files(
    dir: &Path,
    streaming_root: &Path,
    out: &mut Vec<(String, std::path::PathBuf)>,
    warnings: &mut Vec<String>,
) {
    let entries = match fs::read_dir(dir) {
        Ok(e) => e,
        Err(err) => {
            warnings.push(format!("Could not read {}: {err}", dir.display()));
            return;
        }
    };
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            walk_ini_files(&path, streaming_root, out, warnings);
        } else if path
            .extension()
            .map(|e| e.eq_ignore_ascii_case("ini"))
            .unwrap_or(false)
        {
            let rel = path
                .strip_prefix(streaming_root)
                .map(|p| p.to_string_lossy().replace('\\', "/"))
                .unwrap_or_else(|_| path.to_string_lossy().into_owned());
            out.push((rel, path));
        }
    }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

pub fn build_discovered_catalogs(raw: &str) -> Result<DiscoveredCatalogs, String> {
    let validation = crate::sea_power_paths::validate_game_path(raw);
    let root_str = validation
        .streaming_assets_root
        .ok_or_else(|| "Not a valid Sea Power StreamingAssets path.".to_string())?;
    let streaming_root = Path::new(&root_str).to_path_buf();

    let mut warnings = validation.warnings.clone();
    let mut stats = CatalogStats::default();

    // --- nations_reference.ini (original root + each user mod root) ---
    let mut nations_reference = Vec::new();
    parse_nations_reference(&streaming_root, "original", "", &mut nations_reference, &mut warnings);
    let user_root = streaming_root.join("user");
    if user_root.is_dir() {
        if let Ok(entries) = fs::read_dir(&user_root) {
            for entry in entries.flatten() {
                if entry.path().is_dir() {
                    let mod_name = entry.file_name().to_string_lossy().into_owned();
                    parse_nations_reference(
                        &streaming_root,
                        "user",
                        &mod_name,
                        &mut nations_reference,
                        &mut warnings,
                    );
                }
            }
        }
    }
    if nations_reference.is_empty() {
        warnings.push(
            "No nations_reference.ini found; nation prefix mapping unavailable.".to_string(),
        );
    }

    // Prefix -> nation name lookup (first mapping wins, original scanned first).
    let mut prefix_to_nation: BTreeMap<String, String> = BTreeMap::new();
    for entry in &nations_reference {
        prefix_to_nation
            .entry(entry.prefix.to_ascii_lowercase())
            .or_insert_with(|| entry.nation_name.clone());
    }

    // --- Units + nations across unit-bearing folders ---
    // Unit key: (source_root, category, base_stem). `_variants` files fold in.
    let mut units: BTreeMap<(String, String, String), UnitAccumulator> = BTreeMap::new();
    let mut nations: BTreeMap<String, NationAccumulator> = BTreeMap::new();
    let mut squadron_files = Vec::new();
    let mut loadout_files = Vec::new();

    for source_root in ["original", "user"] {
        let root = streaming_root.join(source_root);
        if !root.is_dir() {
            continue;
        }

        // Unit folders. For "user" they can be nested per mod:
        // user/<mod>/vessels/... — walk both shapes by scanning the whole
        // source root for candidate folders.
        let mut candidate_dirs: Vec<std::path::PathBuf> = Vec::new();
        for folder in UNIT_FOLDERS {
            let direct = root.join(folder);
            if direct.is_dir() {
                candidate_dirs.push(direct);
            }
        }
        if source_root == "user" {
            if let Ok(entries) = fs::read_dir(&root) {
                for entry in entries.flatten() {
                    let mod_dir = entry.path();
                    if mod_dir.is_dir() {
                        for folder in UNIT_FOLDERS {
                            let nested = mod_dir.join(folder);
                            if nested.is_dir() {
                                candidate_dirs.push(nested);
                            }
                        }
                    }
                }
            }
        }

        for dir in candidate_dirs {
            let category = dir
                .file_name()
                .map(|n| n.to_string_lossy().into_owned())
                .unwrap_or_default();
            let mut files = Vec::new();
            walk_ini_files(&dir, &streaming_root, &mut files, &mut warnings);
            for (rel, path) in files {
                let Some(lines) = read_ini_lines(&path) else {
                    stats.parse_warnings += 1;
                    continue;
                };
                stats.parsed_files += 1;

                let stem = path
                    .file_stem()
                    .map(|s| s.to_string_lossy().into_owned())
                    .unwrap_or_default();
                let base = stem
                    .strip_suffix("_variants")
                    .unwrap_or(&stem)
                    .to_string();

                let key = (source_root.to_string(), category.clone(), base);
                let acc = units.entry(key).or_default();
                acc.source_root = source_root.to_string();
                if acc.source_mod.is_none() {
                    acc.source_mod = source_mod_of(source_root, &rel);
                }
                acc.source_paths.insert(rel.clone());
                observe_unit_file(&lines, &rel, acc, &mut nations);
            }
        }

        // Squadron / loadout support folders: record file stems + sections
        // only. Schema is unverified; no field extraction yet.
        for (folder, bucket) in [
            ("squadrons", &mut squadron_files),
            ("loadouts", &mut loadout_files),
        ] {
            let mut dirs = vec![root.join(folder)];
            if source_root == "user" {
                if let Ok(entries) = fs::read_dir(&root) {
                    for entry in entries.flatten() {
                        if entry.path().is_dir() {
                            dirs.push(entry.path().join(folder));
                        }
                    }
                }
            }
            for dir in dirs {
                if !dir.is_dir() {
                    continue;
                }
                let mut files = Vec::new();
                walk_ini_files(&dir, &streaming_root, &mut files, &mut warnings);
                for (rel, path) in files {
                    let Some(lines) = read_ini_lines(&path) else {
                        stats.parse_warnings += 1;
                        continue;
                    };
                    stats.parsed_files += 1;
                    let mut sections = Vec::new();
                    let mut seen = BTreeSet::new();
                    for line in &lines {
                        if let Some(section) = &line.section {
                            if seen.insert(section.clone()) {
                                sections.push(section.clone());
                            }
                        }
                    }
                    bucket.push(SupportFileRecord {
                        file_stem: path
                            .file_stem()
                            .map(|s| s.to_string_lossy().into_owned())
                            .unwrap_or_default(),
                        content_folder: folder.to_string(),
                        source_root: source_root.to_string(),
                        source_mod: source_mod_of(source_root, &rel),
                        relative_path: rel,
                        sections,
                    });
                }
            }
        }
    }

    // --- Finalize units ---
    let mut unit_records: Vec<DiscoveredUnit> = units
        .into_iter()
        .map(|((source_root, category, unit_type), acc)| {
            let reference_nation = unit_prefix(&unit_type)
                .and_then(|p| prefix_to_nation.get(&p.to_ascii_lowercase()))
                .cloned();
            DiscoveredUnit {
                unit_type,
                category: category.clone(),
                source_root,
                source_mod: acc.source_mod,
                source_paths: acc.source_paths.into_iter().collect(),
                nations: acc.nations.into_iter().collect(),
                reference_nation,
                variants: acc.variants,
                squadron_sections: acc.squadron_sections.into_iter().collect(),
                loadout_sections: acc.loadout_sections.into_iter().collect(),
                task_force_cost_raw: acc.task_force_cost_raw,
                task_force_cost_section: acc.task_force_cost_section,
                loadout_costs: acc
                    .loadout_costs
                    .into_iter()
                    .map(|(loadout, raw_value)| DiscoveredLoadoutCost { loadout, raw_value })
                    .collect(),
                display_name_guess: acc.display_name_guess,
            }
        })
        .collect();
    unit_records.sort_by(|a, b| {
        a.category
            .cmp(&b.category)
            .then_with(|| a.unit_type.cmp(&b.unit_type))
            .then_with(|| a.source_root.cmp(&b.source_root))
    });

    stats.unit_count = unit_records.len();
    stats.units_with_task_force_cost = unit_records
        .iter()
        .filter(|u| u.task_force_cost_raw.is_some())
        .count();
    stats.units_with_variants = unit_records.iter().filter(|u| !u.variants.is_empty()).count();
    for u in &unit_records {
        *stats.category_counts.entry(u.category.clone()).or_default() += 1;
    }

    // --- Finalize nations ---
    let mut nation_records: Vec<DiscoveredNation> = nations
        .into_iter()
        .map(|(raw_value, acc)| {
            let reference_prefixes: Vec<String> = nations_reference
                .iter()
                .filter(|e| e.nation_name == raw_value)
                .map(|e| e.prefix.clone())
                .collect();
            let case_insensitive_reference_match = reference_prefixes.is_empty()
                && nations_reference
                    .iter()
                    .any(|e| e.nation_name.eq_ignore_ascii_case(&raw_value));
            DiscoveredNation {
                raw_value,
                occurrence_count: acc.occurrence_count,
                file_count: acc.file_paths.len(),
                example_paths: acc.example_paths,
                reference_prefixes,
                case_insensitive_reference_match,
            }
        })
        .collect();
    nation_records.sort_by(|a, b| {
        b.occurrence_count
            .cmp(&a.occurrence_count)
            .then_with(|| a.raw_value.cmp(&b.raw_value))
    });
    stats.nation_value_count = nation_records.len();

    Ok(DiscoveredCatalogs {
        streaming_assets_root: root_str,
        nations_reference,
        nations: nation_records,
        units: unit_records,
        squadron_files,
        loadout_files,
        stats,
        warnings,
        heuristic_notes: vec![
            "Variant/Squadron/Loadout section detection is prefix-based and unverified against full schema docs.".to_string(),
            "DisplayName values are a guess; authoritative display names may live in language/description files.".to_string(),
            "Unit type = file stem; `_variants` files are folded into their base unit.".to_string(),
            "Squadron and loadout files are recorded as file/section inventories only; field schemas are not parsed yet.".to_string(),
        ],
    })
}

// ---------------------------------------------------------------------------
// Tests (fixture-based; never touch a real install)
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::PathBuf;

    fn fixture_root(tag: &str) -> PathBuf {
        let root = std::env::temp_dir()
            .join("spdc-catalog-tests")
            .join(tag)
            .join("Sea Power_Data")
            .join("StreamingAssets");
        let _ = fs::remove_dir_all(&root);
        fs::create_dir_all(&root).unwrap();
        root
    }

    fn write(root: &Path, rel: &str, content: &str) {
        let path = root.join(rel);
        fs::create_dir_all(path.parent().unwrap()).unwrap();
        fs::write(path, content).unwrap();
    }

    fn build(root: &Path) -> DiscoveredCatalogs {
        build_discovered_catalogs(root.to_str().unwrap()).unwrap()
    }

    #[test]
    fn builds_nations_reference_and_prefix_mapping() {
        let root = fixture_root("nations");
        write(
            &root,
            "original/nations_reference.ini",
            "[NationsReference]\nusn=US\nwp=Soviet\nir=Iran\n",
        );
        write(
            &root,
            "original/vessels/usn_dd_test.ini",
            "[General]\nNation=US\n[TaskForce]\nTaskForceCost=27\nLoadoutCost_Late=10\n",
        );
        let catalogs = build(&root);

        assert_eq!(catalogs.nations_reference.len(), 3);
        let unit = &catalogs.units[0];
        assert_eq!(unit.unit_type, "usn_dd_test");
        assert_eq!(unit.reference_nation.as_deref(), Some("US"));
        assert_eq!(unit.task_force_cost_raw.as_deref(), Some("27"));
        assert_eq!(unit.task_force_cost_section.as_deref(), Some("TaskForce"));
        assert_eq!(unit.loadout_costs.len(), 1);
        assert_eq!(unit.loadout_costs[0].loadout, "Late");
        assert_eq!(unit.loadout_costs[0].raw_value, "10");

        let us = catalogs.nations.iter().find(|n| n.raw_value == "US").unwrap();
        assert_eq!(us.reference_prefixes, vec!["usn".to_string()]);
    }

    #[test]
    fn folds_variants_file_into_base_unit_and_preserves_raw_nation_case() {
        let root = fixture_root("variants");
        write(&root, "original/vessels/wp_pt_p6.ini", "[General]\nNation=Soviet\n");
        write(
            &root,
            "original/vessels/wp_pt_p6_variants.ini",
            "[Variant1]\nNation=Soviet\n[Variant2]\nNation=Iraq\n[Variant3]\nNation=iraq\n",
        );
        let catalogs = build(&root);

        assert_eq!(catalogs.units.len(), 1, "variants file must fold into base unit");
        let unit = &catalogs.units[0];
        assert_eq!(unit.unit_type, "wp_pt_p6");
        assert_eq!(unit.variants.len(), 3);
        assert_eq!(unit.variants[1].nation.as_deref(), Some("Iraq"));
        assert_eq!(unit.variants[2].nation.as_deref(), Some("iraq"));
        assert_eq!(unit.source_paths.len(), 2);

        // Raw spellings must remain distinct in the nations catalog.
        let raw_values: Vec<&str> =
            catalogs.nations.iter().map(|n| n.raw_value.as_str()).collect();
        assert!(raw_values.contains(&"Iraq"));
        assert!(raw_values.contains(&"iraq"));
    }

    #[test]
    fn attributes_user_units_to_their_mod() {
        let root = fixture_root("mods");
        write(
            &root,
            "user/MyMod/vessels/xx_custom_ship.ini",
            "[General]\nNation=Testland\n[TaskForce]\nTaskForceCost=5\n",
        );
        let catalogs = build(&root);
        let unit = catalogs
            .units
            .iter()
            .find(|u| u.unit_type == "xx_custom_ship")
            .unwrap();
        assert_eq!(unit.source_root, "user");
        assert_eq!(unit.source_mod.as_deref(), Some("MyMod"));
    }

    #[test]
    fn records_squadron_and_loadout_files_as_inventories_only() {
        let root = fixture_root("support");
        write(
            &root,
            "original/squadrons/usn_f14_squadron.ini",
            "[Squadron1]\nSomeKey=SomeValue\n[Squadron2]\nOther=1\n",
        );
        write(&root, "original/loadouts/usn_f14_loadouts.ini", "[LoadoutA]\nX=1\n");
        let catalogs = build(&root);

        assert_eq!(catalogs.squadron_files.len(), 1);
        assert_eq!(catalogs.squadron_files[0].sections, vec!["Squadron1", "Squadron2"]);
        assert_eq!(catalogs.loadout_files.len(), 1);
        assert_eq!(catalogs.loadout_files[0].file_stem, "usn_f14_loadouts");
    }

    #[test]
    fn missing_reference_file_is_warning_not_error() {
        let root = fixture_root("noref");
        write(&root, "original/vessels/aa_ship.ini", "[General]\nNation=US\n");
        let catalogs = build(&root);
        assert!(catalogs
            .warnings
            .iter()
            .any(|w| w.contains("nations_reference.ini")));
        assert_eq!(catalogs.units.len(), 1);
        assert!(catalogs.units[0].reference_nation.is_none());
    }
}
