//! Gated campaign export.
//!
//! This is the ONLY module in the app that writes to disk, and it writes
//! exclusively under `StreamingAssets/user/<Mod Name>/`. Guards:
//!
//! - the target StreamingAssets root must validate via `validate_game_path`
//! - the mod name and every relative path are checked for traversal and
//!   unsafe characters before any filesystem call
//! - any path that would resolve under `StreamingAssets/original` is refused
//! - existing files are never overwritten unless `overwrite` is passed
//!
//! `read_reference_mission` is read-only: it returns the text of a mission
//! file strictly inside StreamingAssets so the generator can copy unverified
//! `[Mission]` keys (location/date/environment) from real game data.

use serde::Serialize;
use std::fs;
use std::path::{Component, Path, PathBuf};

const MAX_REFERENCE_BYTES: u64 = 2 * 1024 * 1024;

#[derive(Debug, Clone, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportFile {
    pub relative_path: String,
    pub content: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportOutcome {
    pub mod_root: String,
    pub written: Vec<String>,
    pub skipped_existing: Vec<String>,
}

fn safe_component(name: &str) -> bool {
    !name.is_empty()
        && name
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-' || c == '.')
        && name != "."
        && name != ".."
        && !name.eq_ignore_ascii_case("original")
}

/// Validate a bundle-relative path: no traversal, no absolute parts, every
/// component safe, and never pointing at `original`.
fn validate_relative_path(rel: &str) -> Result<PathBuf, String> {
    let path = Path::new(rel);
    let mut clean = PathBuf::new();
    for component in path.components() {
        match component {
            Component::Normal(part) => {
                let part = part.to_string_lossy();
                if !safe_component(&part) {
                    return Err(format!("Unsafe path component \"{part}\" in {rel}"));
                }
                clean.push(part.as_ref());
            }
            _ => return Err(format!("Path {rel} must be a plain relative path")),
        }
    }
    if clean.as_os_str().is_empty() {
        return Err("Empty relative path".to_string());
    }
    Ok(clean)
}

fn resolve_streaming_root(game_path: &str) -> Result<PathBuf, String> {
    let validation = crate::sea_power_paths::validate_game_path(game_path);
    let root = validation
        .streaming_assets_root
        .ok_or_else(|| "Not a valid Sea Power StreamingAssets path.".to_string())?;
    Ok(PathBuf::from(root))
}

/// Read a mission file inside StreamingAssets, read-only, size-capped.
pub fn read_reference_mission(game_path: &str, relative_path: &str) -> Result<String, String> {
    let streaming_root = resolve_streaming_root(game_path)?;
    let rel = validate_reference_path(relative_path)?;
    let path = streaming_root.join(&rel);
    if !path.is_file() {
        return Err(format!("Reference mission not found: {relative_path}"));
    }
    let size = fs::metadata(&path).map(|m| m.len()).unwrap_or(0);
    if size > MAX_REFERENCE_BYTES {
        return Err(format!("Reference mission too large ({size} bytes)"));
    }
    let bytes = fs::read(&path).map_err(|e| format!("Could not read {relative_path}: {e}"))?;
    Ok(String::from_utf8_lossy(&bytes).into_owned())
}

/// Reference paths MAY be under `original` (read-only is fine); they still
/// must be plain relative .ini paths without traversal.
fn validate_reference_path(rel: &str) -> Result<PathBuf, String> {
    let path = Path::new(rel);
    let mut clean = PathBuf::new();
    for component in path.components() {
        match component {
            Component::Normal(part) => {
                let part = part.to_string_lossy();
                if part == ".." || part.contains(':') {
                    return Err(format!("Unsafe path component in {rel}"));
                }
                clean.push(part.as_ref());
            }
            _ => return Err(format!("Path {rel} must be a plain relative path")),
        }
    }
    if !clean
        .extension()
        .map(|e| e.eq_ignore_ascii_case("ini"))
        .unwrap_or(false)
    {
        return Err("Reference must be an .ini file".to_string());
    }
    Ok(clean)
}

