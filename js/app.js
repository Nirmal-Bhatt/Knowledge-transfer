const STORAGE_KEY = "kts_knowledge_entries";

const seedData = [
  {
    id: crypto.randomUUID(),
    title: "Annual Hackathon Workflow",
    author: "Previous Technical Lead",
    category: "Event",
    tags: ["hackathon", "workflow", "technical"],
    description: "Step-by-step process followed to conduct the annual technical hackathon.",
    content: "1. Finalize problem statements and judging criteria.\n2. Create registration and communication material.\n3. Prepare the technical infrastructure.\n4. Conduct the event and record issues.\n5. Archive results, source files and feedback for the next team.",
    createdAt: "2026-09-18T10:30:00.000Z",
    updatedAt: "2026-09-18T10:30:00.000Z"
  },
  {
    id: crypto.randomUUID(),
    title: "Club Website Deployment Guide",
    author: "Web Team",
    category: "Guide",
    tags: ["website", "github", "deployment"],
    description: "Basic deployment checklist for the organization's frontend website.",
    content: "Check the production build, verify asset paths, push the final code to the repository and confirm the deployed URL. Keep repository access details with the admin rather than inside documentation.",
    createdAt: "2026-09-12T08:15:00.000Z",
    updatedAt: "2026-09-12T08:15:00.000Z"
  },
  {
    id: crypto.randomUUID(),
    title: "Previous Project Lessons Learned",
    author: "Project Coordinator",
    category: "Lesson",
    tags: ["project", "lessons", "planning"],
    description: "Important observations that can help future teams avoid common project problems.",
    content: "Define responsibilities before development starts. Maintain one shared source for documentation. Test features with actual users before the final presentation and archive the final version after submission.",
    createdAt: "2026-08-30T12:00:00.000Z",
    updatedAt: "2026-08-30T12:00:00.000Z"
  }
];

let entries = loadEntries();
let editingId = null;

const $ = id => document.getElementById(id);

function loadEntries() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try { return JSON.parse(saved); } catch (_) {}
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData));
  return [...seedData];
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[char]));
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en-IN", {
    day:"2-digit", month:"short", year:"numeric"
  }).format(new Date(date));
}

function render() {
  const query = $("searchInput").value.trim().toLowerCase();
  const category = $("categoryFilter").value;
  const sort = $("sortSelect").value;

  let filtered = entries.filter(item => {
    const searchable = [
      item.title, item.author, item.category, item.description,
      item.content, ...(item.tags || [])
    ].join(" ").toLowerCase();
    return (!query || searchable.includes(query)) &&
           (category === "All" || item.category === category);
  });

  filtered.sort((a,b) => {
    if (sort === "az") return a.title.localeCompare(b.title);
    if (sort === "za") return b.title.localeCompare(a.title);
    const diff = new Date(b.updatedAt) - new Date(a.updatedAt);
    return sort === "newest" ? diff : -diff;
  });

  $("knowledgeGrid").innerHTML = filtered.map(cardHTML).join("");
  $("emptyState").classList.toggle("hidden", filtered.length !== 0);
  $("resultCount").textContent = `${filtered.length} ${filtered.length === 1 ? "entry" : "entries"}`;

  $("totalCount").textContent = entries.length;
  $("projectCount").textContent = entries.filter(x => x.category === "Project").length;
  $("eventCount").textContent = entries.filter(x => x.category === "Event").length;
  $("guideCount").textContent = entries.filter(x => x.category === "Guide").length;
}

function cardHTML(item) {
  const tags = (item.tags || []).map(tag => `<span class="tag">#${escapeHTML(tag)}</span>`).join("");
  const preview = escapeHTML(item.description);
  return `
    <article class="card">
      <div class="card-top"><span class="badge">${escapeHTML(item.category)}</span></div>
      <h3>${escapeHTML(item.title)}</h3>
      <p class="card-desc">${preview}</p>
      <div class="tags">${tags}</div>
      <div class="card-meta">
        <span>By ${escapeHTML(item.author)}</span>
        <span>${formatDate(item.updatedAt)}</span>
      </div>
      <div class="actions">
        <button class="small-btn" onclick="viewEntry('${item.id}')">View</button>
        <button class="small-btn" onclick="editEntry('${item.id}')">Edit</button>
        <button class="small-btn delete-btn" onclick="deleteEntry('${item.id}')">Delete</button>
      </div>
    </article>`;
}

function openModal(entry = null) {
  editingId = entry?.id || null;
  $("modalEyebrow").textContent = entry ? "Edit Entry" : "New Entry";
  $("modalTitle").textContent = entry ? "Update Knowledge" : "Add Knowledge";
  $("entryId").value = entry?.id || "";
  $("title").value = entry?.title || "";
  $("author").value = entry?.author || "";
  $("category").value = entry?.category || "";
  $("tags").value = (entry?.tags || []).join(", ");
  $("description").value = entry?.description || "";
  $("content").value = entry?.content || "";
  $("knowledgeModal").classList.remove("hidden");
  $("knowledgeModal").setAttribute("aria-hidden", "false");
  $("title").focus();
}

function closeModal() {
  $("knowledgeModal").classList.add("hidden");
  $("knowledgeModal").setAttribute("aria-hidden", "true");
  $("knowledgeForm").reset();
  editingId = null;
}

$("knowledgeForm").addEventListener("submit", event => {
  event.preventDefault();

  const now = new Date().toISOString();
  const data = {
    title: $("title").value.trim(),
    author: $("author").value.trim(),
    category: $("category").value,
    tags: $("tags").value.split(",").map(x => x.trim()).filter(Boolean),
    description: $("description").value.trim(),
    content: $("content").value.trim()
  };

  if (editingId) {
    const index = entries.findIndex(x => x.id === editingId);
    entries[index] = { ...entries[index], ...data, updatedAt: now };
    showToast("Knowledge updated successfully.");
  } else {
    entries.unshift({
      id: crypto.randomUUID(),
      ...data,
      createdAt: now,
      updatedAt: now
    });
    showToast("Knowledge created successfully.");
  }

  persist();
  render();
  closeModal();
});

window.viewEntry = id => {
  const item = entries.find(x => x.id === id);
  if (!item) return;
  alert(
    `${item.title}\n\n` +
    `Category: ${item.category}\nContributor: ${item.author}\n\n` +
    `${item.description}\n\n` +
    `Detailed Knowledge:\n${item.content}`
  );
};

window.editEntry = id => {
  const item = entries.find(x => x.id === id);
  if (item) openModal(item);
};

window.deleteEntry = id => {
  const item = entries.find(x => x.id === id);
  if (!item) return;
  if (!confirm(`Delete "${item.title}"? This action cannot be undone.`)) return;
  entries = entries.filter(x => x.id !== id);
  persist();
  render();
  showToast("Knowledge deleted.");
};

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

$("addKnowledgeBtn").addEventListener("click", () => openModal());
$("emptyAddBtn").addEventListener("click", () => openModal());
$("closeModalBtn").addEventListener("click", closeModal);
$("cancelBtn").addEventListener("click", closeModal);
$("searchInput").addEventListener("input", render);
$("categoryFilter").addEventListener("change", render);
$("sortSelect").addEventListener("change", render);

$("knowledgeModal").addEventListener("click", event => {
  if (event.target === $("knowledgeModal")) closeModal();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !$("knowledgeModal").classList.contains("hidden")) {
    closeModal();
  }
});

render();
