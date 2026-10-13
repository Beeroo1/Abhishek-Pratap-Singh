// Static site builder: node build.js
// Reads site.config.json and Markdown files in content/, writes the finished site to dist/.
const fs = require("fs");
const path = require("path");
const { marked } = require("marked");

const ROOT = __dirname;
const OUT = path.join(ROOT, "dist");
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, "site.config.json"), "utf8"));

const COLLECTIONS = [
  { key: "writings", label: "Writings", blurb: "Original commentary, case notes and research." },
  { key: "drafts", label: "Drafts", blurb: "Anonymised drafting samples. Every party, place, figure and identifying fact has been removed or altered." }
];

const esc = (s = "") => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function parseFrontMatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: raw };
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(":");
    if (i < 1) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    if (v.startsWith("[") && v.endsWith("]")) v = v.slice(1, -1).split(",").map(x => x.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
    else if (v === "true" || v === "false") v = v === "true";
    data[k] = v;
  }
  return { data, body: m[2] };
}

function fmtDate(d) {
  if (!d) return "";
  const dt = new Date(d + "T00:00:00");
  return isNaN(dt) ? d : dt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

// [[any text]] renders as a redaction bar in drafts
const redact = html => html.replace(/\[\[(.+?)\]\]/g, (_, t) => `<span class="redact" aria-label="redacted">${"█".repeat(Math.min(Math.max(t.length, 4), 18))}</span>`);

function loadCollection(key) {
  const dir = path.join(ROOT, "content", key);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith(".md") && !f.startsWith("_"))
    .map(f => {
      const { data, body } = parseFrontMatter(fs.readFileSync(path.join(dir, f), "utf8"));
      return { ...data, slug: f.replace(/\.md$/, ""), html: redact(marked.parse(body)) };
    })
    .filter(p => p.publish !== false)
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
}

const THEME_SCRIPT = `<script>try{var t=localStorage.getItem("theme");if(t)document.documentElement.dataset.theme=t}catch(e){}</script>`;

