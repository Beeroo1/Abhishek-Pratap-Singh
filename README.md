# Personal website: Abhishek Pratap Singh, Advocate

A hand-built static site. No WordPress, no database, no tracking. You write in Markdown; a small Node script (`build.js`) turns it into plain HTML in `dist/`.

## Structure

```
site.config.json        Your profile: name, enrolment, practice areas, education, experience
content/writings/       Original articles and case notes (one .md file each)
content/drafts/         Anonymised drafting samples (one .md file each)
public/                 Anything copied as is, e.g. a CV PDF or a photograph
src/styles.css          The design
build.js                The builder
serve.js                Local preview server
```

## Everyday use

1. `npm install` (once)
2. `npm run dev`, then open http://localhost:8080
3. To publish a new piece, copy `content/writings/_TEMPLATE.md` to a new file such as `content/writings/limitation-in-commercial-suits.md`, fill in the header and write below it. The file name becomes the web address.
4. In drafts, wrap identifying particulars in double square brackets, `[[Like This]]`; they render as black redaction bars. Redact in the source too: the bracketed text still sits in your file, so never type a real client name there.
5. Set `publish: false` in a file's header to keep it off the site.

The two seeded pieces are placeholders (they show a yellow banner). Replace their text with your own and set `placeholder: false`.

## Going live free on GitHub Pages

1. Create a GitHub repository and push this folder to its `main` branch.
2. In the repository: Settings, Pages, Source: **GitHub Actions**. The included workflow builds and deploys on every push.
3. For your own domain (for example `abhishekpratapsingh.in`, roughly Rs 600 to 900 a year from any registrar), add it under Settings, Pages, Custom domain, then create the DNS records GitHub shows you. Put the same address in `siteUrl` in `site.config.json`.

Netlify or Cloudflare Pages work equally well: build command `npm run build`, output directory `dist`.

## Bar Council compliance

Rule 36 of the Bar Council of India Rules, as amended in 2008, permits an advocate's website to state name, contact details, enrolment, qualifications and areas of practice. The site therefore:

- shows a disclaimer the visitor must accept before reading;
- carries no testimonials, fee information, success claims or invitations to instruct;
- publishes drafts only in anonymised form.

Keep new content within these limits, and never publish a client's name, a privileged document, or a figure that identifies a matter.
