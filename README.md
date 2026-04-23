# EditionCrafter Glossary Editor

This project is a static, premium web-based editor designed specifically to create, manage, and edit glossaries for [EditionCrafter](https://editioncrafter.org/guide/) projects.

The editor runs entirely in the browser using Vanilla HTML, CSS, and JavaScript. All data is automatically saved to your browser's LocalStorage, meaning you can close the tab and return later without losing your work.

## Features

- **Beautiful, Premium Design**: A modern dark mode interface with glassmorphism effects and smooth micro-animations.
- **Local Storage Auto-save**: Never lose your progress.
- **Drag & Drop Import**: Simply drag a `.json` glossary file into the window to import it, or use the Import button.
- **JSON Export**: Export your glossary to a compliant JSON format ready to be consumed by EditionCrafter.
- **Markdown Support**: Render markdown live while editing the glossary's `Title` and `Citation`.
- **Debounced Search**: Quickly find terms across headwords, alternate spellings, meanings, and parts of speech.
- **Dynamic Meanings**: Add multiple meanings and references to any single term.
- **Sorting**: Toggle between alphabetical sorting and insertion order.

## Usage

1. **Open the App**: Since this is a static webpage without dependencies, you can simply open `index.html` in your web browser. Alternatively, you can host it anywhere (like GitHub Pages).
2. **Edit Metadata**: Fill out the glossary title and citation. These support Markdown.
3. **Add Terms**: Click the `+` button in the sidebar to add a new term. Fill in the relevant fields (`Headword`, `Alternate Spellings`, etc.).
4. **Add Meanings**: For a selected term, click "Add Meaning" to define its parts of speech, definition, and references.
5. **Export**: When finished, click the `Export JSON` button in the top right to download your file.

## JSON Format Specification

This editor generates and consumes JSON files adhering to the following structure:

```json
{
  "title": "[a subheader, written in markdown]",
  "citation": "[information on how to cite the glossary, written in markdown]",
  "entries": {
    "[Term]": {
      "headword": "...",
      "alternateSpellings": "...",
      "meanings": [
        {
          "partOfSpeech": "...",
          "meaning": "...",
          "references": "..."
        }
      ],
      "modernSpelling": "...",
      "antonym": "...",
      "synonym": "...",
      "seeAlso": "..."
    }
  }
}
```

## Setup & Deployment

No build step is required. You can instantly deploy this editor via GitHub Pages:
1. Push this repository to GitHub.
2. Go to **Settings > Pages**.
3. Select the `main` branch and `/ (root)` folder.
4. Your editor will be live and functional immediately!
