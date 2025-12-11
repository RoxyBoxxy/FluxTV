import fetch from "node-fetch";
import dbPromise from "./db.js";

let settingsCache = {};

async function loadSettings() {
  const db = await dbPromise;
  const rows = await db.all("SELECT key, value FROM settings");
  settingsCache = {};
  for (const r of rows) {
    settingsCache[r.key] = r.value;
  }
}
await loadSettings()
//console.log(settingsCache)
const LASTFM_API_KEY = settingsCache.lastFMKey;

export async function fetchYearAndGenre(artist, title, yt_year) {
  let year = null;
  let genre = null;

  try {
    //
    // 1️⃣ PRIMARY YEAR LOOKUP — MusicBrainz exact search
    //
    const mbExactUrl = `https://musicbrainz.org/ws/2/recording/?query=recording:${encodeURIComponent(
      title
    )}%20AND%20artist:${encodeURIComponent(artist)}&fmt=json&limit=1`;

    let mbRes = await fetch(mbExactUrl, {
      headers: { "User-Agent": "Music-TV-Panel/1.0 (rox.dev)" }
    });
    let mbData = await mbRes.json();

    //
    // If no exact match, retry fuzzy search
    //
    if (!mbData.recordings?.length) {
      const mbFuzzyUrl = `https://musicbrainz.org/ws/2/recording/?query=${encodeURIComponent(
        `${title} ${artist}`
      )}&fmt=json&limit=1`;

      mbRes = await fetch(mbFuzzyUrl, {
        headers: { "User-Agent": "Music-TV-Panel/1.0 (rox.dev)" }
      });
      mbData = await mbRes.json();
    }

    //
    // Extract year from recording or release
    //
    if (mbData.recordings?.length) {
      const rec = mbData.recordings[0];

      const release = rec.releases?.[0];
      if (release?.date) {
        year = parseInt(release.date.substring(0, 4));
      }

      // Look inside release-group as backup
      if (!year && rec["release-groups"]?.length) {
        const rg = rec["release-groups"][0];
        if (rg["first-release-date"]) {
          year = parseInt(rg["first-release-date"].substring(0, 4));
        }
      }
    }

    //
    // 2️⃣ GENRE LOOKUP — Last.fm priority: track → album → artist
    //
    if (LASTFM_API_KEY) {
      //
      // Track-level tags
      //
      const lfTrackUrl =
        `https://ws.audioscrobbler.com/2.0/?method=track.getInfo` +
        `&api_key=${LASTFM_API_KEY}` +
        `&artist=${encodeURIComponent(artist)}` +
        `&track=${encodeURIComponent(title)}` +
        `&format=json`;

      let lfRes = await fetch(lfTrackUrl);
      let lfData = await lfRes.json();

      let tags = lfData.track?.toptags?.tag;
      if (Array.isArray(tags) && tags.length > 0) {
        genre = tags[0].name.toLowerCase();
      }

      //
      // Album-level fallback
      //
      if (!genre && lfData.track?.album?.artist && lfData.track?.album?.title) {
        const albumArtist = lfData.track.album.artist;
        const albumTitle = lfData.track.album.title;

        const lfAlbumUrl =
          `https://ws.audioscrobbler.com/2.0/?method=album.getInfo` +
          `&api_key=${LASTFM_API_KEY}` +
          `&artist=${encodeURIComponent(albumArtist)}` +
          `&album=${encodeURIComponent(albumTitle)}` +
          `&format=json`;

        lfRes = await fetch(lfAlbumUrl);
        lfData = await lfRes.json();

        tags = lfData.album?.toptags?.tag;
        if (Array.isArray(tags) && tags.length > 0) {
          genre = tags[0].name.toLowerCase();
        }
      }

      //
      // Artist-level fallback
      //
      if (!genre) {
        const lfArtistUrl =
          `https://ws.audioscrobbler.com/2.0/?method=artist.getInfo` +
          `&api_key=${LASTFM_API_KEY}` +
          `&artist=${encodeURIComponent(artist)}` +
          `&format=json`;

        lfRes = await fetch(lfArtistUrl);
        lfData = await lfRes.json();

        tags = lfData.artist?.tags?.tag;
        if (Array.isArray(tags) && tags.length > 0) {
          genre = tags[0].name.toLowerCase();
        }
      }
    }

    //
    // 3️⃣ Manual fallback genre hints
    //
    if (!genre) {
      const manualMap = [
        { match: /hellhills/i, genre: "metalcore" },
        { match: /headwreck/i, genre: "metalcore" },
        { match: /paleface/i, genre: "deathcore" },
        { match: /lorna\s*shore/i, genre: "deathcore" },
        { match: /sleep token/i, genre: "alternative metal" },
        { match: /ic3peak/i, genre: "electronic" },
        { match: /ghostmane/i, genre: "trap metal" }
      ];

      for (const rule of manualMap) {
        if (rule.match.test(artist)) {
          genre = rule.genre;
          break;
        }
      }
    }

    //
    // 4️⃣ Default fallback
    //
    if (!genre) genre = "unknown";
    if (!year) year = yt_year;

    return { year, genre };
  } catch (err) {
    console.error("Metadata lookup failed:", err);
    return { year: null, genre: "unknown" };
  }
}