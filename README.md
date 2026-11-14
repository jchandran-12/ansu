# For Ansu

A single scrolling Quarto page, made with love.

## What's on the page

0. **The heart she holds**: it fills with colour while held (or with a few taps), then blooms open
1. **Her name, handwritten**: "Ansu" writes itself in ink while rose petals fall
2. **Messages I Never Sent You**: unsent texts appear on a phone, one by one, ending in "Seen ♥"
3. **Every Version of You**: a reel of polaroids that develop from dark to colour when tapped
4. **Us, in Three Seconds**: a photo booth prints your strip; tap the booth to print it again
5. **If Only You Could See What I See**: tap the mirror and the reflection and words change
6. **Our Little World**: taped-up photos of the two of you (tap to enlarge)
7. **How Much Do I Love You?**: drag the heart; at 100 it breaks into ∞
8. **A Jar Full of Reasons**: every tap pulls a folded reason out of the jar
9. **Just Between Us**: wipe the fog off the window (a heart is already drawn on it)
10. **A Letter for You**: a letter folded in thirds that unfolds in 3D
11. **Promises I'm Locking In**: lock each padlock to reveal a promise; then the key is thrown away
12. **Every Day Since**: live counter (hidden until a start date is set)
13. **For Every Dream of Yours**: lanterns float into the night, then a final heart and a shower of petals

## Editing

| What                        | Where |
|-----------------------------|-------|
| All text, photos, the letter | `index.qmd` (each section is an HTML block; look for ✏️) |
| The "Every Day Since" date   | `data-since="YYYY-MM-DD"` on the `#since` section in `index.qmd` |
| Colours & fonts              | top of `assets/css/love.css` |
| Interactions                 | `assets/js/love.js` |
| Background music             | add `assets/music/song.mp3` (starts when the heart opens) |

## Publish on GitHub Pages

1. Push to `main`.
2. On GitHub: **Settings → Pages → Source → GitHub Actions**.
3. The site appears at `https://jchandran-12.github.io/ansu/`.
