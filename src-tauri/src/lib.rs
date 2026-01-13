//! Mu Browser - A minimalist web browser built with Tauri
//!
//! This is the main library entry point that configures and runs the Tauri application.

mod modules;

use modules::command_palette::commands as cp_commands;
use modules::command_palette::models::CommandPaletteState;
use modules::navigation::commands as nav_commands;
use modules::navigation::models::NavigationHistory;
use modules::sidebar::commands as sidebar_commands;
use modules::sidebar::models::{Position, SidebarState};
use modules::tabs::commands as tab_commands;
use modules::tabs::models::TabManager;
use modules::webview::commands as webview_commands;
use modules::webview::models::NavBarState;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, LogicalPosition, LogicalSize, Manager, WebviewUrl, WindowEvent};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

/// Height of the hover trigger area when nav is hidden
const TRIGGER_HEIGHT: f64 = 8.0;
/// Height of the navigation bar when visible
const NAV_BAR_HEIGHT: f64 = 44.0;
/// Width of the sidebar
const SIDEBAR_WIDTH: f64 = 256.0;
/// Width of the peek area when sidebar is hidden
const PEEK_WIDTH: f64 = 8.0;

fn register_app_shortcuts(app: &AppHandle) {
    let shortcut_manager = app.global_shortcut();

    // 既存登録が残っていても確実にクリアしてから登録する
    let _ = shortcut_manager.unregister_all();

    let app_l = app.clone();
    let _ = shortcut_manager.on_shortcut("ctrl+l", move |_app, _shortcut, event| {
        if event.state == ShortcutState::Pressed {
            let _ = app_l.emit_to("main", "shortcut:toggle-command-palette", ());
        }
    });

    let app_t = app.clone();
    let _ = shortcut_manager.on_shortcut("ctrl+t", move |_app, _shortcut, event| {
        if event.state == ShortcutState::Pressed {
            let _ = app_t.emit_to("main", "shortcut:create-new-tab", ());
        }
    });

    let app_w = app.clone();
    let _ = shortcut_manager.on_shortcut("ctrl+w", move |_app, _shortcut, event| {
        if event.state == ShortcutState::Pressed {
            let _ = app_w.emit_to("main", "shortcut:close-current-tab", ());
        }
    });

    let app_b = app.clone();
    let _ = shortcut_manager.on_shortcut("ctrl+b", move |_app, _shortcut, event| {
        if event.state == ShortcutState::Pressed {
            let _ = app_b.emit_to("main", "shortcut:toggle-sidebar", ());
        }
    });

    // Alt+← (戻る)
    let app_back = app.clone();
    let _ = shortcut_manager.on_shortcut("alt+left", move |_app, _shortcut, event| {
        if event.state == ShortcutState::Pressed {
            let _ = app_back.emit_to("main", "shortcut:go-back", ());
        }
    });

    // Alt+→ (進む)
    let app_forward = app.clone();
    let _ = shortcut_manager.on_shortcut("alt+right", move |_app, _shortcut, event| {
        if event.state == ShortcutState::Pressed {
            let _ = app_forward.emit_to("main", "shortcut:go-forward", ());
        }
    });

    // Ctrl+R (リロード)
    let app_reload = app.clone();
    let _ = shortcut_manager.on_shortcut("ctrl+r", move |_app, _shortcut, event| {
        if event.state == ShortcutState::Pressed {
            let _ = app_reload.emit_to("main", "shortcut:reload", ());
        }
    });

    // Ctrl+Tab (次のタブ)
    let app_next_tab = app.clone();
    let _ = shortcut_manager.on_shortcut("ctrl+tab", move |_app, _shortcut, event| {
        if event.state == ShortcutState::Pressed {
            let _ = app_next_tab.emit_to("main", "shortcut:next-tab", ());
        }
    });

    // Ctrl+Shift+Tab (前のタブ)
    let app_prev_tab = app.clone();
    let _ = shortcut_manager.on_shortcut("ctrl+shift+tab", move |_app, _shortcut, event| {
        if event.state == ShortcutState::Pressed {
            let _ = app_prev_tab.emit_to("main", "shortcut:previous-tab", ());
        }
    });
}

