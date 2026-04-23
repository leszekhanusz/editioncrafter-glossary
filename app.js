// Default empty state
const defaultState = {
  title: "",
  citation: "",
  entries: {}
};

// Global State
let glossary = JSON.parse(localStorage.getItem('editioncrafter_glossary')) || structuredClone(defaultState);
let currentTermKey = null;
let searchTimeout = null;
let searchQuery = "";
let sortAlphabetically = localStorage.getItem('editioncrafter_sort_alpha') !== 'false';

// DOM Elements
const termListEl = document.getElementById('entries-list');
const termCountEl = document.getElementById('term-count');
const sidebarTitleText = document.getElementById('sidebar-title-text');
const termEditorEl = document.getElementById('term-editor');
const metadataEditorEl = document.getElementById('metadata-editor');
const btnShowMetadata = document.getElementById('btn-show-metadata');
const btnAddTerm = document.getElementById('btn-add-term');
const btnClearSearch = document.getElementById('btn-clear-search');
const btnDeleteTerm = document.getElementById('btn-delete-term');
const btnAddMeaning = document.getElementById('btn-add-meaning');
const meaningsContainer = document.getElementById('meanings-container');

// Metadata fields
const titleInput = document.getElementById('glossary-title');
const citationInput = document.getElementById('glossary-citation');
const titlePreview = document.getElementById('glossary-title-preview');
const citationPreview = document.getElementById('glossary-citation-preview');

// Term fields
const fieldTermKey = document.getElementById('term-key');
const fieldHeadword = document.getElementById('term-headword');
const fieldAltSpelling = document.getElementById('term-alternateSpellings');
const fieldModernSpelling = document.getElementById('term-modernSpelling');
const fieldAntonym = document.getElementById('term-antonym');
const fieldSynonym = document.getElementById('term-synonym');
const fieldSeeAlso = document.getElementById('term-seeAlso');

// Search
const globalSearch = document.getElementById('global-search');

// Buttons & Actions
const btnImport = document.getElementById('btn-import');
const fileImport = document.getElementById('file-import');
const btnExport = document.getElementById('btn-export');
const btnSettings = document.getElementById('btn-settings');
const btnCloseSettings = document.getElementById('btn-close-settings');
const settingsModal = document.getElementById('settings-modal');
const toggleSortAlpha = document.getElementById('setting-sort-alpha');
const btnResetData = document.getElementById('btn-reset-data');
const dropOverlay = document.getElementById('drop-overlay');

// Initialize
function init() {
  // Metadata init
  titleInput.value = glossary.title || '';
  citationInput.value = glossary.citation || '';
  updateMarkdown(titleInput, titlePreview);
  updateMarkdown(citationInput, citationPreview);
  
  // Settings init
  toggleSortAlpha.checked = sortAlphabetically;

  renderSidebar();
  setupEventListeners();
  setupTooltips();
  setupDragAndDrop();
}

function saveState() {
  localStorage.setItem('editioncrafter_glossary', JSON.stringify(glossary));
}

// Markdown Preview
function updateMarkdown(inputEl, previewEl) {
  // Use marked.js if available
  if (typeof marked !== 'undefined') {
    previewEl.innerHTML = marked.parse(inputEl.value || '*No content*');
  } else {
    previewEl.textContent = inputEl.value;
  }
}

