//! Read-only validation of Sea Power install / content paths.
//!
//! Accepted shapes (per docs/IMPLEMENTATION_READINESS.md):
//! 1. A Sea Power install root containing `Sea Power_Data/StreamingAssets`.
//! 2. A `Sea Power_Data` folder containing `StreamingAssets`.
//! 3. A `StreamingAssets` folder itself.
//!
//! Never writes. Never resolves into `original` beyond existence checks.

use serde::Serialize;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PathValidation {
    /// True when a StreamingAssets root was resolved.
    pub is_valid: bool,
    /// Resolved StreamingAssets root, when found.
    pub streaming_assets_root: Option<String>,
    /// Whether `StreamingAssets/original` exists (base game content, read-only).
    pub has_original: bool,
    /// Whether `StreamingAssets/user` exists (user/mod-owned content).
    pub has_user: bool,
    /// Human-readable problems. Missing `user` is a warning, not an error.
    pub errors: Vec<String>,
    pub warnings: Vec<String>,
}

fn dir_exists(p: &Path) -> bool {
    p.is_dir()
}

/// Try to resolve a StreamingAssets root from any of the accepted shapes.
fn resolve_streaming_assets(input: &Path) -> Option<PathBuf> {
    // Shape 3: the path itself is a StreamingAssets folder.
    if input
        .file_name()
        .map(|n| n.eq_ignore_ascii_case("StreamingAssets"))
        .unwrap_or(false)
        && dir_exists(input)
    {
        return Some(input.to_path_buf());
    }
    // Shape 2: <path>/StreamingAssets
    let direct = input.join("StreamingAssets");
    if dir_exists(&direct) {
        return Some(direct);
    }
    // Shape 1: <path>/Sea Power_Data/StreamingAssets
    let nested = input.join("Sea Power_Data").join("StreamingAssets");
    if dir_exists(&nested) {
        return Some(nested);
    }
    None
}

pub fn validate_game_path(raw: &str) -> PathValidation {
    let mut errors = Vec::new();
    let mut warnings = Vec::new();

    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return PathValidation {
            is_valid: false,
            streaming_assets_root: None,
            has_original: false,
            has_user: false,
            errors: vec!["No game path selected.".into()],
            warnings,
        };
    }

    let input = Path::new(trimmed);
    if !input.exists() {
        return PathValidation {
            is_valid: false,
            streaming_assets_root: None,
            has_original: false,
            has_user: false,
            errors: vec![format!("Path does not exist: {trimmed}")],
            warnings,
        };
    }

    match resolve_streaming_assets(input) {
        Some(root) => {
            let has_original = dir_exists(&root.join("original"));
            let has_user = dir_exists(&root.join("user"));
            if !has_original {
                warnings.push(
                    "StreamingAssets/original not found. Base game content could not be located; \
                     scanning will be limited."
                        .into(),
                );
            }
            if !has_user {
                warnings.push(
                    "StreamingAssets/user not found. This folder is created by Sea Power for \
                     user/mod content; export (when implemented) requires it."
                        .into(),
                );
            }
            PathValidation {
                is_valid: true,
                streaming_assets_root: Some(root.to_string_lossy().into_owned()),
                has_original,
                has_user,
                errors,
                warnings,
            }
        }
        None => {
            errors.push(
                "Selected path is not a Sea Power install: could not find \
                 'Sea Power_Data/StreamingAssets' under it, and it is not itself a \
                 StreamingAssets folder."
                    .into(),
            );
            PathValidation {
                is_valid: false,
                streaming_assets_root: None,
                has_original: false,
                has_user: false,
                errors,
                warnings,
            }
        }
    }
}
