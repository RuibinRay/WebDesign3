# Racimo

Concept website for a plantain chip brand from Talamanca, Costa Rica. Plain HTML, CSS and JavaScript, no build step.

**The idea:** ripeness is the recipe. One bunch of plantains (a *racimo*) is cut on four different days as it ripens, and each day is a different chip: **Verde** (day 1), **Pintón** (day 5), **Maduro** (day 9), **Miel** (day 12). The site ripens as you scroll.

**Status (2026-11-20):** the site is complete. All 25 pictures and both scroll films were generated on Higgsfield and are in `assets/`. If a picture is ever removed or re-rolled, its slot falls back to a drawing of the right thing on the right colour until the new one exists.

## Run it

```powershell
node tools/serve.mjs 4183
```

Then open http://localhost:4183/. In Claude Code the launch name is `racimo`.

| Page | What it is |
|---|---|
| `index.html` | The site |
| `chip.html?c=verde` (`pinton`, `maduro`, `miel`) | One product page per chip |
| `breakdown.html` | Every design decision, explained |
| `shots.html` | Every prompt, with copy buttons and prices |
| `refs.html` | The drawn pack fronts, saved as reference images |

## What each piece does, before and after generation

| Piece | Now (nothing generated) | With stills | With films |
|---|---|---|---|
| Hero | A drawn bunch that ripens as you scroll | First and last frame crossfade with a slow push-in | The time-lapse film, scrubbed by scroll |
| The four days | Drawn plantain and chips, 3D bags. Stays this way on purpose. | Same | Same |
| Every bag | Real-time 3D, wrapped in the drawn label (the flat drawing shows first, and stays if WebGL is missing) | In the shop cards, pairings and box the photo replaces it; the chip page and the four days keep the 3D bag | Same |
| The kettle | Two drawn stand-ins crossfade, pale to golden | First and last frame crossfade | The film, scrubbed by scroll |
| Every other picture | The right bag, chips, fruit or a line drawing, with a small "image pending" tag | The photo | The photo |

The site only requests files listed in `assets/img/ready.js`, which `higgsfield/optimize.mjs` writes. Nothing ever shows as a broken image.

## Generate the pictures (Higgsfield)

Everything in this table was generated on 2026-11-20 for 98.73 credits, at the prices shown. The original files are in `higgsfield/renders/` and each job is recorded in `higgsfield/manifest.json`. To re-roll a picture, name it with `--force` (see below); the script re-prices live before it spends.

| What | Count | Model | Each | Total |
|---|---|---|---|---|
| Pack fronts (reference images) | 4 | drawn in code | 0 | 0 |
| Food, packs, film frames | 21 | `gpt_image_2_6`, 2k high | 2.00 | 42.00 |
| Places and hands | 4 | `soul_cinematic`, 2k | 0.12 | 0.48 |
| Hero film, 10 s | 1 | `kling4_0`, 1080p | 37.50 | 37.50 |
| Kettle film, 5 s | 1 | `kling4_0`, 1080p | 18.75 | 18.75 |
| **All** | **27 jobs** | | | **≈ 98.7 credits** |

```powershell
node higgsfield/generate.mjs
```

Plan only: lists every job, its price and the balance. Spends nothing.

```powershell
node higgsfield/generate.mjs --go
```

Runs stage 1 (fruit, chips, places, first film frames), stage 2 (every shot with a bag, last film frames), stage 3 (the films), then the optimiser. Name ids or a group to run less: `verde-bag box --go`, `images --go`, `films --go`. Add `--force` to re-roll; the old file is kept as `<id>_v1.png`.

```powershell
npm install
```

Needed once before the optimiser can run (it uses `sharp`). Films also need `ffmpeg`.

**The pack is not generated.** The four bag fronts are drawn in `js/art.js` and saved as `higgsfield/refs/<chip>-pack.png` (already done; `refs.html` → "Save the four references" redoes it). Every prompt that shows a bag passes that file as its reference image, so the label in the photo is the real design with its real lettering. If you change the pack drawing, save the references again before generating.

