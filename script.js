const form = document.getElementById("attribution-form");
const plainOutput = document.getElementById("plain-output");
const markdownOutput = document.getElementById("markdown-output");
const tokenRow = document.getElementById("token-row");
const copyStatus = document.getElementById("copy-status");
const copyPlainButton = document.getElementById("copy-plain");
const copyMarkdownButton = document.getElementById("copy-markdown");
const downloadCardButton = document.getElementById("download-card");
const downloadButtonsPngButton = document.getElementById(
  "download-buttons-png",
);
const dateInput = document.getElementById("date-used");
const embeddedIconData = window.AI_ATLI_ICON_DATA || {};

if (dateInput && !dateInput.value) {
  dateInput.value = new Date().toISOString().slice(0, 10);
}

const iconMap = {
  "AI-OK": "icons/ai-ok_dark.png",
  "AI-NO": "icons/ai-no_dark.png",
  Brainstorming: "icons/ai-brainstorm_dark.png",
  Drafting: "icons/ai-draft_dark.png",
  Editing: "icons/ai-editing_dark.png",
  Coding: "icons/ai-code_dark.png",
};

function getSelectedCategories() {
  return Array.from(
    form.querySelectorAll('input[name="creationCategory"]:checked'),
  ).map((input) => input.value);
}

function formValue(name) {
  return form.elements[name]?.value?.trim() || "";
}

function buildOutput() {
  const workTitle = formValue("workTitle") || "Untitled work";
  const creatorName = formValue("creatorName") || "Unnamed creator";
  const context = formValue("context");
  const permission =
    form.querySelector('input[name="permission"]:checked')?.value || "AI-OK";
  const categories = getSelectedCategories();
  const toolName = formValue("toolName") || "Not specified";
  const modelName = formValue("modelName") || "Not specified";
  const dateUsed = formValue("dateUsed") || "Not specified";
  const audience = formValue("audience");
  const humanRole =
    formValue("humanRole") ||
    "The creator reviewed and validated the final work.";
  const notes = formValue("notes");

  const categoryText = categories.length
    ? categories.join(", ")
    : "None selected";
  const headerLine = `${workTitle} by ${creatorName}`;
  const contextLine = context ? `Context: ${context}` : "";
  const audienceLine = audience ? `Purpose: ${audience}.` : "";
  const notesLine = notes ? `Additional notes: ${notes}` : "";

  const plainText = [
    `AI-ATLI Attribution Statement`,
    headerLine,
    contextLine,
    `AI Permission: ${permission}`,
    `AI Creation Categories: ${categoryText}`,
    `AI Tool: ${toolName}`,
    `Model: ${modelName}`,
    `Date Used: ${dateUsed}`,
    audienceLine,
    `Human Role: ${humanRole}`,
    notesLine,
  ]
    .filter(Boolean)
    .join("\n");

  const markdownText = [
    `## AI-ATLI Attribution Statement`,
    ``,
    `**Work:** ${workTitle}`,
    `**Creator:** ${creatorName}`,
    context ? `**Context:** ${context}` : "",
    `**AI Permission:** ${permission}`,
    `**AI Creation Categories:** ${categoryText}`,
    `**AI Tool:** ${toolName}`,
    `**Model:** ${modelName}`,
    `**Date Used:** ${dateUsed}`,
    audience ? `**Purpose:** ${audience}` : "",
    `**Human Role:** ${humanRole}`,
    notes ? `**Additional Notes:** ${notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  renderTokens(permission, categories);
  plainOutput.textContent = plainText;
  markdownOutput.textContent = markdownText;
}

function getOutputData() {
  const permission =
    form.querySelector('input[name="permission"]:checked')?.value || "AI-OK";

  return {
    workTitle: formValue("workTitle") || "Untitled work",
    creatorName: formValue("creatorName") || "Unnamed creator",
    context: formValue("context"),
    permission,
    categories: getSelectedCategories(),
    toolName: formValue("toolName") || "Not specified",
    modelName: formValue("modelName") || "Not specified",
    dateUsed: formValue("dateUsed") || "Not specified",
    audience: formValue("audience"),
    humanRole:
      formValue("humanRole") ||
      "The creator reviewed and validated the final work.",
    notes: formValue("notes"),
  };
}

function renderTokens(permission, categories) {
  tokenRow.innerHTML = "";

  const permissionToken = document.createElement("span");
  permissionToken.className =
    `token ${permission === "AI-NO" ? "permission-no" : ""}`.trim();
  permissionToken.textContent = permission;
  tokenRow.appendChild(permissionToken);

  categories.forEach((category) => {
    const token = document.createElement("span");
    token.className = "token";
    token.textContent = category;
    tokenRow.appendChild(token);
  });

  if (!categories.length) {
    const emptyToken = document.createElement("span");
    emptyToken.className = "token";
    emptyToken.textContent = "No AI creation category selected";
    tokenRow.appendChild(emptyToken);
  }
}

async function copyOutput(source, label) {
  try {
    await navigator.clipboard.writeText(source.textContent);
    copyStatus.textContent = `${label} copied to clipboard.`;
  } catch {
    copyStatus.textContent = `Clipboard copy failed. Select and copy the ${label.toLowerCase()} manually.`;
  }
}

function fileSafeName(value) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "ai-atli-attribution"
  );
}

async function imageToDataUrl(path) {
  const image = Array.from(document.images).find(
    (img) => img.getAttribute("src") === path,
  );

  if (!image) {
    throw new Error(`Missing image for ${path}`);
  }

  if (!image.complete || !image.naturalWidth) {
    throw new Error(`Image not ready for ${path}`);
  }

  return image.currentSrc || image.src || path;
}

async function getIconSource(key) {
  if (embeddedIconData[key]) {
    return embeddedIconData[key];
  }

  return imageToDataUrl(iconMap[key]);
}

function loadImageElement(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Image not ready for ${source}`));
    image.src = source;
  });
}

