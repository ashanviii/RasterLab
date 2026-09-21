# Effect thumbnails

Drop your own thumbnail images in this folder (e.g. `ascii-studio.png`). Anything here is
served as a static file at `/thumbnails/<filename>`.

To use one, set `thumbnailImage` on the matching shader entry in `src/shaders/registry.ts`:

```ts
{
  id: 'ascii-studio',
  name: 'ASCII Studio',
  thumbnail: 'from-cyan-200 via-fuchsia-400 to-neutral-950', // fallback gradient, still required
  thumbnailImage: '/thumbnails/ascii-studio.png',
  ...
}
```

When `thumbnailImage` is set, it replaces the live-rendered preview on that effect's card in the
left panel. Square images work best (the card crops to a 1:1 aspect ratio).
