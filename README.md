# Music TV Panel (yt-dlp + sqlite3)

Node.js panel + scheduler for a 24/7 music video TV channel with:

- HLS output via ffmpeg
- Now playing text embedded in video
- Logo overlay (PNG)
- Idents every N tracks
- Playlists with drag-and-drop ordering
- Simple login protection (single admin user)
- Uses `sqlite` + `sqlite3` (async/await)
- **Imports videos with `yt-dlp` from YouTube URLs**
- Saves files as `media/Artist/Track.mp4`

## Status Overview

Below is a quick overview of what features are currently **working** and which are **not working / experimental**.

| Feature                           | Status           | Notes |
|----------------------------------|------------------|-------|
| Video import via yt-dlp          | ✅ Working       | Supports YouTube URLs, automatic metadata extraction. |
| Video storage (media/Artist/)    | ✅ Working       | Filename auto‑sanitised. |
| SQLite database integration      | ✅ Working       | Stores title, artist, year, genre, path, ident flag, etc. |
| Media page pagination            | ✅ Working       | 25 items per page, server‑side filters. |
| Search + filters                 | ✅ Working       | Search by title/artist/year/genre + Ident filter. |
| Live import log streaming        | ✅ Working       | Uses chunked responses to update modal in real time. |
| Now Playing overlay in ffmpeg    | ⚠️ Partially Working | Basic text works; advanced animation still experimental. |
| Logo overlay (PNG)               | ✅ Working       | Uses ffmpeg filter_complex. |
| Scheduler continuous playback    | ⚠️ Unstable      | Occasional FFmpeg stall depending on input file timing. |
| No‑repeat rule (time‑based)      | ⚠️ Partially Working | Basic repeat‑avoidance works; advanced logic pending. |
| HLS output                       | ⚠️ Working with caveats | Depends on ffmpeg stability & config. |
| Ident playback                   | ✅ Working       | Plays ident every N tracks. |
| Login system                     | ✅ Working       | Single admin account. |
| Web UI modals                    | ⚠️ Improving     | Add‑modal stable; edit/delete modals still pending. |
| Multi‑playlist support           | ❌ Not implemented | Planned enhancement. |
| Drag‑and‑drop playlist ordering  | ❌ Not implemented | UI stub exists but backend not built. |
| Full scheduling logic (rotation) | ❌ Not implemented | Currently simple sequential rotation only. |

---

## Requirements

- Node.js 18+
- ffmpeg installed and on PATH
- `yt-dlp` installed and on PATH (or configure `YTDLP_BIN` in `.env`)
- A `logo.png` file in project root

## Setup

```bash
cp .env.example .env
# edit .env with your settings (MEDIA_ROOT, admin user/pass, etc.)
npm install
mkdir -p media hls engine overlay
```

Place your assets:

- `logo.png` in project root (transparent PNG logo)

## Import videos (yt-dlp)

Run the panel:

```bash
npm start
```

Then:

1. Go to `http://localhost:4456`
2. First setup will create you an account then login
3. Click **Media** in the top bar
4. Paste a YouTube URL and submit

The app will:

- Call `yt-dlp` to fetch metadata
- Derive:
  - `artist` (yt-dlp artist / channel / from title)
  - `title` (track/title)
  - `year` from upload date
  - `genre` from categories/tags
  - `duration` from metadata
- Download the video into:
  - `media/Artist/Track.mp4`
- Insert a row into `panel.sqlite`

## Playout

The scheduler:

- Picks videos from the DB
- Writes a concat playlist and nowplaying.txt
- Spawns ffmpeg to output HLS segments + `stream.m3u8` into `./hls`

Access stream at:

```
http://your-server:4456/public/hls/stream.m3u8
```

## Notes

- Current scheduler is simple rotation with idents every 4 tracks.
- To mark a video as an ident, toggle the **Ident?** checkbox in the dashboard.
- For production, consider:
  - Strong `SESSION_SECRET`
  - Reverse proxy (nginx) in front
  - IP/VPN restriction for admin access
