use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Tab {
    pub id: String,
    pub title: String,
    pub url: String,
    pub is_active: bool,
    pub favicon: Option<String>,
    pub webview_label: String,
    pub last_active_at: u64,
}

pub struct TabManager {
    tabs: HashMap<String, Tab>,
    tab_order: Vec<String>, // タブの順序を保持
    active_tab_id: Option<String>,
    next_id: usize,
}

impl TabManager {
    pub fn new() -> Self {
        Self {
            tabs: HashMap::new(),
            tab_order: Vec::new(),
            active_tab_id: None,
            next_id: 1,
        }
    }

    pub fn create_tab(&mut self, url: String) -> String {
        let id = format!("tab-{}", self.next_id);
        self.next_id += 1;
        let webview_label = format!("content-{}", id);
        let now = current_time_ms();

        let tab = Tab {
            id: id.clone(),
            title: "新しいタブ".to_string(),
            url,
            is_active: false,
            favicon: None,
            webview_label,
            last_active_at: now,
        };

        self.tabs.insert(id.clone(), tab);
        self.tab_order.push(id.clone()); // タブの順序を保持
        self.switch_tab(&id).ok();
        id
    }

    pub fn close_tab(&mut self, id: &str) -> Result<(), String> {
        if self.tabs.remove(id).is_none() {
            return Err("タブが見つかりません".to_string());
        }

        // 閉じるタブのインデックスを見つける
        let closed_index = self.tab_order.iter().position(|tab_id| tab_id == id);

        // タブの順序からも削除
        self.tab_order.retain(|tab_id| tab_id != id);

        // アクティブなタブが閉じられた場合、別のタブをアクティブにする
        if self.active_tab_id.as_deref() == Some(id) {
            let next_tab_id = if let Some(index) = closed_index {
                // 閉じたタブの位置にあるタブ（元々その下にあったタブ）を取得
                // なければ、その前のタブ（一番下のタブを閉じた場合）
                self.tab_order.get(index).or_else(|| {
                    if index > 0 {
                        self.tab_order.get(index - 1)
                    } else {
                        None
                    }
                }).cloned()
            } else {
                None
            };

            // 新しいアクティブタブに切り替え
            if let Some(next_id) = next_tab_id {
                self.switch_tab(&next_id)?;
            } else {
                self.active_tab_id = None;
            }
        }

        Ok(())
    }

    pub fn switch_tab(&mut self, id: &str) -> Result<(), String> {
        if !self.tabs.contains_key(id) {
            return Err("タブが見つかりません".to_string());
        }

        // 現在のアクティブタブを非アクティブにする
        if let Some(current_id) = &self.active_tab_id {
            if let Some(tab) = self.tabs.get_mut(current_id) {
                tab.is_active = false;
            }
        }

        // 新しいタブをアクティブにする
        if let Some(tab) = self.tabs.get_mut(id) {
            tab.is_active = true;
            tab.last_active_at = current_time_ms();
            self.active_tab_id = Some(id.to_string());
            Ok(())
        } else {
            Err("タブが見つかりません".to_string())
        }
    }

    pub fn get_all_tabs(&self) -> Vec<Tab> {
        // tab_orderの順序でタブを返す
        self.tab_order
            .iter()
            .filter_map(|id| self.tabs.get(id).cloned())
            .collect()
    }

    pub fn get_active_tab_id(&self) -> Option<String> {
        self.active_tab_id.clone()
    }

    pub fn get_active_tab(&self) -> Option<Tab> {
        self.active_tab_id
            .as_ref()
            .and_then(|id| self.tabs.get(id))
            .cloned()
    }

    pub fn get_tab(&self, id: &str) -> Option<Tab> {
        self.tabs.get(id).cloned()
    }

    pub fn get_active_webview_label(&self) -> Option<String> {
        self.get_active_tab().map(|tab| tab.webview_label)
    }

    pub fn get_next_active_after_close(&self, id: &str) -> Option<String> {
        if self.active_tab_id.as_deref() != Some(id) {
            return None;
        }

        let closed_index = self.tab_order.iter().position(|tab_id| tab_id == id)?;

        self.tab_order
            .get(closed_index)
            .or_else(|| if closed_index > 0 { self.tab_order.get(closed_index - 1) } else { None })
            .cloned()
    }

