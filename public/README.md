# public/

Static assets served from the site root. A file here at `public/foo.svg` is
reachable at `/foo.svg`.

## Sponsor logo

The footer sponsor credit is currently text only. To show Northwestern's mark
beside it, drop the asset here as:

    public/northwestern.svg      (preferred — scales cleanly at the ~20px the
                                  footer needs, and stays crisp on retina)
    public/northwestern.png      (fallback — supply @2x, i.e. ~40px tall)

Requirements:
  - Must be a version you have clearance to display in a sponsorship context.
  - Must live here, not hotlinked: the site sends `img-src 'self' data: blob:`
    (see next.config.mjs), so a remote logo URL is blocked by CSP.
  - Needs to read on the cream page ground (#F6F4EE), not on white.
