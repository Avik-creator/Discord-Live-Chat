(function () {
  "use strict";

  var script =
    document.currentScript ||
    document.querySelector("script[data-project-id]");
  if (!script) return;

  var projectId = script.getAttribute("data-project-id");
  if (!projectId) return;

  var fallbackColor = script.getAttribute("data-color") || "#5865F2";
  var fallbackPosition = script.getAttribute("data-position") || "bottom-right";
  var fallbackShape = script.getAttribute("data-shape") || "rounded";
  var baseUrl = script.src.replace(/\/embed\.js.*$/, "");

  // Shape helpers
  function bubbleRadius(shape) {
    switch (shape) {
      case "sharp":   return "4px";
      case "pill":    return "28px";
      case "cloud":   return "28px 28px 6px 28px";
      case "rounded": return "16px";
      default:        return "16px";
    }
  }
  function frameRadius(shape) {
    switch (shape) {
      case "sharp": return "0px";
      case "pill":  return "24px";
      default:      return "12px";
    }
  }

  var isOpen = false;

  // --- Container (hidden until config loads) ---
  var container = document.createElement("div");
  container.id = "bridgecord-widget";
  container.style.cssText =
    "position:fixed;bottom:20px;z-index:2147483647;font-family:system-ui,-apple-system,sans-serif;opacity:0;transition:opacity .3s ease;" +
    (fallbackPosition === "bottom-left" ? "left:20px;" : "right:20px;");
  document.body.appendChild(container);

  // --- Global styles ---
  var style = document.createElement("style");
  style.textContent =
    "#bridgecord-bubble{width:56px;height:56px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,.15);transition:transform .2s,box-shadow .2s,border-radius .3s,background-color .3s;}" +
    "#bridgecord-bubble:hover{transform:scale(1.08);box-shadow:0 6px 20px rgba(0,0,0,.25)}" +
    "#bridgecord-bubble:active{transform:scale(.96)}" +
    "#bridgecord-bubble svg{width:24px;height:24px;color:#fff;transition:transform .2s}" +
    "#bridgecord-frame-container{display:none;position:absolute;bottom:72px;width:380px;height:520px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,.3);transition:border-radius .3s;animation:bridgecord-up .25s ease-out}" +
    "#bridgecord-frame-container.open{display:block}" +
    "#bridgecord-frame{width:100%;height:100%;border:none}" +
    "@keyframes bridgecord-up{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}" +
    "@media(max-width:440px){#bridgecord-frame-container{width:calc(100vw - 40px);height:calc(100vh - 120px)}}";
  document.head.appendChild(style);

  // --- Chat bubble button ---
  var chatIcon =
    '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">' +
    '<path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />' +
    "</svg>";
  var closeIcon =
    '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">' +
    '<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />' +
    "</svg>";

  var bubble = document.createElement("button");
  bubble.id = "bridgecord-bubble";
  bubble.setAttribute("aria-label", "Open chat");
  bubble.innerHTML = chatIcon;
  container.appendChild(bubble);

  // --- Iframe container ---
  var frameContainer = document.createElement("div");
  frameContainer.id = "bridgecord-frame-container";
  container.appendChild(frameContainer);

  var frameLoaded = false;

  // --- Apply config to all elements ---
  function applyConfig(color, shape, pos) {
    // Bubble
    bubble.style.backgroundColor = color;
    bubble.style.borderRadius = bubbleRadius(shape);

    // Frame
    frameContainer.style.borderRadius = frameRadius(shape);

    // Position
    container.style.left  = pos === "bottom-left" ? "20px" : "auto";
    container.style.right = pos === "bottom-left" ? "auto" : "20px";
    frameContainer.style.left  = pos === "bottom-left" ? "0" : "auto";
    frameContainer.style.right = pos === "bottom-left" ? "auto" : "0";
  }

  // --- Fetch config, then show ---
  function show() {
    container.style.opacity = "1";
  }

  fetch(baseUrl + "/api/widget/" + projectId + "/config")
    .then(function (res) { return res.json(); })
    .then(function (data) {
      applyConfig(
        data.primaryColor || fallbackColor,
        data.bubbleShape  || fallbackShape,
        data.position     || fallbackPosition
      );
      show();
    })
    .catch(function () {
      // API unavailable — use fallback attrs and show anyway
      applyConfig(fallbackColor, fallbackShape, fallbackPosition);
      show();
    });

  // --- Toggle ---
  bubble.addEventListener("click", function () {
    isOpen = !isOpen;

    if (isOpen) {
      frameContainer.classList.add("open");
      bubble.innerHTML = closeIcon;

      if (!frameLoaded) {
        var iframe = document.createElement("iframe");
        iframe.id = "bridgecord-frame";
        iframe.src = baseUrl + "/widget/" + projectId;
        iframe.setAttribute("title", "Bridgecord Chat");
        frameContainer.appendChild(iframe);
        frameLoaded = true;
      }
    } else {
      frameContainer.classList.remove("open");
      bubble.innerHTML = chatIcon;
    }
  });
})();
