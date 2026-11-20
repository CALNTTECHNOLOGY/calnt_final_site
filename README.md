# Website

Simple, fast, SEO-ready site built with Astro + Tailwind CSS, hosted on Cloudflare Pages.

## Edit content
- **Company name, domain, phone, email, nav:** `src/site.config.ts`
- **Pages:** `src/pages/*.astro` (each file = one page)
- **Brand color:** `--color-brand` in `src/styles/global.css`
- **Social share image:** add a 1200×630 `public/og-image.png`

## Run locally
```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # outputs to dist/
```

## Deploy to Cloudflare Pages
1. Push this folder to a GitHub repo.
2. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → pick the repo.
3. Build command: `npm run build` · Output directory: `dist`
4. Add your custom domain under the project's **Custom domains** tab.

Every push to `main` deploys automatically.

## SEO included
Per-page titles and meta descriptions, canonical URLs, Open Graph and Twitter cards,
Organization JSON-LD, `sitemap-index.xml`, `robots.txt`, semantic HTML, zero JS by default.
After launch, submit the sitemap in Google Search Console.
