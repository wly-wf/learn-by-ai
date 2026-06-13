use reqwest::Client;
use serde_json::Value;

/// 代理 AI API 请求，保护 API Key 不暴露给前端
#[tauri::command]
pub async fn proxy_ai_request(
    url: String,
    api_key: String,
    body: Value,
) -> Result<Value, String> {
    let client = Client::new();

    let response = client
        .post(&url)
        .header("Content-Type", "application/json")
        .header("Authorization", format!("Bearer {}", api_key))
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("请求失败: {}", e))?;

    let status = response.status();
    let response_body: Value = response
        .json()
        .await
        .map_err(|e| format!("解析响应失败: {}", e))?;

    if !status.is_success() {
        let error_msg = response_body
            .get("error")
            .and_then(|e| e.get("message"))
            .and_then(|m| m.as_str())
            .unwrap_or("未知错误");
        return Err(format!("API 错误 ({}): {}", status.as_u16(), error_msg));
    }

    Ok(response_body)
}