// Render Sidebar List
function renderSidebar() {
  termListEl.innerHTML = '';
  
  let entries = Object.keys(glossary.entries);
  
  // Apply Search Filter
  if (searchQuery) {
    sidebarTitleText.textContent = 'Filtered Terms';
    btnAddTerm.classList.add('hidden');
    btnClearSearch.classList.remove('hidden');
    const q = searchQuery.toLowerCase();
    entries = entries.filter(key => {
      if (key.toLowerCase().includes(q)) return true;
      const term = glossary.entries[key];
      if (term.headword && term.headword.toLowerCase().includes(q)) return true;
      if (term.alternateSpellings && term.alternateSpellings.toLowerCase().includes(q)) return true;
      if (term.modernSpelling && term.modernSpelling.toLowerCase().includes(q)) return true;
      // Search in meanings
      if (term.meanings) {
        for (let m of term.meanings) {
          if (m.meaning && m.meaning.toLowerCase().includes(q)) return true;
          if (m.partOfSpeech && m.partOfSpeech.toLowerCase().includes(q)) return true;
        }
      }
      return false;
    });
  } else {
    sidebarTitleText.textContent = 'Terms';
    btnAddTerm.classList.remove('hidden');
    btnClearSearch.classList.add('hidden');
  }

  // Apply Sorting
  if (sortAlphabetically) {
    entries.sort((a, b) => a.localeCompare(b, undefined, {sensitivity: 'base'}));
  }

  termCountEl.textContent = entries.length;

  if (entries.length === 0) {
    termListEl.innerHTML = `<div class="empty-state">
      <i class="ph ph-magnifying-glass"></i>
      <p>No terms found</p>
    </div>`;
    return;
  }

  entries.forEach(key => {
    const term = glossary.entries[key];
    const div = document.createElement('div');
    div.className = `entry-item ${key === currentTermKey ? 'active' : ''}`;
    div.innerHTML = `
      <div class="entry-title">${key || 'Unnamed Term'}</div>
      <div class="entry-subtitle">${term.headword || term.alternateSpellings || 'No headword'}</div>
    `;
    div.addEventListener('click', () => loadTerm(key));
    termListEl.appendChild(div);
  });
}

function loadTerm(key) {
  currentTermKey = key;
  renderSidebar(); // Update active state
  
  const term = glossary.entries[key];
  if (!term) return;

  termEditorEl.classList.remove('hidden');
  metadataEditorEl.classList.add('hidden');
  document.getElementById('current-term-display').textContent = `Editing: ${key}`;

  fieldTermKey.value = key;
  fieldHeadword.value = term.headword || '';
  fieldAltSpelling.value = term.alternateSpellings || '';
  fieldModernSpelling.value = term.modernSpelling || '';
  fieldAntonym.value = term.antonym || '';
  fieldSynonym.value = term.synonym || '';
  fieldSeeAlso.value = term.seeAlso || '';

  renderMeanings();
}

function createNewTerm() {
  let newKey = "New Term";
  let count = 1;
  while(glossary.entries[newKey]) {
    newKey = `New Term ${count}`;
    count++;
  }

  glossary.entries[newKey] = {
    headword: "",
    alternateSpellings: "",
    meanings: [
      {
        partOfSpeech: "",
        meaning: "",
        references: ""
      }
    ],
    modernSpelling: "",
    antonym: "",
    synonym: "",
    seeAlso: ""
  };
  
  saveState();
  loadTerm(newKey);
}

function updateCurrentTerm() {
  if (!currentTermKey || !glossary.entries[currentTermKey]) return;
  
  const newKey = fieldTermKey.value.trim();
  
  // Handle key change
  if (newKey && newKey !== currentTermKey) {
    if (glossary.entries[newKey]) {
      alert("A term with this key already exists!");
      fieldTermKey.value = currentTermKey; // Revert
      return;
    }
    // Rename key
    glossary.entries[newKey] = glossary.entries[currentTermKey];
    delete glossary.entries[currentTermKey];
    currentTermKey = newKey;
    document.getElementById('current-term-display').textContent = `Editing: ${newKey}`;
  }

  const term = glossary.entries[currentTermKey];
  term.headword = fieldHeadword.value;
  term.alternateSpellings = fieldAltSpelling.value;
  term.modernSpelling = fieldModernSpelling.value;
  term.antonym = fieldAntonym.value;
  term.synonym = fieldSynonym.value;
  term.seeAlso = fieldSeeAlso.value;

  saveState();
  renderSidebar(); // Update lists
}

