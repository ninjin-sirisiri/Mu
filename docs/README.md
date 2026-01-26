<a id="readme-top"></a>

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]



<br />
<div align="center">
  <a href="https://github.com/ninjin-sirisiri/mu">
    <img src="https://github.com/ninjin-sirisiri/my-images/blob/main/mu/mu-logo.png" alt="Logo" width="80" height="80">
  </a>

  <h3 align="center">Mu</h3>

  <p align="center">
    「多機能で重い」現代のブラウザへのアンチテーゼとして開発された、軽量・ミニマル・没入型のWebブラウザ。
    <br />
    <a href="https://github.com/ninjin-sirisiri/mu"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://github.com/ninjin-sirisiri/mu">View Demo</a>
    &middot;
    <a href="https://github.com/ninjin-sirisiri/mu/issues/new?labels=bug&template=bug-report---.md">Report Bug</a>
    &middot;
    <a href="https://github.com/ninjin-sirisiri/mu/issues/new?labels=enhancement&template=feature-request---.md">Request Feature</a>
  </p>
</div>



<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project

[![Product Name Screen Shot][product-screenshot]](https://github.com/ninjin-sirisiri/my-images/blob/main/mu/mu-screenshot.png)

Muは、Web上の情報収集や長文読解を行うユーザーのために設計された、**軽量・ミニマル・没入型**のWebブラウザです。

従来のブラウザの「多機能さ」や「重さ」を排除し、ユーザーがコンテンツに集中できる環境を提供します。

### 特徴
*   **ミニマルなデザイン:** 視覚的なノイズを極限まで排除。
*   **軽量:** OS標準のレンダリングエンジンを使用し、メモリ消費を抑制。
*   **キーボード中心の操作:** コマンドパレットを使用した効率的なナビゲーション。

<p align="right">(<a href="#readme-top">back to top</a>)</p>



### Built With

* [![Tauri][Tauri]][Tauri-url]
* [![Rust][Rust]][Rust-url]
* [![Solid][Solid.js]][Solid-url]
* [![TypeScript][TypeScript]][TypeScript-url]
* [![Tailwind CSS][Tailwind]][Tailwind-url]
* [![Simple Stack Store][Simple Stack Store]][Simple Stack Store-url]s

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- GETTING STARTED -->
## Getting Started

ローカル環境でMuをセットアップして実行する手順です。

### Prerequisites

*   Node.js & bun
    ```sh
    bun add bun@latest -g
    ```
*   Rust & Cargo
    *   [Rust公式サイト](https://www.rust-lang.org/tools/install)の手順に従って環境を構築してください。

### Installation

1.  リポジトリをクローン
    ```sh
    git clone https://github.com/ninjin-sirisiri/mu.git
    ```
2.  パッケージをインストール
    ```sh
    bun add
    ```
3.  開発サーバーを起動
    ```sh
    bun run tauri dev
    ```

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- USAGE EXAMPLES -->
## Usage

### コマンドパレット
`Ctrl+K` (macOSでは `Cmd+K`) を押すとコマンドパレットが開きます。ここからURLの入力やWeb検索が行えます。従来のアドレスバーはありません。

### サイドバーと垂直タブ
タブや設定はサイドバーに集約されています。
*   **配置:** 左側・右側の好きな方に配置可能。
*   **表示モード:** 常時表示、またはマウスオーバー時のみ表示する「自動隠蔽」を選択できます。

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- ROADMAP -->
## Roadmap

- [ ] 基本的なブラウジング機能 (WebView)
- [ ] コマンドパレット
- [ ] 垂直タブ (サイドバー)
- [ ] サイドバーのカスタマイズ (左右配置、自動隠蔽)
- [ ] 広告ブロック機能
- [ ] モバイル対応 (iOS / Android)

See the [open issues](https://github.com/ninjin-sirisiri/mu/issues) for a full list of proposed features (and known issues).

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- CONTRIBUTING -->
## Contributing

貢献こそが、オープンソースコミュニティを学び、刺激を受け、創造する素晴らしい場所にしているのです。皆様のあらゆる貢献に**心より感謝**申し上げます。

改善案がございましたら、リポジトリをフォークしプルリクエストを作成してください。「enhancement」タグ付きでイシューを開くことも可能です。
プロジェクトへのスターも忘れずに！改めて感謝申し上げます。

1. プロジェクトをフォークする
2. 機能ブランチを作成する（`git checkout -b feature/AmazingFeature`）
3. 変更をコミットする（`git commit -m 'Add some AmazingFeature'`）
4. ブランチにプッシュする（`git push origin feature/AmazingFeature`）
5. プルリクエストを開く

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- LICENSE -->
## License

MITライセンスのもとで配布されています。詳細は `LICENSE` ファイルを参照してください。

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- CONTACT -->
## Contact

Muのリポジトリは [GitHub](https://github.com/ninjin-sirisiri/mu) で公開されています。

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- ACKNOWLEDGMENTS -->
## Acknowledgments

* [Tauri](https://tauri.app/)
* [Solid](https://Solidjs.org/)
* [Tailwind CSS](https://tailwindcss.com/)
* [Simple Stack Store](https://github.com/simple-stack/store)
* [Best-README-Template](https://github.com/othneildrew/Best-README-Template)

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- MARKDOWN LINKS & IMAGES -->
[contributors-shield]: https://img.shields.io/github/contributors/ninjin-sirisiri/mu.svg?style=for-the-badge
[contributors-url]: https://github.com/ninjin-sirisiri/mu/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/ninjin-sirisiri/mu.svg?style=for-the-badge
[forks-url]: https://github.com/ninjin-sirisiri/mu/network/members
[stars-shield]: https://img.shields.io/github/stars/ninjin-sirisiri/mu.svg?style=for-the-badge
[stars-url]: https://github.com/ninjin-sirisiri/mu/stargazers
[issues-shield]: https://img.shields.io/github/issues/ninjin-sirisiri/mu.svg?style=for-the-badge
[issues-url]: https://github.com/ninjin-sirisiri/mu/issues
[license-shield]: https://img.shields.io/github/license/ninjin-sirisiri/mu.svg?style=for-the-badge
[license-url]: https://github.com/ninjin-sirisiri/mu/blob/master/LICENSE
[product-screenshot]: https://github.com/ninjin-sirisiri/my-images/blob/main/mu/mu-screenshot.png
[Tauri]: https://img.shields.io/badge/Tauri-FFC131?style=for-the-badge&logo=tauri&logoColor=black
[Tauri-url]: https://tauri.app/
[Rust]: https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white
[Rust-url]: https://www.rust-lang.org/
[Solid.js]: https://img.shields.io/badge/Solid-20232A?style=for-the-badge&logo=Solid&logoColor=61DAFB
[Solid-url]: https://Solidjs.org/
[TypeScript]: https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white
[TypeScript-url]: https://www.typescriptlang.org/
[Tailwind]: https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white
[Tailwind-url]: https://tailwindcss.com/
[Simple Stack Store]: https://img.shields.io/badge/Simple_Stack_Store-000000?style=for-the-badge&logo=simple-stack-store&logoColor=white
[Simple Stack Store-url]: https://github.com/simple-stack/store