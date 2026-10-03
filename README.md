# Hunger Warriors website

The website for Hunger Warriors (#FoodForAll), a volunteer-run non-profit in Kolkata. It's a static site with no build step.

```
index.html          main page
gallery.html        gallery page (highlights + one album per drive)
legal.html          privacy, terms, donations & refunds, photo consent
content/site.json   ALL text, numbers, dates and photos: edit this
css/style.css       styling (brand colours at the top)
js/main.js          builds both pages from site.json
assets/
  logo-mark.png, favicon.png, apple-touch-icon.png, upi-qr-code.jpg, west-bengal.geojson (map outline)
  img/general/                         photos not tied to one drive
  img/drives/sunday/YYYY-MM-DD-place/  one folder per Sunday drive
  img/drives/relief/YYYY-MM-DD-place/  one folder per relief drive
```

## Editing content

Everything is in **`content/site.json`**. The parts you'll edit most (upcoming drives, past drives, gallery) are at the top. Each list has a `_template` block to copy. Keys starting with `_` are notes and templates, and the site ignores them.

### Upcoming drives
- Add each planned Sunday drive to `upcoming.sundayDrives` and each relief drive to `upcoming.reliefDrives` (copy the `_template`).
- Past dates disappear on their own.
- When nothing is listed, the section shows a "Stay tuned" card instead (`upcoming.stayTuned`).
- A drive within the next 7 days also pops up as a reminder on the home page (`upcoming.reminder.daysBefore`). Once a visitor closes it, it stays closed for them.

### Adding a finished drive (the "Our legacy" section)
1. Create a folder: `assets/img/drives/sunday/2026-10-04-sealdah/` (or `drives/relief/...`).
2. Put the photos in it, resized to about 1400px on the long side.
3. Copy `_sundayTemplate` (or `_reliefTemplate`) into `pastDrives.sundayDrives` (or `reliefDrives`), set `photoFolder` to the folder and list each photo `file` with a short description. The first photo is the cover.

No photos? Leave out `photoFolder` and `photos`; the drive still appears in Our legacy. Don't know the exact date? Put a best guess in `date` (for ordering) and add `"dateLabel": "2021"` to show instead.

The drive also shows up automatically as an album on the gallery page.

### Other things
- **Gallery highlights** (`gallery.photos`): the hand-picked photos at the top of the gallery page (full paths).
- **Map dots** (`reach.places`): `type` is `base`, `sunday` or `relief`. `gallery` is the drive's photo folder name (e.g. `2026-09-27-sskm-hospital`), and clicking the dot opens that album on the gallery page. Get lat/lng by right-clicking the spot in Google Maps.
- **Our story photos** (`about.images`): a slider. The first is the founders' photo; visitors use the arrows or dots to see the rest. Add a `caption` to the first once it's the real photo.
- **Policies** (`legal`): the privacy policy, terms, donation & refund policy and photo consent shown on `legal.html` and linked in the footer. Update `legal.updated` whenever you change them.
- **Donation calculator** (`donate.calculator.impacts`): `costPer` is the rupees needed for one of that item.
- **Bank transfer** (`donate.bank`): replace the placeholder values with the real beneficiary name, account number, IFSC code and bank name & branch, then set `"placeholder": false`. While it's `true`, the details show greyed out with a "being finalised" note and no copy buttons.
- **Monthly membership** (`donate.membership.autopayLink`): paste your PhonePe AutoPay link. While it's empty, the button opens WhatsApp.
- **Social links**: fill in `contact.instagram`, `facebook` or `youtube` to show that icon.
- Wrap a word in `*asterisks*` inside a heading to make it orange and italic. Dates are `YYYY-MM-DD`.

If the page shows a red "Couldn't load content/site.json" bar after an edit, there's a typo in the JSON, usually a missing comma or quote. Pasting the file into https://jsonlint.com shows exactly where.

## Preview locally

The pages load their content from `site.json`, so they have to be served by a web server. Double-clicking `index.html` won't work.

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

## Going live

Drag this folder onto https://app.netlify.com/drop, or deploy it with GitHub Pages, Vercel or Cloudflare Pages. No build command is needed.
