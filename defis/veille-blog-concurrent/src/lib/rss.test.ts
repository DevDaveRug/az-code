import { test } from "node:test";
import assert from "node:assert/strict";
import { lireFlux } from "./rss";

test("RSS 2.0 : titre, date et lien", () => {
  const xml = `<?xml version="1.0"?><rss version="2.0"><channel><title>Blog</title>
    <item><title>Avoine : bienfaits</title><link>https://exemple.example/avoine</link><pubDate>Fri, 23 Oct 2026 14:06:43 +0000</pubDate></item>
    <item><title>Sans lien</title></item>
  </channel></rss>`;
  const a = lireFlux(xml);
  assert.equal(a.length, 1);
  assert.equal(a[0].titre, "Avoine : bienfaits");
  assert.equal(a[0].lien, "https://exemple.example/avoine");
  assert.equal(a[0].date?.toISOString(), "2026-10-23T14:06:43.000Z");
});

test("RSS 2.0 avec un seul article", () => {
  const xml = `<rss><channel><item><title>Seul</title><link>https://exemple.example/seul</link></item></channel></rss>`;
  const a = lireFlux(xml);
  assert.equal(a.length, 1);
  assert.equal(a[0].date, null);
});

test("Atom : lien alternate et date published", () => {
  const xml = `<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Atom 1</title>
    <link rel="self" href="https://exemple.example/self"/><link rel="alternate" href="https://exemple.example/atom-1"/>
    <published>2026-11-02T09:24:06Z</published></entry></feed>`;
  const a = lireFlux(xml);
  assert.deepEqual(a.map((x) => x.lien), ["https://exemple.example/atom-1"]);
});

test("Page HTML : erreur explicite", () => {
  assert.throws(() => lireFlux("<html><body>pas un flux</body></html>"), /ni un flux RSS/);
});

test("Entites et CDATA decodees dans le titre", () => {
  const xml = `<rss><channel><item><title><![CDATA[Fruits &amp; l&#233;gumes]]></title><link>https://exemple.example/a?x=1&amp;y=2</link></item>
    <item><title>Caf&#xE9; &amp; th&eacute;</title><link>https://exemple.example/b</link></item></channel></rss>`;
  const a = lireFlux(xml);
  assert.equal(a[0].titre, "Fruits & légumes");
  assert.equal(a[0].lien, "https://exemple.example/a?x=1&y=2");
  assert.equal(a[1].titre, "Café & thé");
});
