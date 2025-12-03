/// Normalizes a URL by adding https:// prefix if needed
pub fn normalize_url(url: &str) -> String {
  if url.starts_with("http://") || url.starts_with("https://") {
    url.to_string()
  } else {
    format!("https://{}", url)
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_normalize_url_with_https() {
    assert_eq!(normalize_url("https://example.com"), "https://example.com");
  }

  #[test]
  fn test_normalize_url_with_http() {
    assert_eq!(normalize_url("http://example.com"), "http://example.com");
  }

  #[test]
  fn test_normalize_url_without_protocol() {
    assert_eq!(normalize_url("example.com"), "https://example.com");
  }

  #[test]
  fn test_normalize_url_with_path() {
    assert_eq!(
      normalize_url("example.com/path/to/page"),
      "https://example.com/path/to/page"
    );
  }

  #[test]
  fn test_normalize_url_with_query_params() {
    assert_eq!(
      normalize_url("example.com?q=test"),
      "https://example.com?q=test"
    );
  }
}
