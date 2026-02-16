(function () {
  "use strict";

  var script =
    document.currentScript ||
    document.querySelector("script[data-project-id]");
  if (!script) return;

  var projectId = script.getAttribute("data-project-id");
  if (!projectId) return;

  var fallbackColor = script.getAttribute("data-color") || "#5865F2";
  var position = script.getAttribute("data-position") || "bottom-right";
  var baseUrl = script.src.replace(/\/embed\.js.*$/, "");

  var isOpen = false;
  var container = document.createElement("div");
  container.id = "bridgecord-widget";
  document.body.appendChild(container);

  // Shape helpers
  function bubbleRadius(shape) {
    switch (shape) {
      case "sharp": return "0px";
      case "pill": return "28px";
      case "cloud": return "28px 28px 6px 28px";
      default: return "16px";
    }
  }
  function frameRadius(shape) {
    switch (shape) {
      case "sharp": return "0px";
      case "pill": return "24px";
      default: return "12px";
    }
  }

  // Default config
  var cfg = { primaryColor: fallbackColor, bubbleShape: "rounded", position: position };

  // Fetch widget config from API
  function applyConfig(c) {
    cfg = c;
    var color = c.primaryColor || fallbackColor;
    var shape = c.bubbleShape || "rounded";
    if (c.position) position = c.position;

    // Update bubble
    bubble.style.backgroundColor = color;
    bubble.style.borderRadius = bubbleRadius(shape);

    // Update frame container
    frameContainer.style.borderRadius = frameRadius(shape);

    // Update position
    container.style.left = position === "bottom-left" ? "20px" : "auto";
    container.style.right = position === "bottom-left" ? "auto" : "20px";
    frameContainer.style.left = position === "bottom-left" ? "0" : "auto";
    frameContainer.style.right = position === "bottom-left" ? "auto" : "0";
  }

  fetch(baseUrl + "/api/widget/" + projectId + "/config")
    .then(function (res) { return res.json(); })
    .then(function (data) { applyConfig(data); })
    .catch(function () { /* use defaults */ });

  // Styles (shapes applied dynamically)
  var style = document.createElement("style");
  style.textContent =
    "#bridgecord-widget{position:fixed;bottom:20px;z-index:2147483647;font-family:system-ui,-apple-system,sans-serif}" +
    (position === "bottom-left"
      ? "#bridgecord-widget{left:20px}"
      : "#bridgecord-widget{right:20px}") +
    "#bridgecord-bubble{width:56px;height:56px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.15);transition:transform .2s,box-shadow .2s,border-radius .3s}" +
    "#bridgecord-bubble:hover{transform:scale(1.1);box-shadow:0 6px 20px rgba(0,0,0,0.25)}" +
    "#bridgecord-bubble svg{width:24px;height:24px;color:#fff}" +
    "#bridgecord-frame-container{display:none;position:absolute;bottom:72px;width:380px;height:520px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.3);transition:border-radius .3s;animation:bridgecord-slide-up .25s ease-out}" +
    (position === "bottom-left"
      ? "#bridgecord-frame-container{left:0}"
      : "#bridgecord-frame-container{right:0}") +
    "#bridgecord-frame-container.open{display:block}" +
    "#bridgecord-frame{width:100%;height:100%;border:none}" +
    "@keyframes bridgecord-slide-up{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}" +
    "@media(max-width:440px){#bridgecord-frame-container{width:calc(100vw - 40px);height:calc(100vh - 120px)}}";
  document.head.appendChild(style);

  // Chat bubble button
  var bubble = document.createElement("button");
  bubble.id = "bridgecord-bubble";
  bubble.style.backgroundColor = fallbackColor;
  bubble.style.borderRadius = bubbleRadius("rounded");
  bubble.setAttribute("aria-label", "Open chat");
  bubble.innerHTML =
    '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">' +
    '<path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />' +
    "</svg>";
  container.appendChild(bubble);

  // Iframe container
  var frameContainer = document.createElement("div");
  frameContainer.id = "bridgecord-frame-container";
  frameContainer.style.borderRadius = frameRadius("rounded");
  container.appendChild(frameContainer);

  // Iframe (lazy loaded on first open)
  var frameLoaded = false;

  bubble.addEventListener("click", function () {
    isOpen = !isOpen;

    if (isOpen) {
      frameContainer.classList.add("open");
      bubble.innerHTML =
        '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">' +
        '<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />' +
        "</svg>";

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
      bubble.innerHTML =
        '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">' +
        '<path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />' +
        "</svg>";
    }
  });
})();
