# Hunger Warriors website

The website for Hunger Warriors (#FoodForAll), a volunteer-run non-profit in Kolkata. It's a static site with no build step.

```
index.html          main page
gallery.html        gallery page (highlights + one album per drive)
content/site.json   ALL text, numbers, dates and photos: edit this
css/style.css       styling (brand colours at the top)
js/main.js          builds both pages from site.json
assets/img/         photos, named after what they show
```

## Editing content

Everything is in **`content/site.json`**. Edit it, save, and refresh the page.

- Wrap a word in `*asterisks*` inside a heading to make it orange and italic.
- Dates use the format `YYYY-MM-DD`.
- **Upcoming drives** (`upcoming.drives`): add an entry with `"type": "sunday"` or `"type": "relief"`. Entries disappear automatically once the date has passed.
- **Legacy / past drives** (`pastDrives.drives`): add each finished drive with its photos. The first photo is the cover. Each drive also shows up automatically as an album on the gallery page.
- **Gallery highlights** (`gallery.photos`): the hand-picked photos at the top of the gallery page.
- **Donation calculator** (`donate.calculator.impacts`): `costPer` is how many rupees provide one of that item. An item only appears once the amount covers at least one.
- **Social links**: fill in `contact.instagram`, `facebook` or `youtube` to show that icon. Left empty, the icon is hidden.
- **Bank transfer**: replace `"bank": null` with
  `{ "accountName": "...", "accountNumber": "...", "ifsc": "...", "bank": "..." }`.
- **Tax / registration line**: fill in `donate.taxNote`.

If the page shows a red "Couldn't load content/site.json" bar after an edit, there's a typo in the JSON, usually a missing comma or quote. Pasting the file into https://jsonlint.com shows exactly where.

## Photos

Resize a photo to about 1400px on the long side, put it in `assets/img/` with a descriptive name, and reference it from `site.json`.

## Preview locally

The pages load their content from `site.json`, so they have to be served by a web server. Double-clicking `index.html` won't work.

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

## Going live

Drag this folder onto https://app.netlify.com/drop, or deploy it with GitHub Pages, Vercel or Cloudflare Pages. No build command is needed.
