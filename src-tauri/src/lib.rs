//! Sea Power Dynamic Campaign - Tauri shell.
//!
//! The Rust side stays deliberately thin (see docs/IMPLEMENTATION_READINESS.md):
//! high-level filesystem commands only. The UI never gets arbitrary
//! filesystem access. Export exists but is gated: the user explicitly
//! requested playtest export, bundles must pass `validateExportBundle` in
//! the UI first, and `export::export_campaign_files` refuses any write
//! outside `StreamingAssets/user/<Mod Name>/`.

mod catalog;
mod export;
mod scanner;
mod sea_power_paths;

use catalog::DiscoveredCatalogs;
use export::{ExportFile, ExportOutcome};
use scanner::ScanResult;
use sea_power_paths::PathValidation;

/// Validate a user-selected Sea Power install/content path.
/// Read-only. Never touches files, only checks directory shape.
#[tauri::command]
fn validate_game_path(path: String) -> PathValidation {
    sea_power_paths::validate_game_path(&path)
}

/// Read-only scan of a StreamingAssets root: lists candidate .ini files under
/// known content folders in `original` and `user` without parsing schemas.
#[tauri::command]
fn scan_streaming_assets(path: String) -> Result<ScanResult, String> {
    scanner::scan_streaming_assets(&path)
}

/// Read-only promotion of scanner observations into typed discovered
/// catalogs: nations/factions, units, variants, squadron/loadout signals,
/// and Task Force costs. Raw values and source paths are preserved.
#[tauri::command]
fn build_discovered_catalogs(path: String) -> Result<DiscoveredCatalogs, String> {
    catalog::build_discovered_catalogs(&path)
}

/// Read-only: fetch the text of a mission file inside StreamingAssets so the
/// generator can copy unverified [Mission] keys from real game data.
#[tauri::command]
fn read_reference_mission(path: String, relative_path: String) -> Result<String, String> {
    export::read_reference_mission(&path, &relative_path)
}

/// Gated write: export a validated bundle under StreamingAssets/user/<mod>/.
/// Refuses traversal, unsafe names, anything touching `original`, and
/// overwrites without the explicit flag.
#[tauri::command]
fn export_campaign_files(
    path: String,
    mod_name: String,
    files: Vec<ExportFile>,
    overwrite: bool,
) -> Result<ExportOutcome, String> {
    export::export_campaign_files(&path, &mod_name, files, overwrite)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            validate_game_path,
            scan_streaming_assets,
            build_discovered_catalogs,
            read_reference_mission,
            export_campaign_files
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
