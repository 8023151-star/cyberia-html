# Cyberia

Cyberia is a collection of local HTML G4mes. The home page, icons, font, and site controls are included in the folder.

## Download and open

1. Open the [Cyberia GitHub repository](https://github.com/8023151-star/cyberia-html).
2. Click the green **Code** button shown below, then choose **Download ZIP**.

   ![GitHub's green Code button](Assets/Code.png)
3. Extract the ZIP on the Chromebook.
4. Open the extracted folder, then open `index.html` in Chrome.

Keep the `Games` and `Assets` folders beside `index.html`; do not move the HTML file out by itself. Choose **Go to site** on the first screen. Opening the site does not need a local server. Checking for updates needs an internet connection.

**For the repository owner:** upload the complete site to GitHub, including `index.html`, `styles.css`, `script.js`, `version.js`, `version.txt`, `Assets`, and `Games`. A ZIP of a repository containing only `version.txt` will not contain the site.

## Updates

The welcome screen's **Check for updates** button reads [`version.txt` on GitHub](https://github.com/8023151-star/cyberia-html/blob/main/version.txt) and compares it with the version built into the downloaded copy. It shows both numbers and whether a newer copy is available. This check does not download or install anything.

When publishing a new copy, edit only `version.txt` and use a three-part number such as `0.0.3`. Run `python3 sync-version.py` in this folder before uploading. That copies the number into `version.js` for offline visitors; upload both files with the site. The local page reads the generated script because Chrome restricts local text-file requests from pages opened with `file://`.

Some imported G4mes may still use online images or fonts. They can look incomplete without internet even though the home page itself opens offline.
