---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: 'Retouche'
  tagline: 'An experimental CMS for your Vite application. Annotate, Build, Edit.'
  image:
    src: /demo.png
    alt: Demo
  actions:
    - theme: brand
      text: Get Started
      link: /get-started
    - theme: alt
      text: Explore Examples
      link: https://github.com/zugriffcloud/retouche/tree/main/examples
---

> [!CAUTION]
> Retouche is experimental.

Retouche is not a typical CMS. Instead of living on a server, it can live along your application on a CDN for static content and your GitHub or GitLab repository. Changes made through the Retouche editor can be published in no time using GitHub Actions or GitLab CI/CD pipelines.

## What can Retouche be used for?

Simple single- or multi-page applications that do not require creating new pages or elements can benefit from Retouche.

## How does Retouche work?

During build time, Retouche collects information on elements with specific attributes (e.g. `data-retouche`) through regular expressions and transforms discovered attributes to include information regarding their location and integrity before handing off your components and pages for further processing. While this limits the capabilities of Retouche, it allows for a much less complicated integration if compared to a traditional, headless CMS, for example.

Later, an editor is mounted if an `edit` key is present in the query string.
Depending on the adapter, the browser will ask for a token or a username/ password combination to publish changes.

## What can be changed with Retouche?

- Text
- Links (`href`)
- Files (`src` - e.g. images, videos)

<style>
:root {
  --vp-home-hero-name-color: var(--vp-c-neutral);
}

.image-bg {
  width: 100% !important;
}

.VPImage.image-src  {
  max-width: unset !important;
  width: 100% !important;
}
</style>
