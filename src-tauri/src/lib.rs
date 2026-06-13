mod file_handler;
mod api_proxy;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            file_handler::get_file_metadata,
            file_handler::read_file,
            file_handler::read_text_file,
            file_handler::list_folder_files,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
