<a id="readme-top"></a>

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]

[🇯🇵 Japanese / 日本語](docs/README.md)

<br />
<div align="center">
  <a href="https://github.com/ninjin-sirisiri/mu">
    <img src="https://github.com/ninjin-sirisiri/my-images/blob/main/mu/mu-logo.png" alt="Logo" width="80" height="80">
  </a>

  <h3 align="center">Mu</h3>

  <p align="center">
    A lightweight, minimalistic, and immersive web browser developed as an antithesis to the "feature-rich and heavy" modern browsers.
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

Mu is a **lightweight, minimalistic, and immersive** web browser designed for users who conduct information gathering and long-form reading on the Web.

It eliminates the "feature bloat" and "heaviness" of traditional browsers, providing an environment where users can focus on content.

### Features
*   **Minimalist Design:** Visual noise is eliminated to the limit.
*   **Lightweight:** Uses the OS standard rendering engine to suppress memory consumption.
*   **Keyboard-centric Operation:** Efficient navigation using the command palette.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



### Built With

* [![Tauri][Tauri]][Tauri-url]
* [![Rust][Rust]][Rust-url]
* [![React][React.js]][React-url]
* [![TypeScript][TypeScript]][TypeScript-url]
* [![Tailwind CSS][Tailwind]][Tailwind-url]
* [![Simple Stack Store][Simple Stack Store]][Simple Stack Store-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- GETTING STARTED -->
## Getting Started

Here are the steps to set up and run Mu in your local environment.

### Prerequisites

*   Node.js & bun
    ```sh
    bun add bun@latest -g
    ```
*   Rust & Cargo
    *   Follow the instructions on the [Rust official website](https://www.rust-lang.org/tools/install) to set up your environment.

### Installation

1.  Clone the repository
    ```sh
    git clone https://github.com/ninjin-sirisiri/mu.git
    ```
2.  Install packages
    ```sh
    bun add
    ```
3.  Start the development server
    ```sh
    bun run tauri dev
    ```

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- USAGE EXAMPLES -->
## Usage

### Command Palette
Press `Ctrl+K` (or `Cmd+K` on macOS) to open the command palette. From here you can enter URLs or search the web. There is no traditional address bar.

### Sidebar and Vertical Tabs
Tabs and settings are consolidated in the sidebar.
*   **Placement:** Can be placed on either the left or right side.
*   **Display Mode:** Choose between always visible or "Auto-hide" which shows only on mouse hover.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- ROADMAP -->
## Roadmap

- [x] Basic browsing features (WebView)
- [x] Command Palette
- [x] Vertical Tabs (Sidebar)
- [x] Sidebar customization (Left/Right placement, Auto-hide)
- [x] Ad blocking feature
- [ ] Mobile support (iOS / Android)

See the [open issues](https://github.com/ninjin-sirisiri/mu/issues) for a full list of proposed features (and known issues).

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- CONTACT -->
## Contact

Project Link: [https://github.com/ninjin-sirisiri/mu](https://github.com/ninjin-sirisiri/mu)

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- ACKNOWLEDGMENTS -->
## Acknowledgments

* [Tauri](https://tauri.app/)
* [React](https://reactjs.org/)
* [Tailwind CSS](https://tailwindcss.com/)
* [Simple Stack Store](https://github.com/simple-stack/store)

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
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/
[TypeScript]: https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white
[TypeScript-url]: https://www.typescriptlang.org/
[Tailwind]: https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white
[Tailwind-url]: https://tailwindcss.com/
[Simple Stack Store]: https://img.shields.io/badge/Simple_Stack_Store-000000?style=for-the-badge&logo=simple-stack-store&logoColor=white
[Simple Stack Store-url]: https://github.com/simple-stack/store