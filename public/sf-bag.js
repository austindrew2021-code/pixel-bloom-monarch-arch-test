window.__sfBag = function (b64) {
  try {
    var bin = atob(b64);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    var raw = JSON.parse(new TextDecoder("utf-8").decode(bytes));
    var items = Array.isArray(raw) ? raw : raw.items || [];
    if (!items.length) {
      try {
        items = JSON.parse(get("sf-bag-items", "[]"));
      } catch (e) {
        items = [];
      }
    }
    if (!items.length) return;
    window.__sfBagItems = items;
    set("sf-bag-items", JSON.stringify(items));
    if (raw && get("sf-bag-asked", "") !== "1") {
      set("sf-bag-asked", "1");
      set("sf-bag-min", "1");
    }
    if (raw && raw.handsOff) {
      set("sf-bag-auto", "1");
      set("sf-bag-min", "1");
    }
    ensureStyle();
    paint();
    watch();
    maybeFill();
  } catch (e) {}

  function store() {
    try {
      return window.sessionStorage;
    } catch (e) {
      return null;
    }
  }
  function get(k, d) {
    var s = store();
    if (!s) return d;
    var v = s.getItem(k);
    return v == null ? d : v;
  }
  function set(k, v) {
    var s = store();
    if (s) s.setItem(k, v);
  }
  function doneSet() {
    try {
      return new Set(JSON.parse(get("sf-bag-done", "[]")));
    } catch (e) {
      return new Set();
    }
  }
  function saveDone(d) {
    set("sf-bag-done", JSON.stringify(Array.from(d)));
  }
  function skipSet() {
    try {
      return new Set(JSON.parse(get("sf-bag-skip", "[]")));
    } catch (e) {
      return new Set();
    }
  }
  function saveSkip(d) {
    set("sf-bag-skip", JSON.stringify(Array.from(d)));
  }
  function keyOf(it, i) {
    return String(it.name || it.query || i);
  }
  function host() {
    return (location.hostname || "").toLowerCase();
  }
  function cleanQuery(s) {
    return String(s || "")
      .replace(/\b(no name|compliments|president'?s choice|pc organics|pc blue menu|great value|selection|lactantia|neilson|kraft)\b/gi, " ")
      .replace(/\b(fresh|dried|chopped|minced|diced|grated|crushed|peeled|optional|large|small|medium|extra|virgin)\b/gi, " ")
      .replace(/\b(cloves?|bunches?|stalks?|sprigs?|pinch|dash|to taste)\b/gi, " ")
      .replace(/\b\d+([.,]\d+)?\s*(g|kg|ml|l|oz|lb|ct|pk|pack|count)?\b/gi, " ")
      .replace(/[^a-z0-9 ]+/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  function searchUrl(it) {
    var q = encodeURIComponent(searchQuery(it) || it.name || it.query || "");
    var h = host();
    var path = location.pathname || "";
    var slug = (path.match(/\/store\/([^/]+)/) || [])[1];
    if (h.indexOf("walmart") >= 0) return "https://www.walmart.ca/en/search?q=" + q;
    if (h.indexOf("voila") >= 0 || h.indexOf("sobeys") >= 0) return "https://www.voila.ca/search?q=" + q;
    if (h.indexOf("instacart") >= 0) return "https://www.instacart.ca/store/" + (slug || "co-op-food") + "/s?k=" + q;
    return "/en/search?search-bar=" + q;
  }
  function ping(title, body) {
    try {
      if (window.SpoonfulBag && SpoonfulBag.notify) SpoonfulBag.notify(String(title || ""), String(body || ""));
    } catch (e) {}
  }
  function pingNeed(why) {
    try {
      if (window.SpoonfulBag && SpoonfulBag.needYou) SpoonfulBag.needYou(String(why || ""));
    } catch (e) {}
    ping("Spoonful needs you", why);
  }
  function pingFill(packed, total) {
    try {
      if (window.SpoonfulBag && SpoonfulBag.filling) SpoonfulBag.filling(packed, total);
    } catch (e) {}
  }
  function aisleReady() {
    if (wallKind()) return false;
    if (findAnyAdd()) return true;
    if (document.querySelector("[data-testid*='item' i], [data-product-id], [data-item-id], article")) return true;
    var t = pageText();
    return t.length > 400 && /add to (cart|bag)|shop|aisle|produce|dairy|search/.test(t);
  }
  function instacartSlug() {
    return (location.pathname.match(/\/store\/([^/]+)/) || [])[1] || "co-op-food";
  }
  function walkItems(node, out) {
    if (!node) return;
    if (Array.isArray(node)) {
      node.forEach(function (x) {
        walkItems(x, out);
      });
      return;
    }
    if (typeof node !== "object") return;
    var id = node.id || node.legacy_id || node.product_id || node.item_id || node.productId;
    var name = node.name || node.title || node.display_name;
    if (id && name) out.push({ id: String(id), name: String(name), price: parsePrice(JSON.stringify(node.pricing || node.price || "")) });
    for (var k in node) {
      if (Object.prototype.hasOwnProperty.call(node, k) && k !== "tracking" && k !== "log") walkItems(node[k], out);
    }
  }
  function pickApiItem(items, query) {
    var best = null;
    var bestPrice = 1e9;
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (!relevant(it.name, query)) continue;
      var score = it.price == null ? 400 : it.price;
      if (score < bestPrice) {
        bestPrice = score;
        best = it;
      }
    }
    return best;
  }
  function instacartCart(cb) {
    var cached = get("sf-ic-cart", "");
    if (cached) {
      cb(cached);
      return;
    }
    fetch("/v3/carts", { credentials: "include", headers: { Accept: "application/json" } })
      .then(function (r) {
        return r.ok ? r.json() : {};
      })
      .then(function (j) {
        var id = j.id || (j.cart && j.cart.id) || (j.carts && j.carts[0] && j.carts[0].id) || "";
        if (id) set("sf-ic-cart", String(id));
        cb(String(id || ""));
      })
      .catch(function () {
        cb("");
      });
  }
  function addInstacart(item, qty, done, fail) {
    instacartCart(function (cartId) {
      if (!cartId) {
        fail();
        return;
      }
      var body = JSON.stringify({ items: [{ item_id: item.id, quantity: Math.max(1, qty || 1) }] });
      function send(method) {
        return fetch("/v3/carts/" + cartId + "/update_items", {
          method: method,
          credentials: "include",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: body,
        });
      }
      send("PUT")
        .then(function (r) {
          if (r.ok) return r;
          return send("POST");
        })
        .then(function (r) {
          if (r && r.ok) done();
          else fail();
        })
        .catch(fail);
    });
  }
  function tryApiAdd(it, idx, done, fail) {
    var h = host();
    var query = searchQuery(it);
    var qty = Math.max(1, Number(it && it.qty) || 1);
    if (h.indexOf("instacart") >= 0) {
      var slug = instacartSlug();
      fetch("/v3/containers/" + slug + "/search_v3/" + encodeURIComponent(query) + "?page=1", {
        credentials: "include",
        headers: { Accept: "application/json" },
      })
        .then(function (r) {
          return r.ok ? r.json() : Promise.reject();
        })
        .then(function (json) {
          var found = [];
          walkItems(json, found);
          var best = pickApiItem(found, query);
          if (!best) {
            fail();
            return;
          }
          addInstacart(best, qty, done, fail);
        })
        .catch(fail);
      return;
    }
    if (h.indexOf("voila") >= 0 || h.indexOf("sobeys") >= 0) {
      fetch("/webshop/api/v1/search?q=" + encodeURIComponent(query), {
        credentials: "include",
        headers: { Accept: "application/json" },
      })
        .then(function (r) {
          return r.ok ? r.json() : Promise.reject();
        })
        .then(function (json) {
          var found = [];
          walkItems(json, found);
          if (!found.length) {
            fail();
            return;
          }
          var best = pickApiItem(found, query) || found[0];
          fetch("/webshop/api/v1/basket/items", {
            method: "POST",
            credentials: "include",
            headers: { Accept: "application/json", "Content-Type": "application/json" },
            body: JSON.stringify({ productId: best.id, quantity: qty }),
          })
            .then(function (r) {
              if (r.ok) done();
              else fail();
            })
            .catch(fail);
        })
        .catch(fail);
      return;
    }
    fail();
  }
  function spaSearch(query) {
    var input = document.querySelector(
      'input[type="search"], input[name="search"], input[placeholder*="Search" i], input[aria-label*="Search" i], input[data-testid*="search" i]',
    );
    if (!input) return false;
    var proto = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value");
    try {
      if (proto && proto.set) proto.set.call(input, query);
      else input.value = query;
    } catch (e) {
      input.value = query;
    }
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    var form = input.form || input.closest("form");
    try {
      if (form && form.requestSubmit) form.requestSubmit();
      else if (form) form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      else
        input.dispatchEvent(
          new KeyboardEvent("keydown", { key: "Enter", code: "Enter", keyCode: 13, bubbles: true }),
        );
    } catch (e2) {}
    return true;
  }
  function jitter(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
  }
  function visible(el) {
    var r = el.getBoundingClientRect();
    return r.width >= 12 && r.height >= 12 && r.bottom > 0 && r.top < (window.innerHeight || 800);
  }
  function labelOf(el) {
    return ((el.getAttribute("aria-label") || "") + " " + (el.textContent || "")).replace(/\s+/g, " ").trim().toLowerCase();
  }
  function pageText() {
    return (document.body && document.body.innerText ? document.body.innerText : "").toLowerCase();
  }
  function wallKind() {
    var t = pageText();
    var h = host();
    if (h.indexOf("challenges.cloudflare") >= 0) return "failed";
    if (/max challenge|challenge attempts|please refresh the page to try again|too many attempts/.test(t)) return "failed";
    var widget = document.querySelector(
      '#challenge-running, #challenge-stage, .cf-turnstile, .cf-browser-verification, iframe[src*="challenges.cloudflare"], iframe[src*="recaptcha"], iframe[src*="hcaptcha"]',
    );
    if (/just a moment|checking your browser|enable javascript and cookies|verify you are human/.test(t) || widget) {
      if (/max challenge|please refresh the page/.test(t)) return "failed";
      return "check";
    }
    if (
      /we do not like robots|real shoppers|are you a robot|i'?m not a robot|unusual traffic|captcha|access denied|blocked for|automated/.test(
        t,
      )
    )
      return "failed";
    return "";
  }
  function looksLikeBotWall() {
    return wallKind() === "failed";
  }
  function hushTimers() {
    var a = window.__sfBagTimers || [];
    for (var i = 0; i < a.length; i++) window.clearTimeout(a[i]);
    window.__sfBagTimers = [];
  }
  function later(fn, ms) {
    if (!window.__sfBagTimers) window.__sfBagTimers = [];
    var id = window.setTimeout(fn, ms);
    window.__sfBagTimers.push(id);
    return id;
  }
  function looksEmpty() {
    var t = pageText();
    return /no results|0 results|we couldn'?t find|nothing matches|did not match|no products found|try another search/.test(t);
  }
  var OTHER = {
    peanut: 1,
    almond: 1,
    cashew: 1,
    chocolate: 1,
    juice: 1,
    soda: 1,
    broth: 1,
    stock: 1,
    nugget: 1,
    burger: 1,
    soup: 1,
    yogurt: 1,
    cookie: 1,
    cake: 1,
    gravy: 1,
    margarine: 1,
    sauce: 1,
    salsa: 1,
    dressing: 1,
    cereal: 1,
    bacon: 1,
    sausage: 1,
    ham: 1,
    jelly: 1,
    jam: 1,
    bell: 1,
    jalapeno: 1,
  };
  var GENERIC = {
    oil: 1,
    sauce: 1,
    milk: 1,
    cheese: 1,
    powder: 1,
    juice: 1,
    cream: 1,
    water: 1,
    salt: 1,
    pepper: 1,
    flour: 1,
    sugar: 1,
    rice: 1,
    bean: 1,
    broth: 1,
    stock: 1,
    paste: 1,
    vinegar: 1,
    yogurt: 1,
    extract: 1,
    flake: 1,
    seed: 1,
    mix: 1,
  };
  var SYN = {
    broth: ["stock"],
    stock: ["broth"],
    scallion: ["onion"],
    cilantro: ["coriander"],
    coriander: ["cilantro"],
    garbanzo: ["chickpea"],
    chickpea: ["garbanzo"],
    zucchini: ["courgette"],
    courgette: ["zucchini"],
    eggplant: ["aubergine"],
    aubergine: ["eggplant"],
    mince: ["ground"],
    ground: ["mince"],
  };
  function hasTok(set, t) {
    if (set[t]) return true;
    var syn = SYN[t] || [];
    for (var s = 0; s < syn.length; s++) if (set[syn[s]]) return true;
    return false;
  }
  function tokens(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/[^a-z0-9 ]+/g, " ")
      .split(/\s+/)
      .filter(function (w) {
        return w.length > 2;
      })
      .map(function (w) {
        if (w.length > 4 && w.charAt(w.length - 1) === "s" && w.slice(-2) !== "ss") return w.slice(0, -1);
        return w;
      });
  }
  function nameForMatch(s) {
    return String(s || "")
      .replace(/\b\d+([.,]\d+)?\s*(g|kg|ml|l|oz|lb|ct|pk|pack|count)?\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  var OPTIONAL = {
    salted: 1,
    unsalted: 1,
    fresh: 1,
    dried: 1,
    large: 1,
    extra: 1,
    virgin: 1,
    organic: 1,
    raw: 1,
    whole: 1,
    ripe: 1,
    chopped: 1,
    minced: 1,
    diced: 1,
    grated: 1,
    crushed: 1,
    peeled: 1,
    boneless: 1,
    skinless: 1,
    small: 1,
    medium: 1,
    purpose: 1,
    all: 1,
    kosher: 1,
    sea: 1,
    table: 1,
    ground: 1,
    cracked: 1,
    coarse: 1,
    fine: 1,
  };
  function isAltFood(toks) {
    var set = {};
    for (var i = 0; i < toks.length; i++) set[toks[i]] = 1;
    if (set.plant || set.vegan || set.margarine || set.impossible || set.beyond) return true;
    if (set.dairy && set.free) return true;
    if (set.non && set.dairy) return true;
    if (set.buttery || set.spread || set.becel || set.violife) return true;
    return false;
  }
  function isOffName(name, query) {
    var q = String(query || "").toLowerCase();
    var p = String(name || "").toLowerCase();
    if (/\bbutter\b/.test(q) && !/\b(peanut|almond|cashew|seed)\b/.test(q)) {
      return /plant|vegan|margarine|dairy.?free|non.?dairy|buttery|\bspread\b|becel|violife|earth balance|country crock|not butter|butter alternative|flora plant/.test(
        p,
      );
    }
    if (/\bmilk\b/.test(q) && !/\b(coconut|condensed|evaporated)\b/.test(q)) {
      return /plant|vegan|dairy.?free|non.?dairy|\boat\b|almond|soy|cashew|oatly|\bsilk\b/.test(p);
    }
    return false;
  }
  function relevant(product, query) {
    if (isOffName(product, query)) return false;
    var q = tokens(nameForMatch(query));
    var n = tokens(nameForMatch(product));
    if (!q.length || !n.length) return false;
    var set = {};
    n.forEach(function (t) {
      set[t] = 1;
    });
    var head = q[q.length - 1];
    if (!hasTok(set, head)) return false;
    if (isAltFood(n) && !isAltFood(q)) return false;
    if (GENERIC[head] && q.length >= 2) {
      var prev = q[q.length - 2];
      if (!OPTIONAL[prev] && !hasTok(set, prev)) return false;
    }
    for (var j = 0; j < n.length; j++) {
      if (OTHER[n[j]] && q.indexOf(n[j]) < 0) return false;
    }
    return true;
  }
  function parsePrice(text) {
    var s = String(text || "")
      .replace(/,/g, "")
      .replace(/\$\s*\d+(?:\.\d+)?\s*\/\s*[\d.]*\s*(g|kg|ml|l|oz|lb|ea|100\s*g)/gi, " ");
    var m = s.match(/\$\s*(\d+(?:\.\d{1,2})?)/);
    if (!m) return null;
    var n = Number(m[1]);
    return n > 0 && n < 500 ? n : null;
  }
  function houseBias(name) {
    return /compliments|no name|great value|\bselection\b/.test(String(name || "").toLowerCase()) ? 0 : 1;
  }
  function isAddButton(el) {
    if (!el || el.closest("#sf-bag")) return false;
    var label = labelOf(el);
    if (!label) return false;
    if (label === "+" || label === "＋" || label === "−" || label === "-" || label === "–") {
      return label === "+" || label === "＋";
    }
    if (label.indexOf("address") >= 0 || label.indexOf("added") >= 0 || label.indexOf("addition") >= 0) return false;
    return (
      label === "add" ||
      label === "add to cart" ||
      label === "add to bag" ||
      label === "ajouter" ||
      label.indexOf("add to cart") >= 0 ||
      label.indexOf("add to bag") >= 0 ||
      /^add(\s|$)/.test(label) ||
      (/\badd\b/.test(label) && label.length < 28)
    );
  }
  function cardOf(el) {
    var n = el;
    for (var i = 0; i < 10 && n; i++) {
      if (n.getAttribute) {
        var testid = (n.getAttribute("data-testid") || "") + (n.getAttribute("data-automation-id") || "");
        if (
          n.getAttribute("data-item-id") ||
          n.getAttribute("data-product-id") ||
          n.tagName === "ARTICLE" ||
          /product|item-card|search-result/i.test(testid)
        ) {
          return n;
        }
      }
      n = n.parentElement;
    }
    n = el;
    for (var j = 0; j < 7 && n; j++) {
      var t = n.innerText || "";
      if (t.length > 24 && t.length < 900 && /\$\s*\d/.test(t)) return n;
      n = n.parentElement;
    }
    return el.parentElement || el;
  }
  function cardName(card) {
    if (!card) return "";
    var h = card.querySelector(
      'h1,h2,h3,h4,[data-testid*="title" i],[data-automation-id*="name" i],[data-testid*="name" i]',
    );
    if (h && h.textContent) return h.textContent.replace(/\s+/g, " ").trim().slice(0, 180);
    var t = (card.innerText || "")
      .split("\n")
      .map(function (s) {
        return s.trim();
      })
      .filter(function (s) {
        return s && !/^\$/.test(s) && !/^add/i.test(s);
      });
    return (t[0] || "").slice(0, 180);
  }
  function findBestAdd(query, prefer) {
    var nodes = document.querySelectorAll(
      'button, [role="button"], a, input[type="button"], [data-testid*="add" i], [aria-label*="add" i]',
    );
    var best = null;
    var bestPrice = 1e9;
    var found = 0;
    var preferBits = String(prefer || "")
      .toLowerCase()
      .split(/\s+/)
      .filter(function (w) {
        return w.length > 3 && !/salted|unsalted|butter|organic/.test(w);
      })
      .slice(0, 2);
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (!isAddButton(el) || !visible(el)) continue;
      var card = cardOf(el);
      var name = cardName(card);
      var text = ((card && card.innerText) || name || "").replace(/\s+/g, " ");
      if (!relevant(name || text, query) || isOffName(text, query)) continue;
      found++;
      var price = parsePrice(text);
      var pref = 0;
      var low = (name || "").toLowerCase();
      for (var p = 0; p < preferBits.length; p++) if (low.indexOf(preferBits[p]) >= 0) pref -= 0.8;
      var score = (price == null ? 80 : price) + houseBias(name) * 0.45 + pref;
      if (score < bestPrice) {
        bestPrice = score;
        best = el;
      }
    }
    return best;
  }
  function findAnyAdd() {
    var nodes = document.querySelectorAll("button, [role=\"button\"], a");
    for (var i = 0; i < nodes.length; i++) {
      if (isAddButton(nodes[i]) && visible(nodes[i])) return nodes[i];
    }
    return null;
  }
  function findProductLink(query) {
    var as = document.querySelectorAll("a[href]");
    var best = null;
    var bestPrice = 1e9;
    for (var i = 0; i < as.length; i++) {
      var a = as[i];
      if (a.closest && a.closest("#sf-bag")) continue;
      if (!visible(a)) continue;
      var href = a.getAttribute("href") || "";
      if (/^(javascript:|#|mailto:)/i.test(href)) continue;
      var card = cardOf(a);
      var name = cardName(card) || (a.textContent || "").replace(/\s+/g, " ").trim();
      var text = (card && card.innerText) || name;
      if (!relevant(name, query) || isOffName(text, query)) continue;
      var price = parsePrice(text);
      var score = (price == null ? 80 : price) + houseBias(name) * 0.45;
      if (!/product|sku|\/ip\/|\/en\/p\/|\/p\//i.test(href)) score += 40;
      if (score < bestPrice) {
        bestPrice = score;
        best = a;
      }
    }
    return best;
  }
  function nextUndone() {
    var d = doneSet();
    var list = window.__sfBagItems || [];
    for (var i = 0; i < list.length; i++) {
      if (!d.has(keyOf(list[i], i))) return i;
    }
    return -1;
  }
  function wantOf(it) {
    return cleanQuery((it && it.name) || "") || (it && it.name) || "";
  }
  function shortWant(want) {
    var t = tokens(want);
    if (t.length <= 2) return t.join(" ");
    return t.slice(-2).join(" ");
  }
  function simpSet() {
    try {
      return new Set(JSON.parse(get("sf-bag-simp", "[]")));
    } catch (e) {
      return new Set();
    }
  }
  function saveSimp(d) {
    set("sf-bag-simp", JSON.stringify(Array.from(d)));
  }
  function searchQuery(it) {
    var want = wantOf(it);
    var k = String((it && (it.name || it.query)) || want);
    if (simpSet().has(k)) return shortWant(want) || want;
    return want;
  }
  function humanClick(el, done) {
    try {
      el.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
    } catch (e) {}
    window.setTimeout(function () {
      var r = el.getBoundingClientRect();
      var x = r.left + r.width * (0.35 + Math.random() * 0.3);
      var y = r.top + r.height * (0.4 + Math.random() * 0.25);
      var seq = [
        "pointerover",
        "mouseover",
        "pointerenter",
        "mouseenter",
        "pointerdown",
        "mousedown",
        "pointerup",
        "mouseup",
        "click",
      ];
      var k = 0;
      function step() {
        if (k >= seq.length) {
          done();
          return;
        }
        var type = seq[k++];
        var opts = {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX: x,
          clientY: y,
          button: 0,
          buttons: type.indexOf("down") >= 0 ? 1 : 0,
          pointerId: 1,
          pointerType: "touch",
          isPrimary: true,
        };
        try {
          if (type.indexOf("pointer") === 0) el.dispatchEvent(new PointerEvent(type, opts));
          else el.dispatchEvent(new MouseEvent(type, opts));
        } catch (err) {
          try {
            el.click();
          } catch (e2) {}
        }
        window.setTimeout(step, jitter(18, 45));
      }
      step();
    }, jitter(180, 420));
  }
  function pauseFill(reason) {
    hushTimers();
    set("sf-bag-fill", "0");
    set("sf-bag-pause", reason || "1");
    set("sf-bag-min", "0");
    window.__sfBagBusy = false;
    paint();
  }
  function markAndHop(it, idx) {
    var d = doneSet();
    d.add(keyOf(it, idx));
    saveDone(d);
    set("sf-bag-pdp", "");
    window.__sfBagBusy = false;
    paint();
    var packed = d.size;
    if (get("sf-bag-auto") !== "1" && packed > 0 && packed % 3 === 0 && nextUndone() >= 0) {
      pauseFill("batch");
      return;
    }
    if (packed === 1 || packed % 5 === 0) pingFill(packed, (window.__sfBagItems || []).length);
    hopNext();
  }
  function skipAndHop(it, idx) {
    var d = doneSet();
    d.add(keyOf(it, idx));
    saveDone(d);
    var sk = skipSet();
    sk.add(keyOf(it, idx));
    saveSkip(sk);
    set("sf-bag-pdp", "");
    window.__sfBagBusy = false;
    paint();
    hopNext();
  }
  function hopNext() {
    if (get("sf-bag-fill", "") !== "1") return;
    var kind = wallKind();
    if (kind === "failed") {
      pauseFill("bot");
      if (get("sf-bag-need", "") !== "1") {
        set("sf-bag-need", "1");
        pingNeed("The store needs a sign-in or check. Finish it — Spoonful will keep packing after that.");
      }
      return;
    }
    if (kind === "check") {
      later(hopNext, 5000);
      return;
    }
    if (get("sf-bag-auto") === "1") {
      later(function () {
        window.__sfBagBusy = false;
        maybeFill();
      }, jitter(800, 1600));
      return;
    }
    later(function () {
      if (get("sf-bag-fill", "") !== "1") return;
      if (wallKind()) {
        if (wallKind() === "failed") pauseFill("bot");
        else later(hopNext, 5000);
        return;
      }
      var n = nextUndone();
      if (n < 0) {
        set("sf-bag-fill", "0");
        set("sf-bag-min", "1");
        paint();
        return;
      }
      var list = window.__sfBagItems || [];
      location.href = searchUrl(list[n]);
    }, jitter(9000, 14000));
  }
  function tryAdd(it, idx, attempt) {
    if (get("sf-bag-fill", "") !== "1") {
      window.__sfBagBusy = false;
      return;
    }
    var kind = wallKind();
    if (kind === "failed") {
      pauseFill("bot");
      return;
    }
    if (kind === "check") {
      window.__sfBagBusy = false;
      later(function () {
        tryAdd(it, idx, attempt);
      }, 4500);
      return;
    }
    tryApiAdd(
      it,
      idx,
      function () {
        markAndHop(it, idx);
      },
      function () {
        var query = searchQuery(it);
        var want = wantOf(it);
        var prefer = it.product || "";
        var add = findBestAdd(query, prefer) || (query !== want ? findBestAdd(want, prefer) : null);
        if (add) {
          humanClick(add, function () {
            markAndHop(it, idx);
          });
          return;
        }
        if (get("sf-bag-pdp", "") !== "1") {
          if (spaSearch(query)) {
            set("sf-bag-pdp", "1");
            window.__sfBagBusy = false;
            later(function () {
              tryAdd(it, idx, attempt + 1);
            }, jitter(1400, 2200));
            return;
          }
          var link = findProductLink(query) || findProductLink(want);
          if (link) {
            set("sf-bag-pdp", "1");
            humanClick(link, function () {
              window.__sfBagBusy = false;
            });
            return;
          }
        }
        var k = keyOf(it, idx);
        if ((looksEmpty() || attempt >= 2) && !simpSet().has(k) && shortWant(want) !== want) {
          var sm = simpSet();
          sm.add(k);
          saveSimp(sm);
          set("sf-bag-pdp", "");
          window.__sfBagBusy = false;
          if (get("sf-bag-auto") === "1") {
            later(function () {
              tryAdd(it, idx, attempt + 1);
            }, 2000);
            return;
          }
          location.href = searchUrl(it);
          return;
        }
        if (looksEmpty() || attempt >= 4) {
          skipAndHop(it, idx);
          return;
        }
        later(function () {
          tryAdd(it, idx, attempt + 1);
        }, jitter(2800, 4800));
      },
    );
  }
  function maybeFill() {
    if (get("sf-bag-fill", "") !== "1") return;
    if (window.__sfBagBusy) return;
    var kind = wallKind();
    if (kind === "failed") {
      pauseFill("bot");
      if (get("sf-bag-need", "") !== "1") {
        set("sf-bag-need", "1");
        pingNeed("The store needs a sign-in or check. Finish it — Spoonful will keep packing after that.");
      }
      return;
    }
    if (kind === "check") {
      later(maybeFill, 4000);
      return;
    }
    var idx = nextUndone();
    if (idx < 0) {
      set("sf-bag-fill", "0");
      set("sf-bag-auto", "0");
      set("sf-bag-min", "1");
      var list = window.__sfBagItems || [];
      var packed = doneSet().size;
      ping("Cart ready to review", packed + " of " + list.length + " packs are in the bag. Open Shop when you want to check out.");
      paint();
      return;
    }
    set("sf-bag-min", "1");
    window.__sfBagBusy = true;
    var extra = document.readyState === "complete" ? 0 : 600;
    later(function () {
      var list = window.__sfBagItems || [];
      tryAdd(list[idx], idx, 0);
    }, jitter(700, 1400) + extra);
  }
  function watch() {
    if (window.__sfBagWatch) return;
    window.__sfBagWatch = window.setInterval(function () {
      if (!document.getElementById("sf-bag") && (window.__sfBagItems || []).length) paint();
      if (wallKind() === "failed") {
        if (get("sf-bag-fill", "") === "1" || get("sf-bag-pause", "") !== "bot") {
          pauseFill("bot");
          if (get("sf-bag-need", "") !== "1") {
            set("sf-bag-need", "1");
            pingNeed("The store needs a sign-in or check. Finish it — Spoonful will keep packing after that.");
          }
        }
        return;
      }
      if (get("sf-bag-auto") === "1" && get("sf-bag-fill", "") !== "1" && aisleReady() && nextUndone() >= 0) {
        set("sf-bag-fill", "1");
        set("sf-bag-pause", "");
        set("sf-bag-need", "");
        if (get("sf-bag-pinged", "") !== "1") {
          set("sf-bag-pinged", "1");
          ping("Filling your cart", "You can put the phone down. We'll ping you when the bag is ready to review.");
        }
        maybeFill();
        return;
      }
      if (get("sf-bag-fill", "") === "1" && !window.__sfBagBusy) maybeFill();
    }, 1400);
  }
  function counts() {
    var list = window.__sfBagItems || [];
    if (!list.length) {
      try {
        list = JSON.parse(get("sf-bag-items", "[]"));
        window.__sfBagItems = list;
      } catch (e) {
        list = [];
      }
    }
    var d = doneSet();
    var sk = skipSet();
    var left = 0;
    var skipped = 0;
    for (var i = 0; i < list.length; i++) {
      var k = keyOf(list[i], i);
      if (!d.has(k)) left++;
      if (sk.has(k)) skipped++;
    }
    return { list: list, d: d, sk: sk, left: left, skipped: skipped, filling: get("sf-bag-fill", "") === "1", pause: get("sf-bag-pause", "") };
  }
  function ensureStyle() {
    if (document.getElementById("sf-bag-css")) return;
    var s = document.createElement("style");
    s.id = "sf-bag-css";
    s.textContent =
      "@keyframes sfPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}" +
      "#sf-bag,#sf-bag *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}" +
      "#sf-bag button{cursor:pointer}";
    (document.head || document.documentElement).appendChild(s);
  }
  function el(tag, style, text) {
    var n = document.createElement(tag);
    if (style) n.setAttribute("style", style);
    if (text != null) n.textContent = text;
    return n;
  }
  function paint() {
    ensureStyle();
    var old = document.getElementById("sf-bag");
    if (old) old.remove();
    var c = counts();
    var list = c.list;
    if (!list.length) return;
    var box = document.createElement("div");
    box.id = "sf-bag";
    var minimized = get("sf-bag-min", "") === "1";
    var showList = get("sf-bag-list", "") === "1";
    var packed = list.length - c.left;

    if (minimized) {
      box.setAttribute(
        "style",
        "position:fixed;left:12px;bottom:20px;z-index:2147483646;font:14px/1.2 system-ui,sans-serif;" +
          "background:#e24a12;color:#fff7ef;border-radius:28px;padding:14px 18px 12px;" +
          "box-shadow:0 0 0 3px #fff7ef,0 16px 40px rgba(0,0,0,.55);font-weight:800;" +
          "letter-spacing:.04em;text-transform:uppercase;max-width:78vw;cursor:pointer;" +
          "animation:sfPulse 1.6s ease-in-out infinite",
      );
      box.setAttribute("role", "button");
      box.setAttribute("aria-label", "Show Spoonful bag");
      box.appendChild(
        el(
          "div",
          null,
          c.filling ? "Adding " + packed + " / " + list.length : c.pause === "bot" ? "Store paused · tap" : "Spoonful bag · " + c.left,
        ),
      );
      box.appendChild(
        el(
          "div",
          "margin-top:4px;font-size:11px;letter-spacing:.16em;opacity:.95;font-weight:800",
          "Tap to show list",
        ),
      );
      box.onclick = function () {
        set("sf-bag-min", "0");
        paint();
      };
      document.documentElement.appendChild(box);
      return;
    }

    box.setAttribute(
      "style",
      "position:fixed;left:8px;right:8px;bottom:8px;z-index:2147483646;font:14px/1.35 system-ui,sans-serif;" +
        "background:rgba(28,26,22,.97);color:#f6f3eb;border-radius:18px;padding:10px 12px;" +
        (showList ? "max-height:36vh;overflow:auto;" : "") +
        "box-shadow:0 12px 40px rgba(0,0,0,.45)",
    );

    var head = el("div", "display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px");
    var t = el(
      "strong",
      "font-size:12px;letter-spacing:.12em;text-transform:uppercase",
      c.filling
        ? "Adding slowly · " + packed + "/" + list.length + (c.skipped ? " · " + c.skipped + " skipped" : "")
        : c.pause === "bot"
          ? "Paused · store check"
          : c.pause === "batch"
            ? "Paused after a few"
            : "Spoonful bag · " + c.left + " left",
    );
    var hide = el("button", "background:#fff7ef;color:#1c1a16;border:0;border-radius:999px;font-size:13px;font-weight:800;padding:10px 14px", "Minimize");
    hide.setAttribute("aria-label", "Minimize bag — orange chip brings it back");
    hide.onclick = function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      set("sf-bag-min", "1");
      set("sf-bag-list", "0");
      paint();
    };
    head.appendChild(t);
    head.appendChild(hide);
    box.appendChild(head);

    var actions = el("div", "display:flex;gap:8px");
    var fill = el(
      "button",
      "flex:1;background:#e24a12;color:#fff7ef;border:0;border-radius:12px;padding:12px;font-weight:800",
      c.filling ? "Pause fill" : c.pause === "bot" || c.pause === "batch" ? "Continue" : "Fill this cart slowly",
    );
    fill.onclick = function () {
      if (c.filling) {
        hushTimers();
        set("sf-bag-fill", "0");
        window.__sfBagBusy = false;
        paint();
        return;
      }
      if (wallKind() === "failed") {
        pauseFill("bot");
        return;
      }
      set("sf-bag-fill", "1");
      set("sf-bag-pause", "");
      set("sf-bag-min", "1");
      var n = nextUndone();
      paint();
      if (n >= 0 && !wallKind()) location.href = searchUrl(list[n]);
    };
    var listBtn = el(
      "button",
      "flex:0 0 auto;background:#fff7ef;color:#1c1a16;border:0;border-radius:12px;padding:12px 14px;font-weight:800",
      showList ? "Close" : "List",
    );
    listBtn.onclick = function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      set("sf-bag-list", showList ? "0" : "1");
      paint();
    };
    actions.appendChild(fill);
    actions.appendChild(listBtn);
    box.appendChild(actions);

    var hint = el("p", "margin:8px 0 0;font-size:12px;line-height:1.4;opacity:.85");
    if (c.pause === "bot") {
      hint.textContent =
        "The store locked a check because fill was moving too fast. Do not refresh this page. Finish the check if you can, or go back in Spoonful and open the store again. Then tap Continue — it adds three packs, then waits.";
    } else if (c.pause === "batch") {
      hint.textContent =
        "Added a few, then stopped so the store still sees a shopper. Tap Continue for the next three.";
    } else if (c.skipped && !c.filling) {
      hint.textContent =
        "Packed what was on the shelf. " +
        c.skipped +
        " line" +
        (c.skipped === 1 ? "" : "s") +
        " had no literal match — tap Find on a skipped line to pick it yourself.";
    } else if (showList) {
      hint.textContent = "";
    } else {
      hint.textContent =
        "When the aisle looks like a store, tap Fill this cart slowly. It searches each ingredient, taps the cheapest real pack, adds three, then waits. If a check appears, finish it yourself — never refresh.";
    }
    if (hint.textContent) box.appendChild(hint);

    if (showList) {
      list.forEach(function (it, i) {
        var k = keyOf(it, i);
        var skipped = c.sk.has(k);
        var packedRow = c.d.has(k) && !skipped;
        var row = el(
          "div",
          "display:flex;gap:8px;align-items:center;padding:8px 0;border-top:1px solid rgba(255,255,255,.12);opacity:" +
            (packedRow ? ".45" : "1"),
        );
        var lab = el(
          "div",
          "flex:1;min-width:0",
          (packedRow ? "✓ " : skipped ? "○ " : "") + (it.qty ? it.qty + "× " : "") + (it.name || it.query || "Item"),
        );
        var go = el(
          "button",
          "flex-shrink:0;background:#e24a12;color:#fff7ef;border:0;border-radius:999px;padding:8px 12px;font-weight:700",
          packedRow ? "Again" : skipped ? "Find" : "Find",
        );
        go.onclick = function () {
          location.href = searchUrl(it);
        };
        row.appendChild(lab);
        row.appendChild(go);
        box.appendChild(row);
      });
    }
    document.documentElement.appendChild(box);
  }
};
