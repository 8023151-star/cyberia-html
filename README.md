# Cyberia

Cyberia is a collection of local HTML G4mes. The home page, icons, font, and site controls are included in the folder.

## Download and open

1. Open the [Cyberia GitHub repository](https://github.com/8023151-star/cyberia-html).
2. Click the green **Code** button shown below, then choose **Download ZIP**.

   ![GitHub's green Code button](Assets/Code.png)
3. Extract the ZIP on the Chromebook.
4. Open the extracted folder, then open `index.html` in Chrome.

Keep the `Games` and `Assets` folders beside `index.html`; do not move the HTML file out by itself. Choose **Go to site** on the first screen. Opening the site does not need a local server. Checking for updates needs an internet connection.

**For the repository owner:** upload the complete site to GitHub, including `index.html`, `styles.css`, `script.js`, `version.js`, `Assets`, and `Games`. A ZIP of a repository containing only a version file will not contain the site.

## Updates

The welcome screen's **Check for updates** button reads [`version.js` on GitHub](https://github.com/8023151-star/cyberia-html/blob/main/version.js) and compares it with the version in the downloaded copy. It shows both numbers and whether a newer copy is available. This check does not download or install anything.

When publishing a new copy, change the number in `version.js` to a three-part version such as `0.0.3`, then upload that file with the rest of the site. The downloaded page reads its own `version.js` and compares it with GitHub's copy. The old `version.txt` can be deleted from GitHub after `version.js` has been uploaded.

The `Unbore_Yourself_in_School-main-IGNORE` folder is an unused source archive. It is excluded from Git by `.gitignore` and is not needed in the downloadable site ZIP. You can keep it separately or remove it after you have your own backup.

Some imported G4mes may still use online images or fonts. They can look incomplete without internet even though the home page itself opens offline.