function layout({ title, description, current, body, pathname }) {
  const nav = [["/", "CV", "home"], ["/writings/", "Writings", "writings"], ["/drafts/", "Drafts", "drafts"]]
    .map(([href, label, k]) => `<a href="${href}"${current === k ? ' aria-current="page"' : ""}>${label}</a>`).join("");
  const pageTitle = title ? `${esc(title)} | ${esc(cfg.name)}` : `${esc(cfg.name)}, ${esc(cfg.title)}`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${pageTitle}</title>
<meta name="description" content="${esc(description || cfg.tagline)}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${esc(cfg.siteUrl + pathname)}">
<meta property="og:title" content="${pageTitle}">
<meta property="og:description" content="${esc(description || cfg.tagline)}">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%2314202e'/%3E%3Ctext x='16' y='22' font-family='Georgia' font-size='17' fill='%23d4a55e' text-anchor='middle'%3E%C2%A7%3C/text%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=JetBrains+Mono:wght@400;500;600&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/styles.css">
${THEME_SCRIPT}
</head>
<body>
<header class="top"><div class="wrap">
  <a class="brand" href="/"><span>§</span> <span class="full">Abhishek Pratap Singh</span><span class="short" aria-hidden="true"></span></a>
  <nav>${nav}<button class="theme" id="themeBtn" aria-label="Toggle colour theme"><svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 1.5a6.5 6.5 0 0 1 0 13z" fill="currentColor"/></svg></button></nav>
</div></header>
<main class="wrap">
${body}
</main>
<footer><div class="wrap">
  <p>${esc(cfg.name)}, ${esc(cfg.title)} · ${esc(cfg.enrolment)}<br>
  <a href="mailto:${esc(cfg.email)}">${esc(cfg.email)}</a> · <a href="${esc(cfg.linkedin)}" rel="noopener">LinkedIn</a></p>
  <p>This website is maintained for informational purposes only, in conformity with Rule 36 of the Bar Council of India Rules. It does not constitute advertisement or solicitation, and nothing herein is legal advice or creates an advocate and client relationship. <a href="#" id="showGate">Read the full disclaimer</a>.</p>
  <p>© ${new Date().getFullYear()} ${esc(cfg.name)}. All writing on this site is original work and may not be reproduced without permission.</p>
</div></footer>

<div class="gate" id="gate" role="dialog" aria-modal="true" aria-labelledby="gateTitle">
  <div class="gate-box">
    <p class="kicker">Disclaimer</p>
    <h3 id="gateTitle">Before you proceed</h3>
    <p>The Bar Council of India does not permit advocates to advertise or solicit work. By clicking "I agree", you acknowledge that:</p>
    <p>(a) there has been no advertisement, personal communication, solicitation, invitation or inducement of any sort whatsoever from me or on my behalf to solicit any work through this website;<br>
    (b) you wish to gain more information about me for your own information and use;<br>
    (c) the information on this website is provided solely at your request, is not legal advice, and does not create an advocate and client relationship.</p>
    <p>I shall not be liable for any consequence of action taken in reliance on the material on this website.</p>
    <div class="gate-actions"><button class="btn" id="agree">I agree</button><a class="btn ghost" href="https://www.google.com" rel="noopener">Leave site</a></div>
  </div>
</div>
<script>
(function(){
  var g=document.getElementById("gate"), ok=false;
  try{ok=sessionStorage.getItem("bci-ok")==="1"||localStorage.getItem("bci-ok")==="1"}catch(e){}
  if(!ok)g.classList.add("show");
  document.getElementById("agree").onclick=function(){g.classList.remove("show");try{localStorage.setItem("bci-ok","1")}catch(e){}};
  document.getElementById("showGate").onclick=function(e){e.preventDefault();g.classList.add("show")};
  document.getElementById("themeBtn").onclick=function(){
    var r=document.documentElement, cur=r.dataset.theme||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"), n=cur==="dark"?"light":"dark";
    r.dataset.theme=n; try{localStorage.setItem("theme",n)}catch(e){}
  };
})();
</script>
</body>
</html>`;
}

function card(p, key) {
  const cite = [p.citation ? `<span class="k">${esc(p.citation)}</span>` : "", fmtDate(p.date)].filter(Boolean).join(" · ");
  return `<li><a class="card" href="/${key}/${p.slug}/">
    <div class="cite">${cite}</div>
    <div class="t">${esc(p.title)}</div>
    ${p.summary ? `<p class="s">${esc(p.summary)}</p>` : ""}
  </a></li>`;
}

function write(rel, html) {
  const f = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, html);
}

// ---- build ----
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.copyFileSync(path.join(ROOT, "src", "styles.css"), path.join(OUT, "styles.css"));
const pub = path.join(ROOT, "public");
if (fs.existsSync(pub)) fs.cpSync(pub, OUT, { recursive: true });

const data = Object.fromEntries(COLLECTIONS.map(c => [c.key, loadCollection(c.key)]));
const urls = ["/"];

// Home: the CV as a featured portfolio
const list = arr => `<ul class="entries">${arr.map(e => `<li><span class="what">${esc(e.what || e.role)}</span><span>${esc(e.where)}</span><span class="when">${esc(e.when)}</span>${e.note ? `<span class="note">${esc(e.note)}</span>` : ""}</li>`).join("")}</ul>`;
const recent = key => data[key].length ? `<ul class="cards">${data[key].slice(0, 2).map(p => card(p, key)).join("")}</ul>` : `<p class="empty">Forthcoming.</p>`;
const hasCv = cfg.cvFile && fs.existsSync(path.join(ROOT, "public", cfg.cvFile));
const cvBtn = hasCv
  ? `<a class="btn" href="/${esc(cfg.cvFile)}" download>Download CV (PDF)</a>`
  : `<button class="btn" type="button" onclick="window.print()">Save CV as PDF</button>`;
const sec = (n, t, inner, cls = "") => `<section class="${cls}"><h2><span class="sec">§ ${String(n).padStart(2, "0")}</span>${t}</h2>${inner}</section>`;
const roles = cfg.experience.map(r => `
  <article class="role">
    <div class="role-head">
      <div><h3>${esc(r.role)}</h3><p class="org">${esc(r.where)}</p></div>
      <span class="when">${esc(r.when)}</span>
    </div>
    ${r.intro ? `<p class="role-intro">${esc(r.intro)}</p>` : ""}
    <ul class="matters">${r.matters.map(m => `<li>
      <div class="m-tags"><span class="forum">${esc(m.forum)}</span><span class="law">${esc(m.law)}</span></div>
      <p>${esc(m.text)}</p></li>`).join("")}</ul>
  </article>`).join("");
const stats = [
  [cfg.courts.length, "Courts and tribunals"],
  [cfg.experience.reduce((a, r) => a + r.matters.length, 0), "Matters profiled"],
  [cfg.practiceAreas.length, "Practice areas"]
].map(([n, l]) => `<div class="stat"><b>${n}</b><span>${esc(l)}</span></div>`).join("");
let n = 0;
const home = `
<div class="hero cv-hero">
  <p class="kicker">Advocate · ${esc(cfg.enrolment)}</p>
  <h1>${esc(cfg.name)}</h1>
  <p class="lede">${esc(cfg.tagline)}</p>
  <div class="contact-row">
    <a href="mailto:${esc(cfg.email)}">${esc(cfg.email)}</a>
    <span>${esc(cfg.phone)}</span>
    <a href="${esc(cfg.linkedin)}" rel="noopener">LinkedIn</a>
    <span>${esc(cfg.location)}</span>
  </div>
  <div class="hero-actions no-print">${cvBtn}<a class="btn ghost" href="/writings/">Read my writing</a></div>
  <div class="stats">${stats}</div>
</div>
${sec(++n, "Profile", `<p class="summary">${esc(cfg.summary)}</p><ul class="tags">${cfg.practiceAreas.map(a => `<li>${esc(a)}</li>`).join("")}</ul>`)}
${sec(++n, "Experience", `${roles}<p class="earlier">${esc(cfg.earlier)}</p><p class="anon-note">Matters are described without party names, case numbers or figures, in keeping with professional confidentiality.</p>`)}
${sec(++n, "Courts and tribunals", `<ul class="courts">${cfg.courts.map(c => `<li>${esc(c)}</li>`).join("")}</ul>`)}
${sec(++n, "Education and enrolment", list(cfg.education))}
${sec(++n, "Legal technology", `<div class="project">
  <div class="p-head"><h3>${esc(cfg.project.name)}</h3><span class="when">${esc(cfg.project.status)}</span></div>
  <p>${esc(cfg.project.text)}</p>
  <div class="flow" aria-label="Pipeline"><span>Records</span><i>→</i><span>OCR extraction</span><i>→</i><span>Rule engine</span><i>→</i><span>Traceable findings</span></div>
  <ul class="stack">${cfg.project.stack.map(t => `<li>${esc(t)}</li>`).join("")}</ul>
</div>`)}
${sec(++n, "Skills", `<dl class="skills">${cfg.skills.map(s => `<dt>${esc(s.k)}</dt><dd>${esc(s.v)}</dd>`).join("")}</dl>`)}
${sec(++n, "Publication and writing", `<p class="pub">${esc(cfg.publication)}</p>${recent("writings")}<p class="no-print"><a class="back" href="/writings/">All writings →</a></p>`)}
${sec(++n, "Beyond the brief", `<ul class="plain">${cfg.additional.map(a => `<li>${esc(a)}</li>`).join("")}</ul><p class="cite">References available on request.</p>`)}`;
write("index.html", layout({ current: "home", body: home, pathname: "/" }));

for (const c of COLLECTIONS) {
  const items = data[c.key];
  const idx = `<div class="hero"><p class="kicker">${c.label}</p><h1>${c.label}</h1><p class="lede">${esc(c.blurb)}</p></div>
  ${items.length ? `<ul class="cards">${items.map(p => card(p, c.key)).join("")}</ul>` : `<p class="empty">Forthcoming.</p>`}`;
  write(`${c.key}/index.html`, layout({ title: c.label, description: c.blurb, current: c.key, body: idx, pathname: `/${c.key}/` }));
  urls.push(`/${c.key}/`);
  for (const p of items) {
    const tags = Array.isArray(p.tags) && p.tags.length ? `<ul class="tags" style="margin-top:28px">${p.tags.map(t => `<li>${esc(t)}</li>`).join("")}</ul>` : "";
    const note = c.key === "drafts" ? `<div class="notice">Anonymised drafting sample. All names, addresses, figures and identifying particulars have been removed or altered; it reproduces no privileged communication.</div>` : "";
    const ph = p.placeholder ? `<div class="notice"><b>Placeholder.</b> Replace this file's text with your own work, then set <code>placeholder: false</code>.</div>` : "";
    const body = `<article class="article">
      <a class="back" href="/${c.key}/">← ${c.label}</a>
      <p class="kicker" style="margin-top:22px">${p.citation ? esc(p.citation) : c.label}</p>
      <h1>${esc(p.title)}</h1>
      <p class="cite">${esc(cfg.name)} · ${fmtDate(p.date)}${p.readTime ? " · " + esc(p.readTime) : ""}</p>
      <hr style="border:0;border-top:1px solid var(--rule);margin:22px 0">
      ${ph}${note}<div class="prose">${p.html}</div>${tags}
    </article>`;
    write(`${c.key}/${p.slug}/index.html`, layout({ title: p.title, description: p.summary, current: c.key, body, pathname: `/${c.key}/${p.slug}/` }));
    urls.push(`/${c.key}/${p.slug}/`);
  }
}

write("404.html", layout({ title: "Not found", current: "", pathname: "/404.html", body: `<div class="hero"><p class="kicker">404</p><h1>Page not found</h1><p class="lede">The page you sought does not exist. <a href="/">Return to the profile</a>.</p></div>` }));
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${esc(cfg.siteUrl + u)}</loc></url>`).join("\n")}\n</urlset>\n`);
write("robots.txt", `User-agent: *\nAllow: /\nSitemap: ${cfg.siteUrl}/sitemap.xml\n`);

console.log(`Built ${urls.length} pages into dist/ (${data.writings.length} writings, ${data.drafts.length} drafts).`);