function deleteCurrentTerm() {
  if (!currentTermKey) return;
  if(confirm(`Are you sure you want to delete "${currentTermKey}"?`)) {
    delete glossary.entries[currentTermKey];
    currentTermKey = null;
    termEditorEl.classList.add('hidden');
    metadataEditorEl.classList.remove('hidden');
    saveState();
    renderSidebar();
  }
}

// Meanings
function renderMeanings() {
  meaningsContainer.innerHTML = '';
  const term = glossary.entries[currentTermKey];
  if (!term.meanings) term.meanings = [];

  if (term.meanings.length === 0) {
    meaningsContainer.innerHTML = `<div class="empty-state" style="padding: 1.5rem;">
      <p>No meanings added yet.</p>
    </div>`;
    return;
  }

  term.meanings.forEach((meaningObj, index) => {
    const div = document.createElement('div');
    div.className = 'meaning-card';
    div.innerHTML = `
      <div class="meaning-card-header">
        <span class="meaning-index">Meaning #${index + 1}</span>
        <button class="btn btn-icon btn-danger btn-sm delete-meaning" data-index="${index}">
          <i class="ph ph-trash"></i>
        </button>
      </div>
      <div class="form-grid">
        <div class="form-group" style="grid-column: span 2;">
          <label>Part of Speech</label>
          <input type="text" class="m-pos" data-index="${index}" value="${meaningObj.partOfSpeech || ''}" placeholder="e.g. noun">
        </div>
        <div class="form-group" style="grid-column: span 2;">
          <label>Meaning</label>
          <textarea class="m-mean" data-index="${index}" placeholder="Definition...">${meaningObj.meaning || ''}</textarea>
        </div>
        <div class="form-group" style="grid-column: span 2;">
          <label>References</label>
          <input type="text" class="m-ref" data-index="${index}" value="${meaningObj.references || ''}" placeholder="e.g. Doc1, page 5">
        </div>
      </div>
    `;
    meaningsContainer.appendChild(div);
  });

  // Attach meaning events
  document.querySelectorAll('.delete-meaning').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = e.currentTarget.getAttribute('data-index');
      term.meanings.splice(idx, 1);
      saveState();
      renderMeanings();
    });
  });

  document.querySelectorAll('.m-pos, .m-mean, .m-ref').forEach(input => {
    input.addEventListener('input', (e) => {
      const idx = e.target.getAttribute('data-index');
      const val = e.target.value;
      if (e.target.classList.contains('m-pos')) term.meanings[idx].partOfSpeech = val;
      if (e.target.classList.contains('m-mean')) term.meanings[idx].meaning = val;
      if (e.target.classList.contains('m-ref')) term.meanings[idx].references = val;
      saveState();
    });
  });
}

function addMeaning() {
  if (!currentTermKey) return;
  const term = glossary.entries[currentTermKey];
  if (!term.meanings) term.meanings = [];
  term.meanings.push({ partOfSpeech: "", meaning: "", references: "" });
  saveState();
  renderMeanings();
}

// Tooltips Logic
function setupTooltips() {
  const tooltipContainer = document.getElementById('tooltip-container');
  let activeTooltip = null;

  document.addEventListener('mouseover', (e) => {
    const trigger = e.target.closest('.tooltip-trigger');
    if (trigger) {
      const text = trigger.getAttribute('data-tooltip');
      if (text) {
        tooltipContainer.textContent = text;
        tooltipContainer.classList.add('visible');
        activeTooltip = trigger;
        
        const rect = trigger.getBoundingClientRect();
        tooltipContainer.style.left = `${rect.left + rect.width / 2}px`;
        tooltipContainer.style.top = `${rect.bottom + 10}px`;
      }
    }
  });

  document.addEventListener('mouseout', (e) => {
    if (e.target.closest('.tooltip-trigger') === activeTooltip) {
      tooltipContainer.classList.remove('visible');
      activeTooltip = null;
    }
  });
}

