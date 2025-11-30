use tauri::WebviewUrl;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            let window = tauri::window::WindowBuilder::new(app, "main")
                .title("Mu")
                .inner_size(1600.0, 900.0)
                .maximized(true)
                .decorations(false)
                .build()?;

            // Content Webview (Below top bar)
            let _content_webview = window.add_child(
                tauri::webview::WebviewBuilder::new(
                    "content",
                    WebviewUrl::External("https://google.com".parse().unwrap()),
                ),
                tauri::LogicalPosition::new(0, 0),
                tauri::LogicalSize::new(1600, 900),
            )?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