fn unregister_app_shortcuts(app: &AppHandle) {
    let _ = app.global_shortcut().unregister_all();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(NavBarState::new())
        .manage(Mutex::new(NavigationHistory::new()))
        .manage(Mutex::new(TabManager::new()))
        .manage(CommandPaletteState::new())
        .manage(SidebarState::new())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            // WebView commands
            webview_commands::navigate_to,
            webview_commands::get_current_url,
            webview_commands::get_loading_state,
            webview_commands::set_nav_visible,
            // Navigation commands
            nav_commands::go_back,
            nav_commands::go_forward,
            nav_commands::reload,
            nav_commands::go_home,
            nav_commands::update_history_if_changed,
            // Tab commands
            tab_commands::create_tab,
            tab_commands::close_tab,
            tab_commands::switch_tab,
            tab_commands::get_all_tabs,
            tab_commands::get_active_tab_id,
            tab_commands::update_tab_title,
            tab_commands::update_tab_url,
            tab_commands::create_new_tab,
            tab_commands::close_current_tab,
            tab_commands::handle_title_changed,
            tab_commands::handle_favicon_changed,
            tab_commands::switch_to_next_tab,
            tab_commands::switch_to_previous_tab,
            // Command Palette commands
            cp_commands::open_command_palette,
            cp_commands::close_command_palette,
            cp_commands::toggle_command_palette,
            // Sidebar commands
            sidebar_commands::toggle_sidebar,
            sidebar_commands::get_sidebar_visible,
            sidebar_commands::set_sidebar_visible,
        ])
        .setup(|app| {
            let width = 800.0;
            let height = 600.0;

            // Create the main window without a default webview
            let window = tauri::window::WindowBuilder::new(app, "main")
                .title("mu")
                .inner_size(width, height)
                .maximized(true)
                .decorations(false)
                .build()?;

            // Get actual window size (may be maximized)
            let scale_factor = window.scale_factor().unwrap_or(1.0);
            let actual_size = window.inner_size().unwrap_or(tauri::PhysicalSize::new(
                (width * scale_factor) as u32,
                (height * scale_factor) as u32,
            ));
            let actual_width = actual_size.width as f64 / scale_factor;
            let actual_height = actual_size.height as f64 / scale_factor;

            // Add the content webview (full size, positioned at origin)
            // Sidebar will overlay on top of this
            let _content_webview = window.add_child(
                tauri::webview::WebviewBuilder::new(
                    "content",
                    WebviewUrl::External("https://google.com".parse().unwrap()),
                )
                .initialization_script(
                    r#"
                    // タイトルとファビコンの変更を検知してTauriイベントを発行
                    let lastTitle = document.title;
                    let lastFavicon = null;

                    function getFaviconUrl() {
                        // 優先順位順にファビコンを検索
                        const selectors = [
                            'link[rel="icon"]',
                            'link[rel="shortcut icon"]',
                            'link[rel="apple-touch-icon"]',
                            'link[rel="apple-touch-icon-precomposed"]'
                        ];

                        for (const selector of selectors) {
                            const link = document.querySelector(selector);
                            if (link && link.href) {
                                return link.href;
                            }
                        }

                        // デフォルトのfavicon.icoを返す
                        try {
                            const url = new URL('/favicon.ico', window.location.origin);
                            return url.href;
                        } catch (e) {
                            return null;
                        }
                    }

                    function notifyTitleChange() {
                        const currentTitle = document.title;
                        if (currentTitle !== lastTitle) {
                            lastTitle = currentTitle;
                            window.__TAURI_INTERNALS__.invoke('handle_title_changed', {
                                title: currentTitle
                            }).catch(console.error);
                        }
                    }

                    function notifyFaviconChange() {
                        const currentFavicon = getFaviconUrl();
                        if (currentFavicon !== lastFavicon) {
                            lastFavicon = currentFavicon;
                            window.__TAURI_INTERNALS__.invoke('handle_favicon_changed', {
                                favicon: currentFavicon
                            }).catch(console.error);
                        }
                    }

                    function notifyChanges() {
                        notifyTitleChange();
                        notifyFaviconChange();
                    }

                    // MutationObserverでtitle要素とfavicon要素の変更を監視
                    const observer = new MutationObserver(() => {
                        notifyTitleChange();
                    });

                    // titleタグの変更を監視
                    const titleElement = document.querySelector('title');
                    if (titleElement) {
                        observer.observe(titleElement, {
                            childList: true,
                            characterData: true,
                            subtree: true
                        });
                    }

                    // headの変更も監視（SPAでtitleタグやfaviconが動的に追加される場合）
                    const headObserver = new MutationObserver(() => {
                        const newTitleElement = document.querySelector('title');
                        if (newTitleElement && !titleElement) {
                            observer.observe(newTitleElement, {
                                childList: true,
                                characterData: true,
                                subtree: true
                            });
                        }
                        notifyChanges();
                    });

                    if (document.head) {
                        headObserver.observe(document.head, {
                            childList: true,
                            subtree: true
                        });
                    }

                    // ページロード完了時にもチェック
                    if (document.readyState === 'complete') {
                        notifyChanges();
                    } else {
                        window.addEventListener('load', () => {
                            notifyChanges();
                        });
                    }

                    // DOMContentLoadedでもチェック
                    if (document.readyState === 'loading') {
                        document.addEventListener('DOMContentLoaded', () => {
                            notifyChanges();
                        });
                    }
                    "#,
                ),
                LogicalPosition::new(0.0, 0.0),
                LogicalSize::new(actual_width, actual_height),
            )?;

            // 起動時にタブが一つもない場合、初期タブを作成
            {
                let tab_manager = app.state::<Mutex<TabManager>>();
                let mut manager = tab_manager.lock().unwrap();
                if manager.get_all_tabs().is_empty() {
                    let _initial_tab_id = manager.create_tab("https://google.com".to_string());
                }
            }

            // Add the UI webview on top (React app for navigation bar)
            // Initially only show trigger area, nav bar appears on hover
            let _ui_webview = window.add_child(
                tauri::webview::WebviewBuilder::new("ui", WebviewUrl::App(Default::default()))
                    .transparent(true),
                LogicalPosition::new(0.0, 0.0),
                LogicalSize::new(actual_width, TRIGGER_HEIGHT),
            )?;

            // Add the sidebar webview
            // Always positioned at left edge, visibility controlled by React component animation
            let _sidebar_webview = window.add_child(
                tauri::webview::WebviewBuilder::new(
                    "sidebar",
                    WebviewUrl::App("sidebar.html".into()),
                )
                .transparent(true),
                LogicalPosition::new(0.0, 0.0),
                LogicalSize::new(SIDEBAR_WIDTH, actual_height),
            )?;

            // Add the command palette webview (transparent, initially hidden, full size)
            let command_palette_webview = window.add_child(
                tauri::webview::WebviewBuilder::new(
                    "command-palette",
                    WebviewUrl::App("command-palette.html".into()),
                )
                .transparent(true),
                LogicalPosition::new(0.0, 0.0),
                LogicalSize::new(actual_width, actual_height),
            )?;
            // Hide the command palette initially
            command_palette_webview.hide()?;

            // Handle window resize events
            let app_handle = app.handle().clone();
            window.on_window_event(move |event| {
                match event {
                    WindowEvent::Resized(size) => {
                        let nav_state = app_handle.state::<NavBarState>();
                        let nav_visible = nav_state.is_visible();

                        if let (
                            Some(window),
                            Some(ui_webview),
                            Some(content_webview),
                            Some(sidebar_webview),
                            Some(cp_webview),
                        ) = (
                            app_handle.get_window("main"),
                            app_handle.get_webview("ui"),
                            app_handle.get_webview("content"),
                            app_handle.get_webview("sidebar"),
                            app_handle.get_webview("command-palette"),
                        ) {
                            let scale_factor = window.scale_factor().unwrap_or(1.0);
                            let width = size.width as f64 / scale_factor;
                            let height = size.height as f64 / scale_factor;

                            // Get sidebar state
                            let sidebar_state = app_handle.state::<SidebarState>();
                            let position = sidebar_state.get_position();
                            let sidebar_visible = sidebar_state.is_visible();

                            // Command palette webview always full size
                            let _ = cp_webview.set_position(LogicalPosition::new(0.0, 0.0));
                            let _ = cp_webview.set_size(LogicalSize::new(width, height));

                            // Content always full size (sidebar overlays on top)
                            let _ = content_webview.set_position(LogicalPosition::new(0.0, 0.0));
                            let _ = content_webview.set_size(LogicalSize::new(width, height));

                            // UI webview always full width
                            let _ = ui_webview.set_position(LogicalPosition::new(0.0, 0.0));
                            let ui_height = if nav_visible {
                                NAV_BAR_HEIGHT
                            } else {
                                TRIGGER_HEIGHT
                            };
                            let _ = ui_webview.set_size(LogicalSize::new(width, ui_height));

                            // Sidebar position based on visibility and position setting
                            let sidebar_x = match position {
                                Position::Left => {
                                    if sidebar_visible {
                                        0.0
                                    } else {
                                        -SIDEBAR_WIDTH + PEEK_WIDTH
                                    }
                                }
                                Position::Right => {
                                    if sidebar_visible {
                                        width - SIDEBAR_WIDTH
                                    } else {
                                        width - PEEK_WIDTH
                                    }
                                }
                            };
                            let _ =
                                sidebar_webview.set_position(LogicalPosition::new(sidebar_x, 0.0));
                            let _ = sidebar_webview.set_size(LogicalSize::new(SIDEBAR_WIDTH, height));
                        }
                    }
                    WindowEvent::Focused(is_focused) => {
                        if *is_focused {
                            register_app_shortcuts(&app_handle);
                        } else {
                            unregister_app_shortcuts(&app_handle);
                        }
                    }
                    _ => {}
                }
            });

            // フォーカス中のみショートカットを登録（他アプリのショートカットを奪わない）
            if window.is_focused().unwrap_or(false) {
                register_app_shortcuts(&app.handle().clone());
            } else {
                unregister_app_shortcuts(&app.handle().clone());
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
