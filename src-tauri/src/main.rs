#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use serde::{Serialize, Deserialize};
use std::fs;
use chrono::Local;
use std::fs::OpenOptions;
use std::io::Write;
use tauri::api::notification::Notification;


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



#[tauri::command]
fn log_notification() -> Result<(), String> {
    let now = Local::now();
    let log_entry = format!("Notification played at: {}\n", now);
    
    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open("notification_log.txt")
        .map_err(|e| e.to_string())?;

    file.write_all(log_entry.as_bytes())
        .map_err(|e| e.to_string())?;

    println!("Notification logged: {}", log_entry);
    Ok(())
}

#[tauri::command]
async fn show_notification(window: tauri::Window, title: String, body: String) -> Result<(), String> {
    let now = Local::now();
    let log_entry = format!("Notification shown at: {} - Title: {}, Body: {}\n", now, title, body);
    
    // Log to file
    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open("notification_log.txt")
        .map_err(|e| e.to_string())?;

    file.write_all(log_entry.as_bytes())
        .map_err(|e| e.to_string())?;

    println!("Notification logged: {}", log_entry);

    // Show system notification
Notification::new(&window.app_handle().config().tauri.bundle.identifier)
        .title(title)
        .body(body)
        .show()
        .map_err(|e| e.to_string())?;

    Ok(())
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // Any additional setup can go here
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            load_preferences,
            save_preferences,
            show_notification
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
