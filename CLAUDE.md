# CMU Pets · rules for collaborators and Claude

Shared repo for the CMU Pets (Lost & Found) course work: the *buddy* prototype plus the class build labs. Several classmates push here, so keep it tidy and predictable.

## Layout

```
cmu-pets-prototype/
├── CLAUDE.md        ← this file
├── README.md        ← how to run the prototype
├── index.html       ← the prototype (single file)
├── assets/          ← prototype icons, wordmark, photos
└── lab/             ← class build labs, one folder per lab
```

- Prototype work goes in `index.html` and `assets/`. Lab work goes in `lab/`. Don't add anything else at the root without agreeing it with the group first.
- Don't move, rename or delete someone else's folder or files. Ask the author first.

## Labs (`lab/`)

- **Folder name:** `lab-NN-short-topic-author-name`. Use a two-digit number and lowercase words joined by hyphens, for example `lab-01-ideate-on-a-rule-sara-molarinho`.
- **Each lab folder contains:**
  - `README.md`: opens with `# Lab NN · Title`, then `**Author:** Full Name · **Project:** Project name`.
  - `notes.md`: one line per try, written as idea → what changed → keep or drop.
  - The lab's own files, keeping the names the lab gave them. The HTML playgrounds refer to the Python files by name.
- **When you add a lab:** add a row to the table in `lab/README.md` with the lab, folder, project, author and status.
- Only edit your own lab. To suggest a change to someone else's, leave a note or ask them.

## Prototype

- It's a static site with no build step. Run `python3 -m http.server 5173` at the repo root and open <http://localhost:5173>.
- Keep it in one file, `index.html` (HTML, CSS and vanilla JS), with hash routing. Don't add frameworks or build tools without the group agreeing.
- Follow the *buddy* design system and the CMU Pets Figma file.
- Use demo data only: no real names, phone numbers, emails or addresses.

## Git workflow

- Pull before you start: `git pull`.
- Work on a branch with a short descriptive name, for example `lab-02-jane-doe` or `report-photo-step`.
- Open a pull request to `main` instead of pushing straight to it. Merge once it's ready, then delete the branch.
- Keep commit messages short, saying what changed and why.

## General

- Don't commit system or cache files (`.DS_Store`, `__pycache__/`, `*.pyc`). The `.gitignore` files cover them.
- Never commit secrets, API keys, tokens or personal documents.
- Write file and folder names in lowercase with hyphens, except for files a lab or tool names for you.
- Write in English.
- **Claude:** confirm before deleting, overwriting or moving anything, and before pushing or merging.
