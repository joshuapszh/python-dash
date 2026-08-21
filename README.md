# Python Dash

Python Dash is a bright, five-gate arcade coding mission created for Heritage Academy.
It introduces Primary 5 and Primary 6 students to simple Python code before
they enter Secondary 1.

## Play online

- GitHub Pages: https://joshuapszh.github.io/python-dash/
- Backup site: https://heritage-python-dash.joshuapszh.chatgpt.site/

The game works in current versions of Safari, Chrome, Edge, and Firefox on Mac
and Windows. Music begins after the first player interaction because browsers
do not allow websites to start sound automatically.

## Exhibition flow

1. A student helper opens **Code Briefing** and explains the four large code
   examples.
2. The player chooses a safe codename and completes an untimed answer-and-movement practice.
3. The player clears five adaptive code gates and a guaranteed Python Boss using the keyboard or on-screen lane controls.
4. Scores are saved only in that computer's browser.

## Development

```bash
npm install
npm run dev
npm run build
npm run build:github-pages
```

The main build targets Sites. The GitHub Pages build is a separate client-only
build with the `/python-dash/` base path and outputs to `docs/`.
