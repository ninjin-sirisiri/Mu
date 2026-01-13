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

        let tab = Tab {
            id: id.clone(),
            title: "新しいタブ".to_string(),
            url,
            is_active: false,
            favicon: None,
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
