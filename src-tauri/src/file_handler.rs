use std::fs;

/// 获取文件的元数据（大小）
#[tauri::command]
pub fn get_file_metadata(path: String) -> Result<FileMetadata, String> {
    let metadata = fs::metadata(&path).map_err(|e| format!("无法读取文件: {}", e))?;
    Ok(FileMetadata {
        size: metadata.len(),
    })
}

/// 读取文件内容为字节数组
#[tauri::command]
pub fn read_file(path: String) -> Result<Vec<u8>, String> {
    fs::read(&path).map_err(|e| format!("无法读取文件: {}", e))
}

/// 读取文本文件内容为字符串
#[tauri::command]
pub fn read_text_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("无法读取文件: {}", e))
}

/// 列出文件夹中所有支持的文件
#[tauri::command]
pub fn list_folder_files(folder_path: String) -> Result<Vec<FolderEntry>, String> {
    let dir = fs::read_dir(&folder_path)
        .map_err(|e| format!("无法读取文件夹: {}", e))?;

    let supported_extensions = ["txt", "pdf", "docx", "doc", "md", "markdown"];
    let mut entries = Vec::new();

    for entry in dir {
        let entry = entry.map_err(|e| format!("读取条目失败: {}", e))?;
        let path = entry.path();

        if path.is_file() {
            if let Some(ext) = path.extension() {
                let ext_lower = ext.to_string_lossy().to_lowercase();
                if supported_extensions.contains(&ext_lower.as_str()) {
                    entries.push(FolderEntry {
                        name: path.file_name()
                            .unwrap_or_default()
                            .to_string_lossy()
                            .to_string(),
                        path: path.to_string_lossy().to_string(),
                        extension: ext_lower,
                    });
                }
            }
        }
    }

    entries.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    Ok(entries)
}

#[derive(serde::Serialize)]
pub struct FileMetadata {
    pub size: u64,
}

#[derive(serde::Serialize)]
pub struct FolderEntry {
    pub name: String,
    pub path: String,
    pub extension: String,
}
