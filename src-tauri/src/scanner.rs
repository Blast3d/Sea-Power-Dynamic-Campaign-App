//! Read-only StreamingAssets scanner and conservative INI summarizer.
//!
//! This module never writes. It lists candidate `.ini` files and records raw
//! observations needed for the first discovered-data catalog work.

use serde::Serialize;
use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::io::{BufRead, BufReader};
use std::path::Path;

const CANDIDATE_FOLDERS: &[&str] = &[
    "campaigns",
    "missions",
    "units",
    "aircraft",
    "vessels",
    "submarines",
    "helicopters",
    "land_units",
    "squadrons",
    "loadouts",
    "factions",
    "nations",
    "biologic",
];

const NON_GAMEPLAY_NATION_VALUES: &[&str] = &[
    "Nation",
    "Country",
    "Land",
    "Nacion",
    "Nación",
    "Pais",
    "País",
    "Pays",
    "Quoc gia",
    "Quốc gia",
    "Strana",
    "Страна",
    "Нация",
    "국가",
    "国家",
    "国家/组织",
];

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiscoveredIniFile {
    pub source_root: String,
    pub content_folder: String,
    pub relative_path: String,
    pub absolute_path: String,
    pub file_size_bytes: u64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiscoveredNationValue {
    pub raw_value: String,
    pub file_count: usize,
    pub occurrence_count: usize,
    pub example_paths: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CountedValue {
    pub value: String,
    pub count: usize,
}

#[derive(Debug, Clone, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct IniSummary {
    pub parsed_files: usize,
    pub parse_warnings: usize,
    pub section_count: usize,
    pub key_value_count: usize,
    pub task_force_cost_count: usize,
    pub files_with_task_force_cost: usize,
    pub category_counts: BTreeMap<String, usize>,
    pub top_sections: Vec<CountedValue>,
    pub top_keys: Vec<CountedValue>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanResult {
    pub streaming_assets_root: String,
    pub files: Vec<DiscoveredIniFile>,
    pub nation_values: Vec<DiscoveredNationValue>,
    pub ini_summary: IniSummary,
    pub warnings: Vec<String>,
    pub unknown_folders: Vec<String>,
}

#[derive(Default)]
struct NationAccumulator {
    occurrence_count: usize,
    file_paths: BTreeSet<String>,
    example_paths: Vec<String>,
}

#[derive(Default)]
struct SummaryAccumulator {
    parsed_files: usize,
    parse_warnings: usize,
    section_count: usize,
    key_value_count: usize,
    task_force_cost_count: usize,
    files_with_task_force_cost: usize,
    category_counts: BTreeMap<String, usize>,
    sections: BTreeMap<String, usize>,
    keys: BTreeMap<String, usize>,
}

impl SummaryAccumulator {
    fn into_summary(self) -> IniSummary {
        IniSummary {
            parsed_files: self.parsed_files,
            parse_warnings: self.parse_warnings,
            section_count: self.section_count,
            key_value_count: self.key_value_count,
            task_force_cost_count: self.task_force_cost_count,
            files_with_task_force_cost: self.files_with_task_force_cost,
            category_counts: self.category_counts,
            top_sections: top_counts(self.sections, 12),
            top_keys: top_counts(self.keys, 12),
        }
    }
}

fn top_counts(values: BTreeMap<String, usize>, limit: usize) -> Vec<CountedValue> {
    let mut counted: Vec<CountedValue> = values
        .into_iter()
        .map(|(value, count)| CountedValue { value, count })
        .collect();
    counted.sort_by(|a, b| b.count.cmp(&a.count).then_with(|| a.value.cmp(&b.value)));
    counted.truncate(limit);
    counted
}

pub(crate) fn strip_inline_comment(value: &str) -> &str {
    value.split("//").next().unwrap_or(value).trim()
}

pub(crate) fn looks_like_gameplay_nation(value: &str) -> bool {
    if value.is_empty() || value.contains(':') || value.contains('：') {
        return false;
    }
    !NON_GAMEPLAY_NATION_VALUES
        .iter()
        .any(|v| v.eq_ignore_ascii_case(value))
}

fn observe_ini(
    path: &Path,
    relative_path: &str,
    content_folder: &str,
    nations: &mut BTreeMap<String, NationAccumulator>,
    summary: &mut SummaryAccumulator,
) {
    let file = match fs::File::open(path) {
        Ok(f) => f,
        Err(_) => {
            summary.parse_warnings += 1;
            return;
        }
    };

    summary.parsed_files += 1;
    *summary
        .category_counts
        .entry(content_folder.to_string())
        .or_default() += 1;

    let reader = BufReader::new(file);
    let mut has_task_force_cost = false;

    for line in reader.lines().map_while(Result::ok) {
        let trimmed = line.trim_start();
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
                    summary.section_count += 1;
                    *summary.sections.entry(section.to_string()).or_default() += 1;
                }
            }
            continue;
        }

        let Some((key, value)) = trimmed.split_once('=') else {
            continue;
        };
        let key = key.trim();
        if key.is_empty() {
            continue;
        }
        summary.key_value_count += 1;
        *summary.keys.entry(key.to_string()).or_default() += 1;

        if key.eq_ignore_ascii_case("TaskForceCost") {
            summary.task_force_cost_count += 1;
            has_task_force_cost = true;
        }

        if key.eq_ignore_ascii_case("Nation") {
            let raw = strip_inline_comment(value).to_string();
            if looks_like_gameplay_nation(&raw) {
                let entry = nations.entry(raw).or_default();
                entry.occurrence_count += 1;
                if entry.file_paths.insert(relative_path.to_string()) && entry.example_paths.len() < 3 {
                    entry.example_paths.push(relative_path.to_string());
                }
            }
        }
    }

    if has_task_force_cost {
        summary.files_with_task_force_cost += 1;
    }
}