By hand instead: copy a prompt from `shots.html` into the Higgsfield app, attach the reference it names, save the result as `higgsfield/renders/<id>.png` (films `.mp4`), then run `node higgsfield/optimize.mjs`.

## Where things live

| File | Holds |
|---|---|
| `js/data.js` | The brand as data: colours, the four chips, days, copy, prices, nutrition |
| `js/art.js` | Everything drawn in code: mark, plantain, bunch, chips, bags, wheel, map, stand-ins |
| `js/shots.js` | The look bible, every prompt, the two films |
| `js/home.js` | The four-days scroll screen and the sections built from data |
| `js/chip-page.js` | The product page template |
| `js/film.js` | The scroll-film engine (three tiers) |
| `js/src/bag3d.src.js` | The 3D bag: geometry, lighting, one shared renderer, drag and turn |
| `js/bag3d.js` | The same, bundled with three.js. This is the file the site loads. |
| `js/common.js` | Nav, smooth scroll, page morphs, reveals, the ripeness ruler, the bag |
| `css/racimo.css` | All styles |

To change a colour, a price or a line of copy, edit `js/data.js`. To change how a photo should look, edit the look blocks at the top of `js/shots.js`: every prompt that uses them changes with them.

## Colour

The four peel colours (`verde`, `pinton`, `maduro`, `miel`) were sampled from the backdrops of the generated photos, so a photo, the drawn bag and the section behind them match. They live in two places that must stay in step: `COLOR` in `js/data.js` (drawings, 3D bags, prompts) and `:root` in `css/racimo.css` (the pages). If you change one of them:

1. Change it in both files, and in the backdrop lines of `js/shots.js`.
2. Open `refs.html` and save the four pack references again.
3. Re-roll the photos of that chip, or their backdrops will no longer match.

The rest of the finish is in `css/racimo.css`: the print grain (`body::after`), the toothed seams between sections (`.seam`, with `--seam` naming the colour of the section below), and the pool of light behind the fruit and the bag (`.seq__stage::before`, `.phero::before`). The scroll between two days is mixed in OKLab (`RC_ART.mixOk`).

## The 3D bags

Every bag on the site is drawn by `RC_ART.bag3d(id, mode)`: a flat drawing first, then a real-time 3D bag once `js/bag3d.js` has loaded (it is fetched after the page, only on pages that show a bag). The label on the 3D bag is the drawing from `js/art.js`, so editing the pack there changes the flat bags, the 3D bags and the reference images together.

Every bag can be handled:

| Action | What happens |
|---|---|
| Drag (mouse or finger) | Turns the bag all the way round and tilts it. Let go and it keeps spinning, then slows. Vertical swipes still scroll the page. |
| Pointer nearby | The bag leans toward it. |
| Double-click | Flips the bag over. Only where the bag is not inside a link (chip page, pairings, the box). |
| "Turn the bag over" button, arrow keys, Home, End | Chip page only: turn the bag, show the front, show the back. |

Away from the chip page a bag settles back to its resting pose once the pointer leaves it (on touch, a few seconds after you let go). In the box of four each bag turns on its own. Dragging a bag never follows the link it sits in; a plain click still does.

After editing `js/src/bag3d.src.js`, rebuild the bundle (needs `npm install` once):

```powershell
node tools/build-3d.mjs
```

## Testing notes

Add `?sync` to any URL when testing in a hidden browser tab: it swaps animation frames for timers and turns off smooth scrolling.

## What is invented

Racimo does not exist. The day numbers, prices, weights, cut thicknesses, frying notes, nutrition figures, the use of coconut oil and cacao, and everything said about growers and the box are placeholders. Replace them before publishing. The name was checked with one web search on 2026-11-20 (no plantain chip brand called Racimo was found); that is not a trademark clearance. The map is a sketch.