// Drag and Drop & Import
function setupDragAndDrop() {
  window.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropOverlay.classList.remove('hidden');
  });

  window.addEventListener('dragleave', (e) => {
    e.preventDefault();
    if (e.clientX === 0 || e.clientY === 0) { // check if left the window
      dropOverlay.classList.add('hidden');
    }
  });

  window.addEventListener('drop', (e) => {
    e.preventDefault();
    dropOverlay.classList.add('hidden');
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleImportFile(e.dataTransfer.files[0]);
    }
  });

  fileImport.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleImportFile(e.target.files[0]);
      e.target.value = ''; // Reset
    }
  });
}

function handleImportFile(file) {
  if (file.type !== "application/json" && !file.name.endsWith('.json')) {
    alert("Please upload a valid JSON file.");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      if (typeof parsed.entries !== 'object') throw new Error("Missing 'entries' object");
      
      glossary = parsed;
      saveState();
      currentTermKey = null;
      termEditorEl.classList.add('hidden');
      metadataEditorEl.classList.remove('hidden');
      init();
      alert("Glossary imported successfully!");
    } catch (err) {
      alert("Error parsing JSON file. Please ensure it matches the correct format.");
      console.error(err);
    }
  };
  reader.readAsText(file);
}

// Export JSON
function exportJSON() {
  const dataStr = JSON.stringify(glossary, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'glossary.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


// Event Listeners setup
function setupEventListeners() {
  // Metadata
  [titleInput, citationInput].forEach(el => {
    el.addEventListener('input', (e) => {
      if (e.target === titleInput) {
        glossary.title = e.target.value;
        updateMarkdown(titleInput, titlePreview);
      } else {
        glossary.citation = e.target.value;
        updateMarkdown(citationInput, citationPreview);
      }
      saveState();
    });
  });

  // Terms update
  fieldTermKey.addEventListener('change', updateCurrentTerm);
  fieldTermKey.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') fieldTermKey.blur();
  });
  [fieldHeadword, fieldAltSpelling, fieldModernSpelling, fieldAntonym, fieldSynonym, fieldSeeAlso].forEach(el => {
    el.addEventListener('input', updateCurrentTerm);
  });

  // Search Debounce
  globalSearch.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchQuery = e.target.value;
      renderSidebar();
    }, 1000); // 1 second delay
  });

  // Buttons
  btnShowMetadata.addEventListener('click', () => {
    currentTermKey = null;
    termEditorEl.classList.add('hidden');
    metadataEditorEl.classList.remove('hidden');
    renderSidebar();
  });
  btnAddTerm.addEventListener('click', createNewTerm);
  btnClearSearch.addEventListener('click', () => {
    globalSearch.value = '';
    searchQuery = '';
    renderSidebar();
  });
  btnDeleteTerm.addEventListener('click', deleteCurrentTerm);
  btnAddMeaning.addEventListener('click', addMeaning);
  
  btnExport.addEventListener('click', exportJSON);
  btnImport.addEventListener('click', () => fileImport.click());

  // Settings
  btnSettings.addEventListener('click', () => settingsModal.classList.remove('hidden'));
  btnCloseSettings.addEventListener('click', () => settingsModal.classList.add('hidden'));
  
  toggleSortAlpha.addEventListener('change', (e) => {
    sortAlphabetically = e.target.checked;
    localStorage.setItem('editioncrafter_sort_alpha', sortAlphabetically);
    renderSidebar();
  });

  btnResetData.addEventListener('click', () => {
    if(confirm("Are you sure you want to delete ALL data and reset? This cannot be undone.")) {
      glossary = structuredClone(defaultState);
      saveState();
      currentTermKey = null;
      termEditorEl.classList.add('hidden');
      metadataEditorEl.classList.remove('hidden');
      settingsModal.classList.add('hidden');
      init();
    }
  });

  // Close modal when clicking outside
  settingsModal.addEventListener('click', (e) => {
    if(e.target === settingsModal) settingsModal.classList.add('hidden');
  });
}

// Start
document.addEventListener('DOMContentLoaded', init);