    pub fn get_next_tab_id(&self) -> Option<String> {
        let active_id = self.active_tab_id.as_ref()?;
        let current_index = self.tab_order.iter().position(|id| id == active_id)?;
        let next_index = (current_index + 1) % self.tab_order.len();
        self.tab_order.get(next_index).cloned()
    }

    pub fn get_previous_tab_id(&self) -> Option<String> {
        let active_id = self.active_tab_id.as_ref()?;
        let current_index = self.tab_order.iter().position(|id| id == active_id)?;
        let previous_index = if current_index == 0 {
            self.tab_order.len() - 1
        } else {
            current_index - 1
        };
        self.tab_order.get(previous_index).cloned()
    }

    pub fn update_tab_title(&mut self, id: &str, title: String) -> Result<(), String> {
        if let Some(tab) = self.tabs.get_mut(id) {
            tab.title = title;
            Ok(())
        } else {
            Err("タブが見つかりません".to_string())
        }
    }

    pub fn update_tab_url(&mut self, id: &str, url: String) -> Result<(), String> {
        if let Some(tab) = self.tabs.get_mut(id) {
            tab.url = url;
            Ok(())
        } else {
            Err("タブが見つかりません".to_string())
        }
    }

    pub fn update_tab_favicon(&mut self, id: &str, favicon: Option<String>) -> Result<(), String> {
        if let Some(tab) = self.tabs.get_mut(id) {
            tab.favicon = favicon;
            Ok(())
        } else {
            Err("タブが見つかりません".to_string())
        }
    }

    /// 次のタブに切り替え
    pub fn switch_to_next_tab(&mut self) -> Result<String, String> {
        let active_id = self
            .active_tab_id
            .as_ref()
            .ok_or_else(|| "アクティブなタブがありません".to_string())?;

        let current_index = self
            .tab_order
            .iter()
            .position(|id| id == active_id)
            .ok_or_else(|| "アクティブなタブが見つかりません".to_string())?;

        // 次のタブのインデックス（最後のタブの場合は最初に戻る）
        let next_index = (current_index + 1) % self.tab_order.len();
        let next_id = self
            .tab_order
            .get(next_index)
            .ok_or_else(|| "次のタブが見つかりません".to_string())?
            .clone();

        self.switch_tab(&next_id)?;
        Ok(next_id)
    }

    /// 前のタブに切り替え
    pub fn switch_to_previous_tab(&mut self) -> Result<String, String> {
        let active_id = self
            .active_tab_id
            .as_ref()
            .ok_or_else(|| "アクティブなタブがありません".to_string())?;

        let current_index = self
            .tab_order
            .iter()
            .position(|id| id == active_id)
            .ok_or_else(|| "アクティブなタブが見つかりません".to_string())?;

        // 前のタブのインデックス（最初のタブの場合は最後に戻る）
        let previous_index = if current_index == 0 {
            self.tab_order.len() - 1
        } else {
            current_index - 1
        };

        let previous_id = self
            .tab_order
            .get(previous_index)
            .ok_or_else(|| "前のタブが見つかりません".to_string())?
            .clone();

        self.switch_tab(&previous_id)?;
        Ok(previous_id)
    }
}

fn current_time_ms() -> u64 {
    use std::time::{SystemTime, UNIX_EPOCH};

    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis() as u64)
        .unwrap_or(0)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_next_previous_tab_id() {
        let mut manager = TabManager::new();
        let first = manager.create_tab("https://example.com".to_string());
        let second = manager.create_tab("https://example.org".to_string());
        let third = manager.create_tab("https://example.net".to_string());

        manager.switch_tab(&first).unwrap();
        assert_eq!(manager.get_next_tab_id(), Some(second.clone()));
        assert_eq!(manager.get_previous_tab_id(), Some(third.clone()));

        manager.switch_tab(&second).unwrap();
        assert_eq!(manager.get_next_tab_id(), Some(third.clone()));
        assert_eq!(manager.get_previous_tab_id(), Some(first.clone()));
    }

    #[test]
    fn test_next_active_after_close() {
        let mut manager = TabManager::new();
        let first = manager.create_tab("https://example.com".to_string());
        let second = manager.create_tab("https://example.org".to_string());

        manager.switch_tab(&second).unwrap();
        assert_eq!(manager.get_next_active_after_close(&second), Some(first.clone()));
        assert_eq!(manager.get_next_active_after_close(&first), None);
    }
}
