// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use serde::{Serialize, Deserialize};
use std::fs;

#[derive(Serialize, Deserialize)]
struct Preferences {
    sit_time: u32,
    stand_time: u32,
}

#[tauri::command]
fn load_preferences() -> Preferences {
    match fs::read_to_string("preferences.json") {
        Ok(contents) => serde_json::from_str(&contents).unwrap_or(Preferences { sit_time: 25, stand_time: 5 }),
        Err(_) => Preferences { sit_time: 25, stand_time: 5 },
    }
}

#[tauri::command]
fn save_preferences(sit_time: u32, stand_time: u32) -> Result<(), String> {
    let prefs = Preferences { sit_time, stand_time };
    let json = serde_json::to_string(&prefs).map_err(|e| e.to_string())?;
    fs::write("preferences.json", json).map_err(|e| e.to_string())
}

#[tauri::command]
fn play_notification(app_handle: tauri::AppHandle) {
    // You'll need to implement the actual sound playing logic here.
    // This could involve using a Rust audio library or invoking a system command.
    println!("Playing notification sound");
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // Any additional setup can go here
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![load_preferences, save_preferences, play_notification])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

