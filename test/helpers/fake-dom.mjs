/**
 * Minimal duck-typed DOM doubles for unit-testing the pure PiP logic
 * without a jsdom dependency. They mimic only the surface the pure
 * functions in src/lib/pip-core.js actually touch:
 *   - on a <video>: hasAttribute / removeAttribute / the
 *     `disablePictureInPicture` reflected property, and tagName.
 *   - on a root: querySelectorAll('video') and (optionally) shadow roots.
 *
 * These are intentionally tiny and dependency-free.
 */

export class FakeVideo {
  /**
   * @param {object} [opts]
   * @param {boolean} [opts.attr]  whether the `disablepictureinpicture` content attribute is present
   * @param {boolean} [opts.prop]  the value of the `disablePictureInPicture` DOM property
   */
  constructor({ attr = false, prop = undefined } = {}) {
    this.tagName = "VIDEO";
    this._attrs = new Map();
    if (attr) this._attrs.set("disablepictureinpicture", "");
    // The real DOM property reflects the attribute when no script overrides it.
    // Tests can force a specific property value independent of the attribute.
    this.disablePictureInPicture = prop === undefined ? attr : prop;
  }

  hasAttribute(name) {
    return this._attrs.has(name);
  }

  getAttribute(name) {
    return this._attrs.has(name) ? this._attrs.get(name) : null;
  }

  setAttribute(name, value = "") {
    this._attrs.set(name, String(value));
  }

  removeAttribute(name) {
    this._attrs.delete(name);
  }
}

/**
 * A container that returns a fixed list of videos from querySelectorAll.
 * Supports a flat list plus an optional set of attached shadow roots
 * (each itself a FakeRoot) to exercise reachable-shadow traversal.
 */
export class FakeRoot {
  /**
   * @param {FakeVideo[]} videos    videos directly queryable from this root
   * @param {FakeElement[]} [hosts] elements hosting open shadow roots
   */
  constructor(videos = [], hosts = []) {
    this._videos = videos;
    this._hosts = hosts;
  }

  querySelectorAll(selector) {
    if (selector === "video") return this._videos.slice();
    if (selector === "*") return this._hosts.slice();
    return [];
  }
}

/** An element that may host an open shadow root (for shadow traversal tests). */
export class FakeElement {
  constructor(shadowRoot = null) {
    this.shadowRoot = shadowRoot;
  }
}
