import assert from "node:assert/strict";
import test from "node:test";
import { partnersConfigured, tagOutbound, tagOutboundAll } from "./partner-links.ts";

function withEnv<T>(vars: Record<string, string | undefined>, run: () => T): T {
  const prev: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(vars)) {
    prev[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  try {
    return run();
  } finally {
    for (const [k, v] of Object.entries(prev)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

const NO_PARTNERS = {
  VITE_PARTNER_LOBLAW: undefined,
  VITE_PARTNER_WALMART: undefined,
  VITE_PARTNER_SOBEYS: undefined,
  VITE_PARTNER_INSTACART: undefined,
};

test("an unconfigured build tags nothing and claims nothing", () => {
  withEnv(NO_PARTNERS, () => {
    assert.equal(partnersConfigured(), false);
    const url = "https://www.realcanadiansuperstore.ca/en/p/20812345";
    assert.equal(tagOutbound(url, "product"), url);
  });
});

test("a Loblaw banner link carries the partner id and its placement", () => {
  withEnv({ ...NO_PARTNERS, VITE_PARTNER_LOBLAW: "spoonful-ca" }, () => {
    assert.equal(partnersConfigured(), true);
    const out = new URL(tagOutbound("https://www.atlanticsuperstore.ca/en/p/20812345", "product"));
    assert.equal(out.searchParams.get("aff"), "spoonful-ca");
    assert.equal(out.searchParams.get("utm_source"), "spoonful");
    assert.equal(out.searchParams.get("utm_campaign"), "product");
    assert.equal(out.pathname, "/en/p/20812345", "the path a cook needs must survive tagging");
  });
});

test("every Loblaw banner is covered by the one id", () => {
  withEnv({ ...NO_PARTNERS, VITE_PARTNER_LOBLAW: "id" }, () => {
    for (const host of [
      "www.realcanadiansuperstore.ca",
      "www.atlanticsuperstore.ca",
      "www.nofrills.ca",
      "www.zehrs.ca",
      "www.fortinos.ca",
      "www.loblaws.ca",
      "www.yourindependentgrocer.ca",
    ]) {
      assert.match(tagOutbound(`https://${host}/en/search?search-bar=milk`), /aff=id/, host);
    }
  });
});

test("each retailer gets the parameter its own program reads", () => {
  withEnv(
    {
      ...NO_PARTNERS,
      VITE_PARTNER_WALMART: "w1",
      VITE_PARTNER_SOBEYS: "s1",
      VITE_PARTNER_INSTACART: "i1",
    },
    () => {
      assert.match(tagOutbound("https://www.walmart.ca/en/search?q=milk"), /athcpid=w1/);
      assert.match(tagOutbound("https://www.voila.ca/search?q=milk"), /aff=s1/);
      assert.match(tagOutbound("https://www.instacart.ca/store/coop/s?k=milk"), /partner_id=i1/);
    },
  );
});

test("an existing query is kept, not clobbered", () => {
  withEnv({ ...NO_PARTNERS, VITE_PARTNER_WALMART: "w1" }, () => {
    const out = new URL(tagOutbound("https://www.walmart.ca/en/search?q=whole%20milk&sort=price"));
    assert.equal(out.searchParams.get("q"), "whole milk");
    assert.equal(out.searchParams.get("sort"), "price");
    assert.equal(out.searchParams.get("athcpid"), "w1");
  });
});

test("re-opening the same link does not stack duplicate tags", () => {
  withEnv({ ...NO_PARTNERS, VITE_PARTNER_LOBLAW: "id" }, () => {
    const once = tagOutbound("https://www.loblaws.ca/en/p/1");
    const twice = tagOutbound(once);
    assert.equal(once, twice);
    assert.equal(twice.split("aff=").length - 1, 1);
  });
});

test("a store we do not partner with is left alone", () => {
  withEnv({ ...NO_PARTNERS, VITE_PARTNER_LOBLAW: "id" }, () => {
    for (const url of [
      "https://www.google.com/maps/search/?api=1&query=Sobeys",
      "https://example.com/anything",
      "https://notloblaws.ca.evil.example/en/p/1",
    ]) {
      assert.equal(tagOutbound(url), url, url);
    }
  });
});

test("a grocery run never breaks over a tag", () => {
  withEnv({ ...NO_PARTNERS, VITE_PARTNER_LOBLAW: "id" }, () => {
    for (const junk of ["", "not a url", "pcx://cart", "/en/p/1"]) {
      assert.equal(tagOutbound(junk), junk, junk);
    }
    assert.deepEqual(tagOutboundAll([]), []);
  });
});
