# AniList Rating Extension

A Chromium extension that adds **custom rating dimensions** (e.g. *Cohesion*, *Impact*, etc.) to your AniList anime list. It lets you track more than just the default composite score — you can create your own categories and enter values (numbers, text, emojis). They’ll be saved locally in your browser.

## ✨ Features
- Add any number of custom rating dimensions.
- Enter free‑form values (numbers, text, symbols).
- Data is stored in `chrome.storage.local` and persists across sessions.
- Works seamlessly with AniList’s single‑page app navigation.
- Headers and row inputs align with AniList’s native table layout.
  
## 🚀 Installation
1. Clone or download this repository.
2. Open your browser's extensions menu (`chrome://extensions/`, `brave://extensions/`, etc.).
4. Enable **Developer mode** (toggle in the top right).
5. Click **Load unpacked** and select the project folder.
6. The extension will now be active on [AniList](https://anilist.co).

## 🖊️ Usage
- Open your AniList anime list and select the extension.
- **Adding dimensions:** Enter the name of a new dimension and select `Add`.
- **Removing dimensions:** Click `Remove` next to a saved dimension.
- **Enter ratings** by typing in input fields in the new columns. Values are saved automatically and restored on reload.
- You can `Back Up Data` if you wish to transfer it to another device or browser. Data is stored locally in your browser; it does not sync across devices.
- Select `Restore Data` to import your saved data.
