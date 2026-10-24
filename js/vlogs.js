(function () {
  "use strict";

  var CHANNEL_ID = "UCsjnV66huSgX10mbQRw9nOQ";
  var API_KEY = "AIzaSyDU3htLV0jIvPUZnA7qZ8ZAxuukqDq-oCE";
  var API_BASE = "https://www.googleapis.com/youtube/v3";
  var MAX_RECENT = 9;
  var CHANNEL_URL = "https://www.youtube.com/channel/" + CHANNEL_ID;

  var gridEl = document.getElementById("vlogGrid");
  var playerEl = document.getElementById("vlogPlayer");
  var posterEl = document.getElementById("vlogPoster");
  var posterImg = document.getElementById("vlogPosterImg");
  var titleEl = document.getElementById("vlogLatestTitle");
  var metaEl = document.getElementById("vlogLatestMeta");
  var descEl = document.getElementById("vlogLatestDesc");
  var watchEl = document.getElementById("vlogLatestWatch");
  var introEl = document.getElementById("vlogIntro");
  var statusEl = document.getElementById("vlogStatus");

  var featuredId = "";
  var featuredTitle = "Latest video";

  function thumbUrl(id, big) {
    return "https://i.ytimg.com/vi/" + id + "/" + (big ? "maxresdefault" : "mqdefault") + ".jpg";
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str == null ? "" : str;
    return div.innerHTML;
  }

  function formatDate(str) {
    var d = new Date(str);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  function formatViews(count) {
    var n = Number(count);
    if (!n) return "";
    return n.toLocaleString() + " views";
  }

  function showStatus(msg) {
    statusEl.textContent = msg;
    statusEl.classList.remove("hidden");
  }

  function hideStatus() {
    statusEl.classList.add("hidden");
  }

  // ---- API ----
  async function callApi(path) {
    var res = await fetch(API_BASE + path + "&key=" + API_KEY);
    if (!res.ok) {
      var detail = "";
      try {
        var data = await res.json();
        detail = (data && data.error && data.error.message) || "";
      } catch (e) { }
      throw new Error("HTTP " + res.status + " " + detail);
    }
    return res.json();
  }

  function renderSkeletons() {
    if (!gridEl) return;
    var html = "";
    for (var i = 0; i < 6; i++) {
      html +=
        '<div class="vcard is-loading">' +
        '<div class="vcard-media"></div>' +
        '<div class="vcard-body">' +
        '<span class="skeleton-line"></span>' +
        '<span class="skeleton-line short"></span>' +
        "</div>" +
        "</div>";
    }
    gridEl.innerHTML = html;
  }

  function renderFeatured(video) {
    if (!video) return;
    featuredId = video.id;
    featuredTitle = video.snippet.title || "Latest video";

    posterImg.onerror = function () {
      this.onerror = null;
      this.src = thumbUrl(featuredId, false);
    };
    posterImg.src = thumbUrl(featuredId, true);
    posterImg.alt = featuredTitle;

    titleEl.textContent = featuredTitle;
    metaEl.textContent = [formatDate(video.snippet.publishedAt), formatViews(video.statistics && video.statistics.viewCount)]
      .filter(Boolean)
      .join(" · ");
    descEl.textContent = video.snippet.description || "";

    var url = "https://www.youtube.com/watch?v=" + featuredId;
    watchEl.href = url;
  }

  function embedFeatured() {
    if (!featuredId || !playerEl) return;
    var iframe = document.createElement("iframe");
    iframe.src = "https://www.youtube.com/embed/" + featuredId + "?autoplay=1&rel=0";
    iframe.title = featuredTitle;
    iframe.setAttribute("allowfullscreen", "");
    iframe.setAttribute("allow", "accelerated-encoding; autoplay; encrypted-media; picture-in-picture; fullscreen");
    playerEl.appendChild(iframe);
    posterEl.classList.add("hidden");
  }

  function renderGrid(videos) {
    if (!gridEl) return;
    gridEl.innerHTML = "";
    videos.slice(0, MAX_RECENT).forEach(function (video, i) {
      var id = video.id;
      var title = video.snippet.title || "Untitled";
      var views = formatViews(video.statistics && video.statistics.viewCount);
      var card = document.createElement("a");
      card.className = "vcard entering";
      card.href = "https://www.youtube.com/watch?v=" + id;
      card.target = "_blank";
      card.rel = "noopener";
      card.style.animationDelay = i * 60 + "ms";
      card.innerHTML =
        '<div class="vcard-media">' +
        '<img loading="lazy" src="' + thumbUrl(id, true) + '" alt="' + escapeHtml(title) + '" ' +
        "onerror=\"this.onerror=null;this.src='" + thumbUrl(id, false) + "'\">" +
        '<span class="vcard-play"><i class="fa-solid fa-play"></i></span>' +
        "</div>" +
        '<div class="vcard-body">' +
        '<span class="vcard-title">' + escapeHtml(title) + "</span>" +
        '<span class="vcard-meta">' +
        [formatDate(video.snippet.publishedAt), views].filter(Boolean).join(" · ") +
        "</span>" +
        "</div>";
      gridEl.appendChild(card);
    });
  }

  async function load() {
    renderSkeletons();
    showStatus("Loading videos…");

    try {
      var channel = await callApi(
        "/channels?part=snippet,statistics,contentDetails&id=" + CHANNEL_ID
      );
      var c = channel.items && channel.items[0];
      if (!c) throw new Error("Channel not found");

      var desc = ((c.snippet && c.snippet.description) || "").split("\n")[0].trim();
      if (introEl && desc.length > 20) introEl.textContent = desc;

      var uploadsId = c.contentDetails && c.contentDetails.relatedPlaylists && c.contentDetails.relatedPlaylists.uploads;
      if (!uploadsId) throw new Error("No uploads playlist");

      var playlist = await callApi(
        "/playlistItems?part=snippet&playlistId=" + uploadsId + "&maxResults=" + (MAX_RECENT + 2)
      );
      var items = (playlist.items || []).filter(function (i) {
        return i.snippet && i.snippet.resourceId && i.snippet.resourceId.videoId;
      });
      if (!items.length) throw new Error("No videos found");

      var ids = items.map(function (i) {
        return i.snippet.resourceId.videoId;
      });
      var videosRes = await callApi("/videos?part=snippet,statistics,status&id=" + ids.join(","));
      var byId = {};
      (videosRes.items || []).forEach(function (v) {
        byId[v.id] = v;
      });

      var videos = items.map(function (i) {
        var id = i.snippet.resourceId.videoId;
        var full = byId[id] || {};
        return {
          id: id,
          snippet: full.snippet || i.snippet,
          statistics: full.statistics,
          status: full.status,
        };
      });

      var embeddable = videos.filter(function (v) {
        return !v.status || v.status.embeddable !== false;
      });
      renderFeatured(embeddable[0] || videos[0]);
      renderGrid(videos);
      hideStatus();
    } catch (err) {
      console.error(err);
      if (gridEl) gridEl.innerHTML = "";
      showStatus("Couldn't load videos right now. Tap “View All” to watch on YouTube.");
    }
  }

  if (posterEl) {
    posterEl.addEventListener("click", embedFeatured);
  }

  load();
})();
