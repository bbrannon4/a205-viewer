# ASHRAE 205 Viewer

A pure static web app for visualizing ASHRAE Standard 205 equipment performance data files.

## Features

- Drop in `.a205` (CBOR binary) or `.a205.json` files — no backend needed
- Auto-detects the RS type from `metadata.schema`
- Flexible 2-D plot: choose X and Y axes, pin other grid dimensions with sliders
- Side-by-side comparison: drop multiple files of the same RS type
- Currently fully implemented: **RS0001** (Chiller)
- Stub views for RS0002–RS0007 (full support coming)

## Development

```bash
cd tools/a205-viewer
npm ci
npm run dev
```

## Deployment

Automatically deploys to GitHub Pages on push to `main` (changes under `tools/a205-viewer/`).