/// Write an export bundle under `StreamingAssets/user/<mod_name>/`.
pub fn export_campaign_files(
    game_path: &str,
    mod_name: &str,
    files: Vec<ExportFile>,
    overwrite: bool,
) -> Result<ExportOutcome, String> {
    if files.is_empty() {
        return Err("Nothing to export.".to_string());
    }
    if !safe_component(mod_name) || mod_name.contains('.') {
        return Err(format!("Unsafe mod name: {mod_name}"));
    }

    let streaming_root = resolve_streaming_root(game_path)?;
    let user_root = streaming_root.join("user");
    if !user_root.is_dir() {
        return Err(
            "StreamingAssets/user does not exist. Start Sea Power once (or create the folder manually) before exporting."
                .to_string(),
        );
    }
    let mod_root = user_root.join(mod_name);

    // Validate every path BEFORE writing anything.
    let mut planned: Vec<(PathBuf, &ExportFile)> = Vec::new();
    for file in &files {
        let rel = validate_relative_path(&file.relative_path)?;
        let target = mod_root.join(&rel);
        // Defense in depth: the joined path must stay under mod_root.
        if !target.starts_with(&mod_root) {
            return Err(format!("Path escapes the mod folder: {}", file.relative_path));
        }
        // And mod_root itself must be under user/, never original.
        if target
            .components()
            .any(|c| matches!(c, Component::Normal(p) if p.eq_ignore_ascii_case("original")))
        {
            return Err(format!(
                "Refusing path touching base-game content: {}",
                file.relative_path
            ));
        }
        planned.push((target, file));
    }

    let mut written = Vec::new();
    let mut skipped_existing = Vec::new();
    for (target, file) in planned {
        if target.exists() && !overwrite {
            skipped_existing.push(target.to_string_lossy().into_owned());
            continue;
        }
        if let Some(parent) = target.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Could not create {}: {e}", parent.display()))?;
        }
        fs::write(&target, &file.content)
            .map_err(|e| format!("Could not write {}: {e}", target.display()))?;
        written.push(target.to_string_lossy().into_owned());
    }

    Ok(ExportOutcome {
        mod_root: mod_root.to_string_lossy().into_owned(),
        written,
        skipped_existing,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    fn fixture_root(tag: &str) -> PathBuf {
        let root = std::env::temp_dir()
            .join("spdc-export-tests")
            .join(tag)
            .join("Sea Power_Data")
            .join("StreamingAssets");
        let _ = fs::remove_dir_all(&root);
        fs::create_dir_all(root.join("original").join("missions")).unwrap();
        fs::create_dir_all(root.join("user")).unwrap();
        root
    }

    fn game_path(root: &Path) -> String {
        root.to_str().unwrap().to_string()
    }

    fn one_file(rel: &str) -> Vec<ExportFile> {
        vec![ExportFile {
            relative_path: rel.to_string(),
            content: "[Campaign]\nType=Linear\n".to_string(),
        }]
    }

    #[test]
    fn writes_under_user_mod_root_only() {
        let root = fixture_root("write");
        let outcome = export_campaign_files(
            &game_path(&root),
            "SPDC_Campaign",
            one_file("campaigns/test/campaign.ini"),
            false,
        )
        .unwrap();
        assert_eq!(outcome.written.len(), 1);
        assert!(root
            .join("user/SPDC_Campaign/campaigns/test/campaign.ini")
            .is_file());
    }

    #[test]
    fn refuses_traversal_and_original_paths() {
        let root = fixture_root("guard");
        let gp = game_path(&root);
        assert!(export_campaign_files(&gp, "Mod", one_file("../evil.ini"), false).is_err());
        assert!(export_campaign_files(&gp, "Mod", one_file("original/x.ini"), false).is_err());
        assert!(export_campaign_files(&gp, "..", one_file("a.ini"), false).is_err());
        assert!(export_campaign_files(&gp, "original", one_file("a.ini"), false).is_err());
        // Nothing may have been written anywhere.
        assert!(fs::read_dir(root.join("user")).unwrap().next().is_none());
    }

    #[test]
    fn never_overwrites_without_flag() {
        let root = fixture_root("overwrite");
        let gp = game_path(&root);
        let files = one_file("campaigns/test/campaign.ini");
        export_campaign_files(&gp, "Mod", files.clone(), false).unwrap();
        let second = export_campaign_files(&gp, "Mod", files.clone(), false).unwrap();
        assert_eq!(second.written.len(), 0);
        assert_eq!(second.skipped_existing.len(), 1);
        let third = export_campaign_files(&gp, "Mod", files, true).unwrap();
        assert_eq!(third.written.len(), 1);
    }

    #[test]
    fn requires_existing_user_folder() {
        let root = fixture_root("nouser");
        fs::remove_dir_all(root.join("user")).unwrap();
        let err = export_campaign_files(
            &game_path(&root),
            "Mod",
            one_file("campaigns/test/campaign.ini"),
            false,
        )
        .unwrap_err();
        assert!(err.contains("user"));
    }

    #[test]
    fn reads_reference_mission_read_only_including_original() {
        let root = fixture_root("reference");
        fs::write(
            root.join("original/missions/ref.ini"),
            "[Mission]\nSomeKey=1\n",
        )
        .unwrap();
        let text =
            read_reference_mission(&game_path(&root), "original/missions/ref.ini").unwrap();
        assert!(text.contains("SomeKey=1"));
        assert!(
            read_reference_mission(&game_path(&root), "original/../../etc/passwd.ini").is_err()
        );
        assert!(read_reference_mission(&game_path(&root), "original/missions/ref.txt").is_err());
    }
}