async function downloadAttributionCard() {
  const data = getOutputData();
  const iconKeys = [data.permission, ...data.categories];
  const icons = await Promise.all(
    iconKeys.map(async (key) => ({
      label: key,
      src: await getIconSource(key),
    })),
  );

  const detailLines = [
    ["Context", data.context],
    ["AI Permission", data.permission],
    [
      "AI Creation Categories",
      data.categories.length ? data.categories.join(", ") : "None selected",
    ],
    ["AI Tool", data.toolName],
    ["Model", data.modelName],
    ["Date Used", data.dateUsed],
    ["Intended Use", data.audience],
    ["Human Role", data.humanRole],
    ["Additional Notes", data.notes],
  ].filter(([, value]) => value);

  const iconMarkup = icons
    .map(
      (icon) => `
    <div class="icon-chip">
      <img src="${icon.src}" alt="${icon.label}">
      <span>${icon.label}</span>
    </div>
  `,
    )
    .join("");

  const detailsMarkup = detailLines
    .map(
      ([label, value]) => `
    <div class="detail-row">
      <dt>${label}</dt>
      <dd>${value}</dd>
    </div>
  `,
    )
    .join("");

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AI-ATLI Attribution Card</title>
  <style>
    body {
      margin: 0;
      padding: 32px;
      font-family: "IBM Plex Sans", Arial, sans-serif;
      background: #f5eee3;
      color: #17211c;
    }
    .card {
      max-width: 840px;
      margin: 0 auto;
      background: #fffaf3;
      border: 1px solid rgba(23, 33, 28, 0.12);
      border-radius: 24px;
      padding: 28px;
    }
    .eyebrow {
      margin: 0 0 10px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #085a43;
    }
    h1 {
      margin: 0 0 12px;
      font-size: 34px;
      line-height: 1.05;
    }
    .subhead {
      margin: 0 0 20px;
      color: #5f675e;
      line-height: 1.6;
    }
    .icon-row {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 24px;
    }
    .icon-chip {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      border-radius: 999px;
      background: #e5f1ec;
      font-weight: 600;
      color: #085a43;
    }
    .icon-chip img {
      width: 34px;
      height: 34px;
      object-fit: contain;
    }
    dl {
      margin: 0;
    }
    .detail-row {
      padding: 12px 0;
      border-top: 1px solid rgba(23, 33, 28, 0.1);
    }
    dt {
      margin: 0 0 4px;
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #085a43;
    }
    dd {
      margin: 0;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <article class="card">
    <p class="eyebrow">AI-ATLI Attribution Statement</p>
    <h1>${data.workTitle}</h1>
    <p class="subhead">Prepared by ${data.creatorName}</p>
    <div class="icon-row">${iconMarkup}</div>
    <dl>${detailsMarkup}</dl>
  </article>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileSafeName(data.workTitle)}-ai-atli-card.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  copyStatus.textContent = "Attribution card downloaded.";
}

function roundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(
    x + width,
    y + height,
    x + width - radius,
    y + height,
  );
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

async function downloadButtonsPng() {
  const data = getOutputData();
  const labels = [data.permission, ...data.categories];
  const uniqueLabels = labels.filter(
    (label, index) => labels.indexOf(label) === index,
  );
  const icons = await Promise.all(
    uniqueLabels.map(async (label) => ({
      label,
      image: await loadImageElement(await getIconSource(label)),
    })),
  );

  const chipHeight = 72;
  const gap = 16;
  const padding = 24;
  const iconSize = 36;
  const minChipWidth = 190;

  const probeCanvas = document.createElement("canvas");
  const probeContext = probeCanvas.getContext("2d");
  probeContext.font = "600 20px 'IBM Plex Sans', Arial, sans-serif";

  const chipWidths = icons.map(({ label }) => {
    const measured = probeContext.measureText(label).width;
    return Math.max(minChipWidth, Math.ceil(measured + 94));
  });

  const width =
    chipWidths.reduce((sum, chipWidth) => sum + chipWidth, 0) +
    Math.max(icons.length - 1, 0) * gap +
    padding * 2;
  const height = chipHeight + padding * 2;
  const exportScale = Math.max(3, Math.ceil(window.devicePixelRatio || 1));

  const canvas = document.createElement("canvas");
  canvas.width = width * exportScale;
  canvas.height = height * exportScale;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const context = canvas.getContext("2d");

  context.scale(exportScale, exportScale);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.clearRect(0, 0, width, height);

  context.font = "600 20px 'IBM Plex Sans', Arial, sans-serif";
  context.textBaseline = "middle";

  let x = padding;
  icons.forEach(({ label, image }, index) => {
    const chipWidth = chipWidths[index];
    const y = padding;

    roundedRect(context, x, y, chipWidth, chipHeight, 36);
    context.fillStyle = label === "AI-NO" ? "#f2ddd0" : "#e5f1ec";
    context.fill();
    context.strokeStyle = "rgba(23, 33, 28, 0.08)";
    context.lineWidth = 1;
    context.stroke();

    context.drawImage(image, x + 16, y + 18, iconSize, iconSize);
    context.fillStyle = label === "AI-NO" ? "#8d3f10" : "#085a43";
    context.fillText(label, x + 66, y + chipHeight / 2);
    x += chipWidth + gap;
  });

  const dataUrl = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = `${fileSafeName(data.workTitle)}-ai-atli-buttons.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  copyStatus.textContent = "Button image downloaded as PNG.";
}

form.addEventListener("input", buildOutput);
copyPlainButton.addEventListener("click", () =>
  copyOutput(plainOutput, "Plain text"),
);
copyMarkdownButton.addEventListener("click", () =>
  copyOutput(markdownOutput, "Markdown"),
);
downloadCardButton.addEventListener("click", async () => {
  try {
    await downloadAttributionCard();
  } catch {
    copyStatus.textContent =
      "Download failed. Try again after the page finishes loading.";
  }
});
downloadButtonsPngButton.addEventListener("click", async () => {
  try {
    await downloadButtonsPng();
  } catch {
    copyStatus.textContent =
      "PNG download failed. Try again after the page finishes loading.";
  }
});

buildOutput();
