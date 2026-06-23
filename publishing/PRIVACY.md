# Privacy — PiP Unblocker

**Plain statement:** PiP Unblocker collects, stores, and transmits **no user
data**. It makes **no network requests**, contains **no analytics or
telemetry**, and includes **no remote code**. Everything it does happens locally
in your browser.

This is verifiable from the source: the extension has no `fetch`/`XMLHttpRequest`
to any server, no `chrome.storage` use, no third-party SDKs, and no remotely
hosted scripts. Its only inputs are a page's `<video>` Picture-in-Picture
attributes/properties; its only outputs are removing those attributes on the
page when you click, and setting the toolbar icon color.

---

## What the extension accesses (and why it's not "collection")

| Thing it touches | Why | Leaves your device? |
| --- | --- | --- |
| A page's `<video>` `disablepictureinpicture` attribute / `disablePictureInPicture` property | To detect a PiP block and remove it on click | No |
| A per-tab icon color (grey / orange / green), held in memory only | To show the current state on the toolbar | No (in-memory; discarded on navigation, reload, or tab close) |
| Tab and navigation events (`tabs`, `webNavigation`) | To target the right frame and keep the icon correct across page/SPA navigations | No |

No browsing history, page content, form input, cookies, credentials, or personal
information is read, stored, or sent anywhere. There is no server to send it to.

---

## Chrome Web Store "Data usage" declarations to set

In the dashboard, under **Privacy practices → Data usage**, set every data-type
toggle to **No / not collected**, then check the three certification boxes.
Expected answers:

**"Does this item collect or use any of the following user data?"** — set **all
to NO**:

- [ ] Personally identifiable information — **No**
- [ ] Health information — **No**
- [ ] Financial and payment information — **No**
- [ ] Authentication information — **No**
- [ ] Personal communications — **No**
- [ ] Location — **No**
- [ ] Web history — **No**
- [ ] User activity (clicks, mouse position, keystroke logging, etc.) — **No**
- [ ] Website content (text, images, audio/video, hyperlinks) — **No**

> Note on "Website content": the extension does read one specific video
> *attribute* to do its job, but it does not **collect** website content — nothing
> is retained or transmitted. The "collect/use" question is about data leaving or
> being gathered; answer **No**. (If you prefer to be maximally conservative you
> may discuss this nuance with the reviewer, but for a no-network extension the
> standard, correct answer here is No.)

**Certifications — check all three (they are true for this extension):**

- [x] I do not sell or transfer user data to third parties, outside of the
      approved use cases.
- [x] I do not use or transfer user data for purposes that are unrelated to my
      item's single purpose.
- [x] I do not use or transfer user data to determine creditworthiness or for
      lending purposes.

---

## Privacy policy URL

For an extension that collects **no** data, the in-dashboard data-usage
disclosure above is generally sufficient and a separate hosted privacy policy is
typically not required. However, the store sometimes requests a privacy-policy
URL depending on declared permissions. If a URL is required, host the text below
at a public URL (e.g. a GitHub Pages page, a Gist, or your site) and paste that
URL into the **Privacy policy** field.

Edge Add-ons more commonly asks for a privacy-policy URL; the same text works.

---

## Ready-to-host privacy policy text

> ### PiP Unblocker — Privacy Policy
>
> _Last updated: 2026-06-23_
>
> PiP Unblocker ("the extension") is a browser extension that re-enables your
> browser's built-in Picture-in-Picture feature on web pages that suppress it.
>
> **Data collection.** The extension does not collect, store, or share any
> personal information or user data. It does not track your browsing, it does not
> use cookies, and it does not contain analytics or advertising.
>
> **Network activity.** The extension makes no network requests. All processing
> happens locally within your browser.
>
> **On-page access.** To do its job, the extension reads whether a page's video
> elements have Picture-in-Picture disabled and, when you click the toolbar icon,
> removes that restriction on the current page. This information is used only in
> the moment, on your device, and is never recorded or transmitted.
>
> **Permissions.** The extension requests access to web pages and to tab and
> navigation events solely to detect and remove Picture-in-Picture blocking and
> to display the correct toolbar icon. These permissions are not used to gather
> data.
>
> **Remote code.** The extension contains no remotely hosted code and loads
> nothing from external servers.
>
> **Changes.** Any future change to these practices will be reflected in an
> updated policy published with the extension.
>
> **Contact.** Questions: <your-contact-email@example.com>
