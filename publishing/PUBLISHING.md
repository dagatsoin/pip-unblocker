# Publishing Guide — PiP Unblocker

Step-by-step for getting `dist/pip-unblocker-v1.0.0.zip` onto the Chrome Web
Store (and, optionally, Edge Add-ons). Everything in this repo is **prepared but
not submitted** — the steps below are performed by you, in a browser, signed in
to your own developer account.

Companion files:
- **Listing copy + permission justifications:** [`STORE.md`](./STORE.md)
- **Privacy answers + policy text:** [`PRIVACY.md`](./PRIVACY.md)

---

## 0. Build (or rebuild) the package

```bash
# from the repository root
npm test        # expect 28/28 passing
npm run package # writes dist/pip-unblocker-v1.0.0.zip (runtime files only)
```

The ZIP contains exactly: `manifest.json`, `src/` (3 files), and `icons/` (12
PNGs) — 16 files, nothing else. Verify any time with:

```bash
unzip -l dist/pip-unblocker-v1.0.0.zip
```

> Sanity check before uploading: load the **unpacked** extension once
> (`chrome://extensions` → Developer mode → Load unpacked → pick this folder)
> and confirm grey→orange→green works on `fixtures/blocked.html`. The store
> reviews the packaged code, so confirm the build behaves before you submit.

---

## 1. Register a developer account (one-time, $5) — **manual**

1. Go to the **Chrome Web Store Developer Dashboard**:
   <https://chrome.google.com/webstore/devconsole>
2. Sign in with the Google account you want to own the listing.
3. Accept the developer agreement.
4. Pay the **one-time US $5 registration fee** (per account, non-refundable,
   not per-extension; one account can publish multiple items). Have a card
   ready — this is required before you can publish your first item.

You only do this once per account. If this account already paid, skip to step 2.

---

## 2. Create a new item and upload the ZIP — **manual**

1. In the dashboard, click **Items** → **Add new item** (or **+ New item**).
2. When prompted, **upload `dist/pip-unblocker-v1.0.0.zip`**. Drag it in or
   browse to it. The dashboard reads `manifest.json` from the archive root and
   creates the draft item ("PiP Unblocker", version 1.0.0).
3. If it flags anything at upload, the usual causes are: a stray dev file in the
   ZIP (shouldn't happen — the packager allowlists only runtime files), or a
   manifest field issue. Fix locally, re-run `npm run package`, re-upload.

---

## 3. Fill in the Store listing — **manual**

Open the **Store listing** tab and fill it from [`STORE.md`](./STORE.md):

- **Description** (the long one) → paste the "Detailed description".
- **Category** → **Productivity** (or Tools).
- **Language** → English (United States).
- **Icon** → the store uses the 128×128 from the package automatically; no
  separate upload needed.
- **Screenshots** → upload **at least one** at **1280×800** (preferred) or
  **640×400**, max five. Capture these yourself (see the "Screenshot plan" in
  `STORE.md`): grey on a normal page, orange on a blocking site, green after the
  click, and optionally the floating PiP window. **This is a manual capture step
  — the repo cannot generate screenshots.**
- **Small promo tile / marquee** → optional; skip for v1.

---

## 4. Fill in Privacy practices — **manual**

Open the **Privacy practices** tab and use [`PRIVACY.md`](./PRIVACY.md):

- **Single purpose** → paste the single-purpose statement from `STORE.md`.
- **Permission justifications** → paste the per-permission text from `STORE.md`
  for host access (`<all_urls>`), `tabs`, `webNavigation`, and the
  `web_accessible_resources` / remote-code notes. A reviewer reads these.
- **Data usage** → set **every** data type to **No / not collected** and check
  the three certification boxes (all true for this extension). See the exact
  checklist in `PRIVACY.md`.
- **Privacy policy URL** → usually not required for a no-data extension, but if
  the form demands one, host the "Ready-to-host privacy policy text" from
  `PRIVACY.md` at a public URL and paste it here.

---

## 5. Distribution and visibility — **manual**

On the **Distribution** (a.k.a. visibility) tab:

- **Visibility** → choose **Public** (anyone can find it) or **Unlisted** (only
  people with the link). Unlisted is a good way to soft-launch and test the live
  listing before going Public.
- **Regions** → leave **all regions** unless you have a reason to restrict.
- **Pricing** → Free.

---

## 6. Submit for review — **manual**

1. Resolve any remaining red "required" items the dashboard flags (description,
   ≥1 screenshot, category, privacy answers are the usual ones).
2. Click **Submit for review**.
3. Review typically takes from a few hours to a few business days. You'll get an
   email on approval or rejection. If rejected, the email cites the policy item;
   fix it and resubmit.

> **This guide does not submit anything for you.** Steps 1–6 are all performed
> manually by you in the dashboard.

---

## Updating later (for reference)

To ship a new version: bump `version` in `manifest.json`, run `npm run package`
(the ZIP name tracks the manifest version automatically), then in the dashboard
open the item → **Package** → **Upload new package** → resubmit. The store
requires the version to be strictly higher than the published one.

---

## Edge Add-ons (optional, free) — same ZIP

Microsoft Edge is Chromium-based and accepts the **same**
`dist/pip-unblocker-v1.0.0.zip`:

1. Go to the **Microsoft Partner Center** Edge program:
   <https://partner.microsoft.com/dashboard/microsoftedge/>
2. Registration is **free** (no $5 fee).
3. **Create new extension** → upload the same ZIP → fill in a listing (you can
   reuse the description, screenshots, and privacy answers from this kit) →
   submit. Edge more often asks for a privacy-policy URL; use the text in
   `PRIVACY.md`.

## Firefox / AMO — out of scope for v1

Firefox (addons.mozilla.org) uses a different manifest dialect and a different
PiP model, so the current package is **not** drop-in compatible. Supporting
Firefox would require manifest changes (e.g. `browser_specific_settings`, and
revisiting the MV3 background/service-worker differences) and is intentionally
out of scope here.
