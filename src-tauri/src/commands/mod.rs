mod adblocker;
mod dialog;
mod navigation;
mod settings_cmd;
mod tabs;
mod webview;

pub use adblocker::{
  add_to_allowlist, get_adblocker_settings, get_allowlist, get_block_stats, persist_block_count,
  remove_from_allowlist, set_adblocker_enabled,
};
pub use dialog::{hide_new_tab_dialog, navigate_to, show_new_tab_dialog};
pub use navigation::{go_back, go_forward, navigate, reload};
pub use settings_cmd::{
  fetch_page_title, get_sidebar_settings, hide_settings, save_sidebar_settings, show_settings,
};
pub use tabs::{close_tab, create_tab, get_tab_info, switch_tab};
pub use webview::{set_content_layout, set_sidebar_position, set_sidebar_width, set_topnav_height};
