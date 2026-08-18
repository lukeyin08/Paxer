# public/

Static assets served from the site root. A file here at `public/foo.svg` is
reachable at `/foo.svg`.

## Sponsor logo

The footer sponsor credit is currently text only. To show Northwestern's mark
beside it, drop the asset here as:

    public/northwestern.png      (in place: 600x145, transparent, downscaled from a
                                  10417x2514 original — 488K to 72K)


Requirements:
  - Must be a version you have clearance to display in a sponsorship context.
  - Must live here, not hotlinked: the site sends `img-src 'self' data: blob:`
    (see next.config.mjs), so a remote logo URL is blocked by CSP.
  - Needs to read on the cream page ground (#F6F4EE), not on white.