fn collect_ini_files(
    dir: &Path,
    streaming_root: &Path,
    source_root: &str,
    content_folder: &str,
    out: &mut Vec<DiscoveredIniFile>,
    nations: &mut BTreeMap<String, NationAccumulator>,
    summary: &mut SummaryAccumulator,
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
            collect_ini_files(
                &path,
                streaming_root,
                source_root,
                content_folder,
                out,
                nations,
                summary,
                warnings,
            );
        } else if path
            .extension()
            .map(|e| e.eq_ignore_ascii_case("ini"))
            .unwrap_or(false)
        {
            let size = entry.metadata().map(|m| m.len()).unwrap_or(0);
            let rel = path
                .strip_prefix(streaming_root)
                .map(|p| p.to_string_lossy().replace('\\', "/"))
                .unwrap_or_else(|_| path.to_string_lossy().into_owned());
            observe_ini(&path, &rel, content_folder, nations, summary);
            out.push(DiscoveredIniFile {
                source_root: source_root.to_string(),
                content_folder: content_folder.to_string(),
                relative_path: rel,
                absolute_path: path.to_string_lossy().into_owned(),
                file_size_bytes: size,
            });
        }
    }
}

fn scan_source_root(
    streaming_root: &Path,
    source_root: &str,
    files: &mut Vec<DiscoveredIniFile>,
    nations: &mut BTreeMap<String, NationAccumulator>,
    summary: &mut SummaryAccumulator,
    warnings: &mut Vec<String>,
    unknown_folders: &mut Vec<String>,
) {
    let root = streaming_root.join(source_root);
    if !root.is_dir() {
        warnings.push(format!("StreamingAssets/{source_root} not found; skipping."));
        return;
    }

    for folder in CANDIDATE_FOLDERS {
        let dir = root.join(folder);
        if dir.is_dir() {
            collect_ini_files(
                &dir,
                streaming_root,
                source_root,
                folder,
                files,
                nations,
                summary,
                warnings,
            );
        } else {
            warnings.push(format!(
                "StreamingAssets/{source_root}/{folder} not present (this can be normal)."
            ));
        }
    }

    if let Ok(entries) = fs::read_dir(&root) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                if let Some(name) = path.file_name().map(|n| n.to_string_lossy().into_owned()) {
                    if !CANDIDATE_FOLDERS
                        .iter()
                        .any(|f| f.eq_ignore_ascii_case(&name))
                    {
                        unknown_folders.push(format!("{source_root}/{name}"));
                    }
                }
            }
        }
    }
}

pub fn scan_streaming_assets(raw: &str) -> Result<ScanResult, String> {
    let validation = crate::sea_power_paths::validate_game_path(raw);
    let root_str = validation
        .streaming_assets_root
        .ok_or_else(|| "Not a valid Sea Power StreamingAssets path.".to_string())?;
    let streaming_root = Path::new(&root_str).to_path_buf();

    let mut files = Vec::new();
    let mut nations = BTreeMap::new();
    let mut summary = SummaryAccumulator::default();
    let mut warnings = validation.warnings.clone();
    let mut unknown_folders = Vec::new();

    scan_source_root(
        &streaming_root,
        "original",
        &mut files,
        &mut nations,
        &mut summary,
        &mut warnings,
        &mut unknown_folders,
    );
    scan_source_root(
        &streaming_root,
        "user",
        &mut files,
        &mut nations,
        &mut summary,
        &mut warnings,
        &mut unknown_folders,
    );

    let mut nation_values: Vec<DiscoveredNationValue> = nations
        .into_iter()
        .map(|(raw_value, acc)| DiscoveredNationValue {
            raw_value,
            file_count: acc.file_paths.len(),
            occurrence_count: acc.occurrence_count,
            example_paths: acc.example_paths,
        })
        .collect();
    nation_values.sort_by(|a, b| {
        b.occurrence_count
            .cmp(&a.occurrence_count)
            .then_with(|| a.raw_value.cmp(&b.raw_value))
    });

    Ok(ScanResult {
        streaming_assets_root: root_str,
        files,
        nation_values,
        ini_summary: summary.into_summary(),
        warnings,
        unknown_folders,
    })
}
