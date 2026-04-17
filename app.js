// ============================================================
// Markdown Converter - Application Logic
// ============================================================

// --- marked.js configuration ---
marked.setOptions({
    breaks: true,
    gfm: true,
    headerIds: true,
    mangle: false,
    sanitize: false,
    smartLists: true,
    smartypants: true,
    highlight: function(code, lang) { return code; }
});

// --- DOM references ---
const markdownInput = document.getElementById('markdown-input');
const htmlPreview   = document.getElementById('html-preview');
const htmlCode      = document.getElementById('html-code');
const fileInput     = document.getElementById('file-input');

// --- convertMarkdown() ---
let headingLinesVisible = false;
let hrLinesVisible = false;

function convertMarkdown() {
    const markdown = markdownInput.value;
    let html = marked.parse(markdown);

    // Convert <th> to <td><strong> for Google Docs compatibility
    html = html.replace(/<th>/g, '<td><strong>');
    html = html.replace(/<\/th>/g, '</strong></td>');
    html = html.replace(/<thead>/g, '<tbody>');
    html = html.replace(/<\/thead>/g, '</tbody>');

    // Remove <hr> tags if not visible
    if (!hrLinesVisible) {
        html = html.replace(/<hr\s*\/?>/gi, '');
    }

    // Add inline table styles for Google Docs compatibility
    html = html.replace(/<table>/g, '<table style="border-collapse: collapse; width: 100%; margin: 0; border: 1px solid #dfe2e5;">');

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Style all table rows/cells with inline styles (needed for Google Docs paste)
    tempDiv.querySelectorAll('table').forEach(table => {
        table.querySelectorAll('tr').forEach((row, index) => {
            row.querySelectorAll('td').forEach(cell => {
                const isHeaderRow = index === 0;
                const isOddRow = index % 2 === 1;
                cell.querySelectorAll('p').forEach(p => p.setAttribute('style', 'margin: 0; padding: 0;'));
                cell.querySelectorAll('ul, ol').forEach(l => l.setAttribute('style', 'margin: 0; padding-left: 20px;'));
                cell.querySelectorAll('li').forEach(li => li.setAttribute('style', 'margin: 0; padding: 0;'));
                if (isHeaderRow) {
                    const headerCellStyle = 'padding: 2px 4px; border: 1px solid #999999; background-color: #d3d3d3; font-weight: bold; text-align: left; font-family: Arial, sans-serif; font-size: 13px; vertical-align: top;';
                    cell.setAttribute('style', headerCellStyle);
                    // Force all children (p, strong, span, etc.) to inherit the header background
                    // so Google Docs doesn't render a white box over the gray cell background
                    cell.querySelectorAll('p, strong, span, em, a, code').forEach(child => {
                        child.setAttribute('style', 'background-color: #d3d3d3;');
                    });
                } else if (isOddRow) {
                    cell.setAttribute('style', 'padding: 2px 4px; border: 1px solid #dfe2e5; background-color: #f6f8fa; font-family: Arial, sans-serif; font-size: 13px; vertical-align: top;');
                } else {
                    cell.setAttribute('style', 'padding: 2px 4px; border: 1px solid #dfe2e5; background-color: #ffffff; font-family: Arial, sans-serif; font-size: 13px; vertical-align: top;');
                }
            });
        });
    });

    // Add font-family to paragraphs
    tempDiv.querySelectorAll('p').forEach(p => {
        const parentCell = p.closest('td');
        const insideCell = parentCell !== null;
        // Check if this cell already has the header background (set in the row loop above)
        const cellBg = insideCell && parentCell.getAttribute('style') && parentCell.getAttribute('style').includes('#d3d3d3');
        const existing = p.getAttribute('style') || '';
        if (insideCell && cellBg) {
            // Header row cell — preserve the gray background on the <p> so Google Docs doesn't bleed white
            p.setAttribute('style', 'margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 13px; line-height: 1.4; background-color: #d3d3d3;');
        } else if (insideCell) {
            p.setAttribute('style', 'margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 13px; line-height: 1.4;');
        } else if (!existing.includes('font-family')) {
            p.setAttribute('style', (existing + '; font-family: Arial, sans-serif; font-size: 14px; margin: 0 0 10px 0;').replace(/^; /, ''));
        }
    });

    // Add font-family to list items
    tempDiv.querySelectorAll('ul > li, ol > li').forEach(li => {
        const insideCell = li.closest('td, th') !== null;
        const existing = li.getAttribute('style') || '';
        if (insideCell) {
            li.setAttribute('style', 'margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 13px; line-height: 1.4;');
        } else if (!existing.includes('font-family')) {
            li.setAttribute('style', (existing + '; font-family: Arial, sans-serif; font-size: 14px;').replace(/^; /, ''));
        }
    });

    // Add font styling to headings
    const sizeMap = { H1: '28px', H2: '22px', H3: '18px', H4: '16px', H5: '14px', H6: '13px' };
    tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(h => {
        const existing = h.getAttribute('style') || '';
        const baseStyle = `font-family: Arial, sans-serif; font-size: ${sizeMap[h.tagName]}; font-weight: bold; margin: 16px 0 8px 0;`;
        h.setAttribute('style', existing ? existing + ' ' + baseStyle : baseStyle);
    });

    // Convert blockquotes to tables for Google Docs compatibility
    Array.from(tempDiv.querySelectorAll('blockquote')).forEach(bq => {
        const table = document.createElement('table');
        table.setAttribute('data-blockquote', 'true');
        table.setAttribute('style', 'border-collapse: collapse; width: 100%; margin: 0; border: none;');
        const tbody = document.createElement('tbody');
        const tr = document.createElement('tr');
        const tdBorder = document.createElement('td');
        tdBorder.setAttribute('style', 'width: 4px; background-color: #cccccc; padding: 0; border: none;');
        tdBorder.innerHTML = '&nbsp;';
        const tdContent = document.createElement('td');
        tdContent.setAttribute('style', 'padding: 2px 8px; background-color: #f6f8fa; border: none; color: #555555; font-family: Arial, sans-serif; font-size: 14px; font-style: italic; vertical-align: top;');
        tdContent.innerHTML = bq.innerHTML;
        tdContent.querySelectorAll('p').forEach(p => p.setAttribute('style', 'margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 14px; font-style: italic; color: #555555;'));
        tr.appendChild(tdBorder);
        tr.appendChild(tdContent);
        tbody.appendChild(tr);
        table.appendChild(tbody);
        bq.parentNode.replaceChild(table, bq);
    });

    // Inline code styles
    tempDiv.querySelectorAll('p > code, li > code, td > code, h1 > code, h2 > code, h3 > code').forEach(code => {
        code.setAttribute('style', 'padding: 2px 6px; margin: 0; background-color: #f6f8fa; border-radius: 3px; font-family: Consolas, Monaco, "Courier New", monospace; font-size: 85%;');
    });

    // Convert code blocks to tables for Google Docs compatibility
    Array.from(tempDiv.querySelectorAll('pre')).forEach(pre => {
        const code = pre.querySelector('code');
        const codeText = code ? code.textContent : pre.textContent;
        const table = document.createElement('table');
        table.setAttribute('data-code-block', 'true');
        table.setAttribute('style', 'border-collapse: collapse; width: 100%; margin: 16px 0; border: 2px solid #999999; background-color: #f6f8fa;');
        const tbody = document.createElement('tbody');
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.setAttribute('style', 'padding: 16px; background-color: #f6f8fa; font-family: "Courier New", monospace; font-size: 13px; line-height: 1.6; white-space: pre; border: none;');
        td.textContent = codeText;
        tr.appendChild(td);
        tbody.appendChild(tr);
        table.appendChild(tbody);
        pre.parentNode.replaceChild(table, pre);
    });

    // Heading underline inline styles if toggled on
    if (headingLinesVisible) {
        tempDiv.querySelectorAll('h1, h2').forEach(h => {
            h.style.borderBottom = '1px solid #eaecef';
            h.style.paddingBottom = '0.3em';
        });
    }

    html = tempDiv.innerHTML;
    htmlPreview.innerHTML = html;
    htmlCode.value = html;
}

// --- localStorage persistence ---
const STORAGE_KEY = 'mdconverter_draft';

function saveDraft() {
    try {
        localStorage.setItem(STORAGE_KEY, markdownInput.value);
    } catch (e) { /* storage full or unavailable */ }
}

function loadDraft() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            markdownInput.value = saved;
            convertMarkdown();
        }
    } catch (e) { /* storage unavailable */ }
}

// Real-time conversion + auto-save + status bar
markdownInput.addEventListener('input', function() {
    convertMarkdown();
    saveDraft();
    updateStatusBar();
});

// --- File loading ---
fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) loadFileContent(file);
});

// --- Tab switching ---
function switchTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
    if (tab === 'preview') {
        document.querySelectorAll('.tab')[0].classList.add('active');
        document.getElementById('preview-tab').classList.add('active');
    } else {
        document.querySelectorAll('.tab')[1].classList.add('active');
        document.getElementById('html-tab').classList.add('active');
    }
}

// --- copyHTML() ---
function copyHTML() {
    const previewElement = document.getElementById('html-preview');
    const blob = new Blob([previewElement.innerHTML], { type: 'text/html' });
    const clipboardItem = new ClipboardItem({ 'text/html': blob });
    navigator.clipboard.write([clipboardItem]).then(() => {
        showNotification(translations.notifications.copied[currentLang]);
    }).catch(() => {
        navigator.clipboard.writeText(previewElement.innerHTML).then(() => {
            showNotification(translations.notifications.copied[currentLang]);
        }).catch(err => {
            showNotification(translations.notifications.copyFailed[currentLang] + err, 'error');
        });
    });
}

// --- downloadStandalone() / Save as HTML File ---
function downloadStandalone() {
    const html = htmlCode.value;
    fetch('styles.css')
        .then(r => r.text())
        .then(cssContent => { _doDownloadStandalone(html, cssContent); })
        .catch(() => { _doDownloadStandalone(html, ''); });
}

function _doDownloadStandalone(html, cssContent) {
    const standalone = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Converted Document</title>
    <style>
${cssContent}
        body { box-sizing: border-box; min-width: 200px; max-width: 980px; margin: 0 auto; padding: 45px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; }
    </style>
</head>
<body>
    <article class="markdown-body">
${html}
    </article>
</body>
</html>`;
    const blob = new Blob([standalone], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'converted-standalone.html';
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    showNotification(translations.notifications.downloadedStandalone[currentLang]);
}

// --- clearAll() ---
function clearAll() {
    markdownInput.value = '';
    htmlPreview.innerHTML = '';
    htmlCode.value = '';
    try { localStorage.removeItem(STORAGE_KEY); } catch(e) {}
    showNotification(translations.notifications.cleared[currentLang]);
}

// --- showNotification() ---
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.style.background = type === 'error' ? '#cc0000' : '#66cc00';
    notification.classList.add('show');
    setTimeout(() => { notification.classList.remove('show'); }, 3000);
}

// --- Language / i18n ---
const LANG_KEY = 'mdconverter_lang';
let currentLang = (function() {
    try { return localStorage.getItem(LANG_KEY) || 'en'; } catch(e) { return 'en'; }
})();

const translations = {
    notifications: {
        fileLoaded:         { en: 'File loaded successfully!',        fr: 'Fichier charg\u00e9 avec succ\u00e8s!' },
        copied:             { en: 'Formatted content copied — ready to paste!', fr: 'Contenu formaté copié — prêt à coller!' },
        copyFailed:         { en: 'Failed to copy: ',                 fr: '\u00c9chec de la copie : ' },
        downloaded:         { en: 'HTML file downloaded!',            fr: 'Fichier HTML t\u00e9l\u00e9charg\u00e9!' },
        downloadedStandalone: { en: 'Standalone HTML file downloaded!', fr: 'Fichier HTML autonome t\u00e9l\u00e9charg\u00e9!' },
        cleared:            { en: 'Content cleared!',                 fr: 'Contenu effac\u00e9!' },
        pasted:             { en: 'Clipboard content loaded!',        fr: 'Contenu du presse-papiers charg\u00e9!' }
    }
};

function applyLanguage() {
    document.getElementById('lang-toggle').textContent = currentLang === 'en' ? 'FR' : 'EN';
    document.querySelectorAll('[data-en][data-fr]').forEach(el => {
        const versionSpan = el.querySelector('.app-version');
        el.textContent = el.getAttribute('data-' + currentLang);
        if (versionSpan) el.appendChild(versionSpan);
    });
    // Swap logo — both .gif files exist locally
    const logoImg = document.querySelector('.logo-img');
    if (logoImg) {
        logoImg.src = currentLang === 'fr' ? 'th_logo_fr.gif' : 'th_logo_en.gif';
        logoImg.alt = currentLang === 'fr' ? 'TELUS Santé' : 'TELUS Health';
    }
    // #11 — update <html lang> attribute
    document.getElementById('html-root').lang = currentLang;
}

function toggleLanguage() {
    currentLang = currentLang === 'en' ? 'fr' : 'en';
    try { localStorage.setItem(LANG_KEY, currentLang); } catch(e) {}
    applyLanguage();
    updateHelpModal();
}

// --- Help modal ---
function openHelp(event) {
    event.preventDefault();
    updateHelpModal();
    document.getElementById('help-modal').classList.add('show');
}

function closeHelp() {
    document.getElementById('help-modal').classList.remove('show');
}

function updateHelpModal() {
    const modal = document.getElementById('help-modal');
    const isFr = currentLang === 'fr';

    modal.querySelector('.modal-header h2').textContent = isFr
        ? 'Comment utiliser le Convertisseur Markdown'
        : 'How to Use the Markdown Converter';

    modal.querySelector('.modal-body').innerHTML = isFr ? `
        <h3>Pour commencer</h3>
        <ul>
            <li>Tapez ou collez votre texte Markdown dans le panneau de gauche</li>
            <li>L'aperçu formaté apparaît automatiquement dans le panneau de droite</li>
            <li>Basculez entre les onglets Aperçu et Code HTML pour voir le résultat</li>
        </ul>
        <h3>Barre d'outils</h3>
        <ul>
            <li><strong>Coller depuis le presse-papiers :</strong> Chargez du texte Markdown directement depuis votre presse-papiers</li>
            <li><strong>Copier le contenu formaté :</strong> Copie le contenu formaté dans votre presse-papiers — collez ensuite (<code>Ctrl+V</code>) dans Google Docs, Word ou tout éditeur de texte enrichi</li>
            <li><strong>Effacer :</strong> Supprimez tout le contenu des deux panneaux</li>
        </ul>
        <h3>Menu Plus (⋮ Plus)</h3>
        <ul>
            <li><strong>Charger un fichier :</strong> Ouvrez un fichier .md, .markdown ou .txt depuis votre ordinateur</li>
            <li><strong>Enregistrer en HTML :</strong> Téléchargez un fichier HTML complet et stylisé</li>
            <li><strong>Enregistrer en PDF :</strong> Ouvre une fenêtre d'impression optimisée pour PDF — sélectionnez « Enregistrer en PDF » dans la boîte de dialogue d'impression (<code>Ctrl+P</code>)</li>
            <li><strong>Imprimer / PDF :</strong> Imprimez l'aperçu ou enregistrez-le en PDF</li>
            <li><strong>Soulignement des titres :</strong> Afficher/masquer les bordures sous H1 et H2</li>
            <li><strong>Séparateurs de section :</strong> Afficher/masquer les lignes horizontales (<code>---</code>)</li>
            <li><strong>Chercher :</strong> Ouvrir la barre de recherche dans l'éditeur</li>
            <li><strong>Chercher et remplacer :</strong> Ouvrir la barre de recherche et remplacement</li>
            <li><strong>Mode sombre :</strong> Basculer entre le thème clair et sombre</li>
        </ul>
        <h3>Raccourcis clavier</h3>
        <div class="shortcut"><span><code>Ctrl+S</code> (ou <code>Cmd+S</code> sur Mac)</span><span>Enregistrer en HTML</span></div>
        <div class="shortcut"><span><code>Ctrl+P</code> (ou <code>Cmd+P</code> sur Mac)</span><span>Enregistrer en PDF</span></div>
        <div class="shortcut"><span><code>Ctrl+K</code> (ou <code>Cmd+K</code> sur Mac)</span><span>Tout effacer</span></div>
        <div class="shortcut"><span><code>Ctrl+F</code> (ou <code>Cmd+F</code> sur Mac)</span><span>Rechercher dans l'éditeur</span></div>
        <div class="shortcut"><span><code>Ctrl+H</code> (ou <code>Cmd+H</code> sur Mac)</span><span>Rechercher et remplacer</span></div>
        <div class="shortcut"><span><code>Échap</code></span><span>Fermer la barre de recherche</span></div>
        <h3>Confidentialité et sécurité</h3>
        <ul>
            <li>Tout le traitement se fait localement dans votre navigateur</li>
            <li>Aucune donnée n'est envoyée à des serveurs externes</li>
            <li>Vos documents restent privés et sécurisés</li>
            <li>Fonctionne entièrement hors ligne</li>
        </ul>
        <h3>Aide-mémoire Markdown</h3>
        <table class="cheat-table">
            <thead><tr><th>Ce que vous tapez</th><th>Ce que vous obtenez</th></tr></thead>
            <tbody>
                <tr><td><code># Titre 1</code></td><td>Grand titre (H1)</td></tr>
                <tr><td><code>## Titre 2</code></td><td>Titre moyen (H2)</td></tr>
                <tr><td><code>### Titre 3</code></td><td>Petit titre (H3)</td></tr>
                <tr><td><code>**texte gras**</code></td><td><strong>texte gras</strong></td></tr>
                <tr><td><code>*texte italique*</code></td><td><em>texte italique</em></td></tr>
                <tr><td><code>~~barré~~</code></td><td><s>barré</s></td></tr>
                <tr><td><code>- élément</code> ou <code>* élément</code></td><td>Élément de liste à puces</td></tr>
                <tr><td><code>1. élément</code></td><td>Élément de liste numérotée</td></tr>
                <tr><td><code>&gt; texte cité</code></td><td>Citation</td></tr>
                <tr><td><code>\`code inline\`</code></td><td>Code en ligne</td></tr>
                <tr><td><code>\`\`\`</code> (triple backtick)</td><td>Bloc de code</td></tr>
                <tr><td><code>[texte du lien](url)</code></td><td>Hyperlien</td></tr>
                <tr><td><code>---</code></td><td>Ligne horizontale / séparateur de section</td></tr>
                <tr><td><code>| Col1 | Col2 |</code><br><code>|------|------|</code><br><code>| A    | B    |</code></td><td>Tableau</td></tr>
            </tbody>
        </table>
    ` : `
        <h3>Getting Started</h3>
        <ul>
            <li>Type or paste your Markdown text in the left panel</li>
            <li>The formatted preview appears automatically in the right panel</li>
            <li>Switch between Preview and HTML Code tabs to see the output</li>
        </ul>
        <h3>Toolbar</h3>
        <ul>
            <li><strong>Paste from Clipboard:</strong> Load Markdown text directly from your clipboard</li>
            <li><strong>Copy Formatted Content:</strong> Copies the formatted content to your clipboard — then paste (<code>Ctrl+V</code>) into Google Docs, Word, or any rich-text editor</li>
            <li><strong>Paste as Markdown:</strong> Copy content from Google Docs, Word, or any rich-text source, then click this button to convert it to Markdown automatically</li>
            <li><strong>Clear:</strong> Remove all content from both panels</li>
        </ul>
        <h3>More Menu (⋮ More)</h3>
        <ul>
            <li><strong>Load File:</strong> Open a .md, .markdown, or .txt file from your computer</li>
            <li><strong>Save as HTML:</strong> Download a complete, styled HTML file you can open in any browser, share, or print to PDF</li>
            <li><strong>Save as PDF:</strong> Opens a clean PDF-ready print window — select "Save as PDF" in the print dialog (<code>Ctrl+P</code>)</li>
            <li><strong>Print / PDF:</strong> Print the formatted preview or save it as a PDF using your browser's print dialog</li>
            <li><strong>Heading Underlines:</strong> Toggle underline borders on H1 and H2 headings</li>
            <li><strong>Section Dividers:</strong> Toggle visibility of horizontal rules (<code>---</code>)</li>
            <li><strong>Find:</strong> Open the Find bar to search within the editor</li>
            <li><strong>Find &amp; Replace:</strong> Open the Find &amp; Replace bar to search and substitute text</li>
            <li><strong>Dark Mode:</strong> Switch between light and dark theme</li>
        </ul>
        <h3>Keyboard Shortcuts</h3>
        <div class="shortcut"><span><code>Ctrl+S</code> (or <code>Cmd+S</code> on Mac)</span><span>Save as HTML File</span></div>
        <div class="shortcut"><span><code>Ctrl+P</code> (or <code>Cmd+P</code> on Mac)</span><span>Save as PDF</span></div>
        <div class="shortcut"><span><code>Ctrl+K</code> (or <code>Cmd+K</code> on Mac)</span><span>Clear All</span></div>
        <div class="shortcut"><span><code>Ctrl+F</code> (or <code>Cmd+F</code> on Mac)</span><span>Find in editor</span></div>
        <div class="shortcut"><span><code>Ctrl+H</code> (or <code>Cmd+H</code> on Mac)</span><span>Find &amp; Replace</span></div>
        <div class="shortcut"><span><code>Escape</code></span><span>Close Find bar</span></div>
        <h3>Privacy &amp; Security</h3>
        <ul>
            <li>All processing happens locally in your browser</li>
            <li>No data is sent to external servers</li>
            <li>Your documents remain private and secure</li>
            <li>Works completely offline</li>
        </ul>
        <h3>Markdown Cheat Sheet</h3>
        <table class="cheat-table">
            <thead><tr><th>What you type</th><th>What you get</th></tr></thead>
            <tbody>
                <tr><td><code># Heading 1</code></td><td>Large heading (H1)</td></tr>
                <tr><td><code>## Heading 2</code></td><td>Medium heading (H2)</td></tr>
                <tr><td><code>### Heading 3</code></td><td>Small heading (H3)</td></tr>
                <tr><td><code>**bold text**</code></td><td><strong>bold text</strong></td></tr>
                <tr><td><code>*italic text*</code></td><td><em>italic text</em></td></tr>
                <tr><td><code>~~strikethrough~~</code></td><td><s>strikethrough</s></td></tr>
                <tr><td><code>- item</code> or <code>* item</code></td><td>Bullet list item</td></tr>
                <tr><td><code>1. item</code></td><td>Numbered list item</td></tr>
                <tr><td><code>&gt; quoted text</code></td><td>Blockquote</td></tr>
                <tr><td><code>\`inline code\`</code></td><td>Inline code highlight</td></tr>
                <tr><td><code>\`\`\`</code> (triple backtick)</td><td>Code block</td></tr>
                <tr><td><code>[link text](url)</code></td><td>Hyperlink</td></tr>
                <tr><td><code>---</code></td><td>Horizontal rule / section divider</td></tr>
                <tr><td><code>| Col1 | Col2 |</code><br><code>|------|------|</code><br><code>| A    | B    |</code></td><td>Table</td></tr>
            </tbody>
        </table>
    `;
}

window.onclick = function(event) {
    const modal = document.getElementById('help-modal');
    if (event.target === modal) { closeHelp(); }
};

// --- Toggle heading lines ---
function toggleHeadingLines() {
    headingLinesVisible = !headingLinesVisible;
    const btn = document.getElementById('heading-lines-toggle');
    btn.classList.toggle('active', headingLinesVisible);
    if (headingLinesVisible) {
        htmlPreview.classList.add('show-heading-lines');
    } else {
        htmlPreview.classList.remove('show-heading-lines');
    }
    convertMarkdown();
}

// --- Toggle HR lines ---
function toggleHRLines() {
    hrLinesVisible = !hrLinesVisible;
    const btn = document.getElementById('hr-lines-toggle');
    btn.classList.toggle('active', hrLinesVisible);
    if (hrLinesVisible) {
        htmlPreview.classList.add('show-hr-lines');
    } else {
        htmlPreview.classList.remove('show-hr-lines');
    }
    convertMarkdown();
}

// --- More menu ---
function toggleMoreMenu() {
    const dropdown = document.getElementById('more-menu-dropdown');
    const isOpen = dropdown.classList.toggle('open');
    // Close when clicking outside
    if (isOpen) {
        setTimeout(() => {
            document.addEventListener('click', closeMoreMenuOnOutsideClick, { once: true });
        }, 0);
    }
}

function closeMoreMenuOnOutsideClick(e) {
    const wrapper = document.getElementById('more-menu-wrapper');
    if (!wrapper.contains(e.target)) {
        closeMoreMenu();
    } else {
        // Re-attach if click was inside (on a non-closing item like a toggle)
        setTimeout(() => {
            document.addEventListener('click', closeMoreMenuOnOutsideClick, { once: true });
        }, 0);
    }
}

function closeMoreMenu() {
    document.getElementById('more-menu-dropdown').classList.remove('open');
}

// --- Panel references & Resizer ---
const leftPanel  = document.getElementById('left-panel');
const rightPanel = document.getElementById('right-panel');
const resizer    = document.getElementById('resizer');
const container  = document.getElementById('main-container');

const SPLIT_KEY = 'mdconverter_split';
(function initSplit() {
    const saved = localStorage.getItem(SPLIT_KEY);
    if (saved) {
        leftPanel.style.flex  = 'none';
        rightPanel.style.flex = 'none';
        leftPanel.style.width  = saved + '%';
        rightPanel.style.width = (100 - parseFloat(saved)) + '%';
    }
})();

if (resizer) {
    resizer.addEventListener('mousedown', function(e) {
        e.preventDefault();
        resizer.classList.add('dragging');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        function onMouseMove(e) {
            const rect = container.getBoundingClientRect();
            const resizerWidth = resizer.offsetWidth;
            let leftPct = ((e.clientX - rect.left - resizerWidth / 2) / rect.width) * 100;
            leftPct = Math.max(15, Math.min(85, leftPct));
            leftPanel.style.flex  = 'none';
            rightPanel.style.flex = 'none';
            leftPanel.style.width  = leftPct + '%';
            rightPanel.style.width = (100 - leftPct) + '%';
        }

        function onMouseUp() {
            resizer.classList.remove('dragging');
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            const pct = (leftPanel.offsetWidth / container.offsetWidth * 100).toFixed(1);
            try { localStorage.setItem(SPLIT_KEY, pct); } catch(e) {}
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    resizer.addEventListener('dblclick', function() {
        leftPanel.style.width  = '50%';
        rightPanel.style.width = '50%';
        try { localStorage.setItem(SPLIT_KEY, '50'); } catch(e) {}
    });
}

// --- Synchronized scroll ---
// Syncs scroll % of markdown input → preview pane (and vice versa)
// Uses a separate flag from isSyncingScroll (which is shared with find navigation)
let _scrollSyncLock = false;

function syncScroll(source, target) {
    if (_scrollSyncLock) return;
    _scrollSyncLock = true;
    const sourceMax = source.scrollHeight - source.clientHeight;
    const pct = sourceMax > 0 ? source.scrollTop / sourceMax : 0;
    const targetMax = target.scrollHeight - target.clientHeight;
    target.scrollTop = pct * targetMax;
    requestAnimationFrame(() => { _scrollSyncLock = false; });
}

const previewPane = document.getElementById('preview-tab');

markdownInput.addEventListener('scroll', () => syncScroll(markdownInput, previewPane));
previewPane.addEventListener('scroll', () => syncScroll(previewPane, markdownInput));
// --- Conversion Mode (MD→HTML or HTML→MD) ---
let conversionMode = 'md-to-html'; // or 'html-to-md'

function toggleConversionMode() {
    conversionMode = conversionMode === 'md-to-html' ? 'html-to-md' : 'md-to-html';
    applyConversionMode();
}

function applyConversionMode() {
    const arrowBtn   = document.getElementById('direction-arrow');
    const arrowIcon  = document.getElementById('direction-icon');
    const arrowLabel = document.getElementById('direction-label');
    const leftHeader = document.querySelector('#left-panel .panel-header');
    const btnPaste   = document.getElementById('btn-paste-left');
    const btnCopy    = document.getElementById('btn-copy-output');
    const rightMdHtml  = document.getElementById('right-md-to-html');
    const rightHtmlMd  = document.getElementById('right-html-to-md');
    const richInput    = document.getElementById('rich-input');

    if (conversionMode === 'md-to-html') {
        // Arrow points right →
        arrowIcon.innerHTML  = '&#8594;';
        arrowLabel.textContent = 'MD → HTML';
        arrowBtn.classList.remove('reverse-mode');

        // Left panel = Markdown input
        if (leftHeader) {
            leftHeader.setAttribute('data-en', 'Markdown Input');
            leftHeader.setAttribute('data-fr', 'Entrée Markdown');
            leftHeader.textContent = currentLang === 'fr' ? 'Entrée Markdown' : 'Markdown Input';
        }

        // Toolbar buttons
        if (btnPaste) {
            btnPaste.setAttribute('data-en', '⬇ Paste from Clipboard');
            btnPaste.setAttribute('data-fr', '⬇ Coller depuis le presse-papiers');
            btnPaste.textContent = currentLang === 'fr' ? '⬇ Coller depuis le presse-papiers' : '⬇ Paste from Clipboard';
            btnPaste.title = '';
        }
        if (btnCopy) {
            btnCopy.setAttribute('data-en', '⬆ Copy Formatted Content');
            btnCopy.setAttribute('data-fr', '⬆ Copier le contenu formaté');
            btnCopy.textContent = currentLang === 'fr' ? '⬆ Copier le contenu formaté' : '⬆ Copy Formatted Content';
            btnCopy.onclick = copyHTML;
            btnCopy.className = 'btn btn-success';
        }

        // Show normal MD→HTML right panel
        rightMdHtml.style.display = '';
        rightHtmlMd.style.display = 'none';

        // Re-run conversion from the markdown textarea
        convertMarkdown();

    } else {
        // Arrow points left ←
        arrowIcon.innerHTML  = '&#8592;';
        arrowLabel.textContent = 'HTML → MD';
        arrowBtn.classList.add('reverse-mode');

        // Left panel = Markdown output (read-only-ish)
        if (leftHeader) {
            leftHeader.setAttribute('data-en', 'Markdown Output');
            leftHeader.setAttribute('data-fr', 'Sortie Markdown');
            leftHeader.textContent = currentLang === 'fr' ? 'Sortie Markdown' : 'Markdown Output';
        }

        // Toolbar buttons
        if (btnPaste) {
            btnPaste.setAttribute('data-en', '⬇ Paste Rich Content');
            btnPaste.setAttribute('data-fr', '⬇ Coller le contenu enrichi');
            btnPaste.textContent = currentLang === 'fr' ? '⬇ Coller le contenu enrichi' : '⬇ Paste Rich Content';
            btnPaste.title = 'Paste rich text (Google Docs, Word) into the right panel and convert to Markdown';
        }
        if (btnCopy) {
            btnCopy.setAttribute('data-en', '⬆ Copy Markdown');
            btnCopy.setAttribute('data-fr', '⬆ Copier le Markdown');
            btnCopy.textContent = currentLang === 'fr' ? '⬆ Copier le Markdown' : '⬆ Copy Markdown';
            btnCopy.onclick = copyMarkdown;
            btnCopy.className = 'btn btn-success';
        }

        // Show HTML→MD right panel
        rightMdHtml.style.display = 'none';
        rightHtmlMd.style.display = 'flex';

        // Focus the rich input so user can paste immediately
        if (richInput) setTimeout(() => richInput.focus(), 50);
    }
}

// Called when user pastes into the rich-input textarea (HTML→MD mode)
function onRichInputChange() {
    const richInput = document.getElementById('rich-input');
    if (!richInput) return;
    const plainText = richInput.value;
    if (!plainText.trim()) return;
    // Plain text pasted via textarea — convert as-is (no rich HTML available)
    markdownInput.value = plainText;
    updateLineNumbers();
    updateStatusBar();
}

// Listen for paste on rich-input to capture the HTML version
document.addEventListener('DOMContentLoaded', function() {
    const richInput = document.getElementById('rich-input');
    if (!richInput) return;
    richInput.addEventListener('paste', function(e) {
        e.preventDefault();
        // Prefer HTML from clipboard data
        const html = e.clipboardData.getData('text/html');
        if (html && html.trim()) {
            const md = convertHtmlToMarkdown(html);
            richInput.value = '(Rich content pasted — see Markdown output on the left)';
            markdownInput.value = md;
        } else {
            // Fallback to plain text
            const text = e.clipboardData.getData('text/plain');
            richInput.value = text;
            markdownInput.value = text;
        }
        convertMarkdown();
        saveDraft();
        updateLineNumbers();
        updateStatusBar();
        showNotification('Rich content converted to Markdown!');
    });
});

// --- pasteLeft() — toolbar paste button (context-aware) ---
function pasteLeft() {
    if (conversionMode === 'md-to-html') {
        // Original behaviour: paste plain text into markdown textarea
        navigator.clipboard.readText().then(text => {
            if (!text.trim()) {
                showNotification('Clipboard is empty.', 'error');
                return;
            }
            if (markdownInput.value.trim()) {
                if (!confirm('Replace current content with clipboard text?')) return;
            }
            markdownInput.value = text;
            convertMarkdown();
            saveDraft();
            showNotification(translations.notifications.pasted[currentLang]);
        }).catch(() => {
            showNotification('Could not read clipboard. Please paste manually (Ctrl+V).', 'error');
        });
    } else {
        // HTML→MD mode: read rich HTML from clipboard and convert
        pasteAsMarkdownToLeft();
    }
}

// Paste rich clipboard content → convert to Markdown → put in left pane
function pasteAsMarkdownToLeft() {
    if (!navigator.clipboard || !navigator.clipboard.read) {
        showNotification('Clipboard API not available. Use Ctrl+V in the right panel.', 'error');
        return;
    }
    navigator.clipboard.read().then(items => {
        for (const item of items) {
            if (item.types.includes('text/html')) {
                item.getType('text/html').then(blob => {
                    blob.text().then(html => {
                        const md = convertHtmlToMarkdown(html);
                        if (!md.trim()) {
                            showNotification('Nothing to convert — clipboard HTML was empty.', 'error');
                            return;
                        }
                        const richInput = document.getElementById('rich-input');
                        if (richInput) richInput.value = '(Rich content pasted — see Markdown output on the left)';
                        markdownInput.value = md;
                        convertMarkdown();
                        saveDraft();
                        updateLineNumbers();
                        updateStatusBar();
                        showNotification('Rich content converted to Markdown!');
                    });
                });
                return;
            }
            if (item.types.includes('text/plain')) {
                item.getType('text/plain').then(blob => {
                    blob.text().then(text => {
                        if (!text.trim()) { showNotification('Clipboard is empty.', 'error'); return; }
                        markdownInput.value = text;
                        convertMarkdown();
                        saveDraft();
                        updateLineNumbers();
                        updateStatusBar();
                        showNotification('Plain text pasted.');
                    });
                });
                return;
            }
        }
        showNotification('No usable content found in clipboard.', 'error');
    }).catch(err => {
        showNotification('Could not read clipboard. Use Ctrl+V in the right panel.', 'error');
    });
}

// --- copyMarkdown() — copies left pane Markdown text ---
function copyMarkdown() {
    const md = markdownInput.value;
    if (!md.trim()) {
        showNotification('Nothing to copy — Markdown is empty.', 'error');
        return;
    }
    navigator.clipboard.writeText(md).then(() => {
        showNotification('Markdown copied to clipboard!');
    }).catch(() => {
        showNotification('Could not copy. Please select text manually.', 'error');
    });
}

// --- pasteFromClipboard() (legacy alias kept for any old references) ---
function pasteFromClipboard() {
    pasteLeft();
}

// --- pasteAsMarkdown() ---
// Reads rich HTML from the clipboard (e.g. copied from Google Docs / Word)
// and converts it to clean Markdown using Turndown + GFM table plugin.
function pasteAsMarkdown() {
    // navigator.clipboard.read() gives access to the text/html MIME type
    if (!navigator.clipboard || !navigator.clipboard.read) {
        showNotification('Clipboard API not available. Try Ctrl+V directly.', 'error');
        return;
    }

    navigator.clipboard.read().then(items => {
        // Find a clipboard item that has text/html
        for (const item of items) {
            if (item.types.includes('text/html')) {
                item.getType('text/html').then(blob => {
                    blob.text().then(html => {
                        const md = convertHtmlToMarkdown(html);
                        if (!md.trim()) {
                            showNotification('Nothing to convert — clipboard HTML was empty.', 'error');
                            return;
                        }
                        if (markdownInput.value.trim()) {
                            if (!confirm('Replace current content with converted Markdown?')) return;
                        }
                        markdownInput.value = md;
                        convertMarkdown();
                        saveDraft();
                        updateLineNumbers();
                        updateStatusBar();
                        showNotification('Rich content converted to Markdown!');
                    });
                });
                return;
            }
            // Fallback: plain text (won't have formatting, but better than nothing)
            if (item.types.includes('text/plain')) {
                item.getType('text/plain').then(blob => {
                    blob.text().then(text => {
                        if (!text.trim()) {
                            showNotification('Clipboard is empty.', 'error');
                            return;
                        }
                        if (markdownInput.value.trim()) {
                            if (!confirm('Replace current content with clipboard text?')) return;
                        }
                        markdownInput.value = text;
                        convertMarkdown();
                        saveDraft();
                        updateLineNumbers();
                        updateStatusBar();
                        showNotification('Plain text pasted (no rich formatting detected).');
                    });
                });
                return;
            }
        }
        showNotification('No usable content found in clipboard.', 'error');
    }).catch(err => {
        showNotification('Could not read clipboard. Please allow clipboard access.', 'error');
        console.error('Clipboard read error:', err);
    });
}

// --- convertHtmlToMarkdown() ---
// Uses Turndown (local) + turndown-plugin-gfm (local) to convert
// HTML string → clean Markdown. Cleans up Google Docs-specific artifacts first.
function convertHtmlToMarkdown(html) {
    // ── Pre-process: strip Google Docs metadata and noise ──────────────────
    // Google Docs wraps everything in <b id="docs-internal-guid-..."> — unwrap it
    html = html.replace(/<b\s+id="docs-internal-guid[^"]*"[^>]*>/gi, '');
    html = html.replace(/<\/b>/gi, (match, offset, str) => {
        // Only strip the closing </b> that corresponded to the docs-guid wrapper
        // (Turndown handles real <b>/<strong> fine, so we just do a simple pass here)
        return match; // leave real </b> alone — Turndown handles bold
    });

    // Remove Google Docs comment/suggestion markers
    html = html.replace(/<a\s+id="[^"]*"[^>]*><\/a>/gi, '');

    // Strip zero-width spaces and non-breaking spaces (common in Google Docs copy)
    html = html.replace(/\u200b/g, '').replace(/\u00a0/g, ' ');

    // Remove style attributes from span tags so Turndown can reason about structure
    // (Google Docs uses inline spans with font-size/color but no semantic meaning)
    html = html.replace(/<span[^>]*?>/gi, '<span>');

    // ── Configure Turndown ──────────────────────────────────────────────────
    const td = new TurndownService({
        headingStyle: 'atx',          // # H1, ## H2
        hr: '---',
        bulletListMarker: '-',
        codeBlockStyle: 'fenced',     // ``` fences
        fence: '```',
        emDelimiter: '*',
        strongDelimiter: '**',
        linkStyle: 'inlined'
    });

    // Apply GFM plugin (pipes tables, strikethrough, etc.)
    if (typeof turndownPluginGfm !== 'undefined') {
        td.use(turndownPluginGfm.gfm);
    }

    // Custom rule: collapse empty <span> tags (Google Docs artifact)
    td.addRule('removeEmptySpans', {
        filter: node => node.nodeName === 'SPAN' && !node.textContent.trim() && !node.querySelector('img'),
        replacement: () => ''
    });

    // Custom rule: treat Google Docs <h1>–<h6> correctly even if they're styled <p>s
    // (GDocs sometimes emits <p class="title"> instead of <h1>)
    td.addRule('gdocsTitle', {
        filter: node => {
            if (node.nodeName !== 'P') return false;
            const cls = (node.getAttribute('class') || '').toLowerCase();
            return cls === 'title' || cls === 'subtitle';
        },
        replacement: (content, node) => {
            const cls = (node.getAttribute('class') || '').toLowerCase();
            return cls === 'title' ? '\n# ' + content + '\n\n' : '\n## ' + content + '\n\n';
        }
    });

    // ── Convert ──────────────────────────────────────────────────────────────
    let markdown = td.turndown(html);

    // ── Post-process: clean up common conversion artifacts ───────────────────
    // Remove excessive blank lines (more than 2 in a row)
    markdown = markdown.replace(/\n{3,}/g, '\n\n');

    // Trim trailing whitespace from each line
    markdown = markdown.split('\n').map(l => l.trimEnd()).join('\n');

    // Remove leading/trailing blank lines
    markdown = markdown.trim();

    return markdown;
}

// --- saveAsPDF() ---
// Opens a clean PDF-ready page in a new window and auto-triggers the browser's
// print dialog (set destination to "Save as PDF").  100% local — no external libs.
function saveAsPDF() {
    const html = document.getElementById('html-preview').innerHTML;

    // Fetch the app stylesheet to embed it inline so the new window is self-contained
    fetch('styles.css')
        .then(r => r.text())
        .then(css => _openPDFWindow(html, css))
        .catch(() => _openPDFWindow(html, ''));
}

function _openPDFWindow(html, css) {
    const win = window.open('', '_blank');
    if (!win) {
        showNotification('Please allow pop-ups for this page to use Save as PDF.', 'error');
        return;
    }

    // Derive a suggested filename from the first H1 in the content (fallback to 'document')
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const firstH1 = tempDiv.querySelector('h1');
    const docTitle = firstH1 ? firstH1.textContent.trim() : 'document';

    win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${docTitle}</title>
<style>
/* ── Embedded app stylesheet ── */
${css}

/* ── PDF-specific overrides ── */
*, *::before, *::after { box-sizing: border-box; }

html, body {
    margin: 0;
    padding: 0;
    background: #ffffff;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    font-size: 13pt;
    color: #24292e;
}

/* Page margins — applied via body padding so content doesn't touch edges */
body {
    padding: 20mm 20mm 20mm 20mm;
}

/* The markdown content wrapper */
.markdown-body {
    max-width: 100%;
    margin: 0;
    padding: 0;
    background: transparent;
}

/* Headings */
.markdown-body h1 { font-size: 22pt; margin: 0 0 10pt 0; border-bottom: 1px solid #e1e4e8; padding-bottom: 6pt; }
.markdown-body h2 { font-size: 17pt; margin: 16pt 0 8pt 0; border-bottom: 1px solid #eaecef; padding-bottom: 4pt; }
.markdown-body h3 { font-size: 14pt; margin: 14pt 0 6pt 0; }
.markdown-body h4 { font-size: 12pt; margin: 12pt 0 4pt 0; }
.markdown-body h5, .markdown-body h6 { font-size: 11pt; margin: 10pt 0 4pt 0; }

/* Paragraphs & lists */
.markdown-body p  { margin: 0 0 8pt 0; line-height: 1.6; }
.markdown-body ul,
.markdown-body ol { margin: 0 0 8pt 0; padding-left: 20pt; }
.markdown-body li { margin-bottom: 3pt; line-height: 1.5; }

/* Tables */
.markdown-body table { border-collapse: collapse; width: 100%; margin: 10pt 0; font-size: 11pt; }
.markdown-body td,
.markdown-body th  { border: 1px solid #d0d7de; padding: 4pt 8pt; vertical-align: top; }
.markdown-body tr:nth-child(odd)  td { background-color: #f6f8fa; }
.markdown-body tr:nth-child(even) td { background-color: #ffffff; }
/* First row = header */
.markdown-body tr:first-child td { background-color: #e1e4e8; font-weight: bold; }

/* Code blocks — rendered as table by convertMarkdown(); keep monospace look */
.markdown-body table[data-code-block] td {
    font-family: "Courier New", Consolas, monospace;
    font-size: 10pt;
    background-color: #f6f8fa;
    border: 1px solid #d0d7de;
    padding: 10pt;
    white-space: pre-wrap;
    word-break: break-all;
}

/* Blockquotes — rendered as table by convertMarkdown() */
.markdown-body table[data-blockquote] td:first-child { background-color: #c8c8c8; width: 4pt; padding: 0; }
.markdown-body table[data-blockquote] td:last-child  { background-color: #f6f8fa; padding: 4pt 10pt; font-style: italic; color: #555; }

/* Inline code */
.markdown-body code {
    font-family: "Courier New", Consolas, monospace;
    font-size: 85%;
    background-color: #f6f8fa;
    padding: 1pt 4pt;
    border-radius: 2pt;
}

/* Horizontal rules */
.markdown-body hr { border: none; border-top: 1px solid #e1e4e8; margin: 16pt 0; }

/* Blockquote (native, if any survived) */
.markdown-body blockquote {
    margin: 0 0 8pt 0;
    padding: 4pt 12pt;
    border-left: 3pt solid #c8c8c8;
    color: #6a737d;
    background-color: #f6f8fa;
}

/* Links */
.markdown-body a { color: #0366d6; text-decoration: underline; }

/* Page break hints */
h1, h2 { page-break-before: auto; page-break-after: avoid; }
table   { page-break-inside: avoid; }
pre, table[data-code-block] { page-break-inside: avoid; }

/* Hide the "Print this page" bar that some browsers add */
@media print {
    body { padding: 0; }
    @page { margin: 20mm; }
}
</style>
</head>
<body>
<div class="markdown-body">${html}</div>
<script>
    // Auto-trigger print dialog after a short delay to let content fully render
    window.onload = function() {
        setTimeout(function() { window.print(); }, 400);
    };
<\/script>
</body>
</html>`);
    win.document.close();
}

// --- printPreview() ---
function printPreview() {
    const printArea = document.getElementById('print-area');
    printArea.innerHTML = '<div class="markdown-body">' + document.getElementById('html-preview').innerHTML + '</div>';
    window.print();
}

// --- updateStatusBar() ---
function updateStatusBar() {
    const text = markdownInput.value;
    const charCount = text.length;
    const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    const readMin = Math.max(1, Math.round(wordCount / 200));
    document.getElementById('status-words').textContent = 'Words: ' + wordCount;
    document.getElementById('status-chars').textContent = 'Characters: ' + charCount;
    document.getElementById('status-read').textContent = '~' + readMin + ' min read';
}

// --- Find & Replace ---
let findMatches = [];
let findCurrentIndex = -1;

function openFindBar(withReplace) {
    const bar = document.getElementById('find-bar');
    const replaceRow = document.getElementById('replace-row');
    bar.classList.add('open');
    replaceRow.style.display = withReplace ? 'flex' : 'none';
    document.getElementById('find-input').focus();
    document.getElementById('find-input').select();
}

function closeFindBar() {
    document.getElementById('find-bar').classList.remove('open');
    document.getElementById('find-count').textContent = '';
    findMatches = [];
    findCurrentIndex = -1;
    // Clear highlights from both panes
    highlightInPreview('', -1);
    renderTextareaHighlights('', -1);
}

function doFind() {
    const query = document.getElementById('find-input').value;
    const text = markdownInput.value;
    findMatches = [];
    findCurrentIndex = -1;

    if (!query) {
        document.getElementById('find-count').textContent = '';
        return;
    }

    // Build list of all match positions
    const lower = text.toLowerCase();
    const lowerQ = query.toLowerCase();
    let pos = 0;
    while ((pos = lower.indexOf(lowerQ, pos)) !== -1) {
        findMatches.push(pos);
        pos += lowerQ.length;
    }

    document.getElementById('find-count').textContent =
        findMatches.length > 0 ? (findCurrentIndex + 1) + '/' + findMatches.length : 'No results';

    if (findMatches.length > 0) {
        findCurrentIndex = 0;
        highlightMatch();
    }

    // Also highlight in the textarea overlay (live as-you-type)
    renderTextareaHighlights(query, findCurrentIndex);
}

function highlightMatch(moveFocus) {
    if (findMatches.length === 0) return;
    const pos = findMatches[findCurrentIndex];
    const query = document.getElementById('find-input').value;

    // Scroll textarea accurately using a temporary selection trick
    // setSelectionRange + scrollIntoView via a hidden caret approach
    scrollTextareaToPos(markdownInput, pos);

    // Only select/focus the textarea when user explicitly navigates (prev/next)
    if (moveFocus) {
        markdownInput.focus({ preventScroll: true });
        markdownInput.setSelectionRange(pos, pos + query.length);
        // Re-apply our calculated scroll (browser may reset it on focus)
        scrollTextareaToPos(markdownInput, pos);
    }

    // Highlight all matches in the preview pane
    highlightInPreview(query, findCurrentIndex);

    document.getElementById('find-count').textContent = (findCurrentIndex + 1) + '/' + findMatches.length;
}

// Scroll a textarea to show the character at position `pos`
// Uses a hidden mirror div to measure exact pixel position
// Temporarily disables sync-scroll so find navigation doesn't fight with it
function scrollTextareaToPos(textarea, pos) {
    isSyncingScroll = true; // pause sync scroll during find navigation
    setTimeout(() => { isSyncingScroll = false; }, 100);
    // Create/reuse a hidden mirror div that mimics the textarea's layout
    let mirror = document.getElementById('_ta_mirror');
    if (!mirror) {
        mirror = document.createElement('div');
        mirror.id = '_ta_mirror';
        mirror.style.cssText = [
            'position:absolute', 'top:-9999px', 'left:-9999px',
            'visibility:hidden', 'white-space:pre-wrap', 'word-wrap:break-word',
            'overflow-wrap:break-word'
        ].join(';');
        document.body.appendChild(mirror);
    }

    const style = getComputedStyle(textarea);
    mirror.style.width       = textarea.clientWidth + 'px';
    mirror.style.fontFamily  = style.fontFamily;
    mirror.style.fontSize    = style.fontSize;
    mirror.style.fontWeight  = style.fontWeight;
    mirror.style.lineHeight  = style.lineHeight;
    mirror.style.padding     = style.padding;
    mirror.style.border      = style.border;
    mirror.style.boxSizing   = style.boxSizing;

    // Put text up to pos, then a marker span
    const before = textarea.value.substring(0, pos);
    mirror.innerHTML = escapeHtml(before) + '<span id="_ta_caret">\u200b</span>';

    const caret = document.getElementById('_ta_caret');
    const caretTop = caret.offsetTop;

    // Scroll so the caret is vertically centered in the textarea
    const half = textarea.clientHeight / 2;
    textarea.scrollTop = Math.max(0, caretTop - half);
}

function escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function highlightInPreview(query, activeIndex) {
    // Remove any existing highlights
    const preview = document.getElementById('html-preview');
    const existing = preview.querySelectorAll('mark.find-highlight');
    existing.forEach(m => {
        const parent = m.parentNode;
        parent.replaceChild(document.createTextNode(m.textContent), m);
        parent.normalize();
    });

    if (!query) return;

    // Walk all text nodes in the preview and wrap matches in <mark>
    const walker = document.createTreeWalker(preview, NodeFilter.SHOW_TEXT, null, false);
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);

    let matchCount = 0;
    nodes.forEach(textNode => {
        const text = textNode.nodeValue;
        const lower = text.toLowerCase();
        const lowerQ = query.toLowerCase();
        let idx = lower.indexOf(lowerQ);
        if (idx === -1) return;

        const frag = document.createDocumentFragment();
        let last = 0;
        while (idx !== -1) {
            // Text before match
            if (idx > last) frag.appendChild(document.createTextNode(text.slice(last, idx)));
            // The match wrapped in <mark>
            const mark = document.createElement('mark');
            mark.className = 'find-highlight' + (matchCount === activeIndex ? ' find-highlight-active' : '');
            mark.textContent = text.slice(idx, idx + query.length);
            frag.appendChild(mark);
            matchCount++;
            last = idx + query.length;
            idx = lower.indexOf(lowerQ, last);
        }
        if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
        textNode.parentNode.replaceChild(frag, textNode);
    });

    // Scroll active mark into view — use 'auto' (instant) to avoid drift from smooth animation
    const activeEl = preview.querySelector('mark.find-highlight-active');
    if (activeEl) {
        const previewContainer = document.getElementById('preview-tab');
        const markRect = activeEl.getBoundingClientRect();
        const containerRect = previewContainer.getBoundingClientRect();
        // Center the match vertically in the preview scroll container
        const markCenter = markRect.top - containerRect.top + previewContainer.scrollTop + (markRect.height / 2);
        previewContainer.scrollTop = markCenter - (previewContainer.clientHeight / 2);
    }
}

// -------------------------------------------------------
// syncOverlayWidth()
// The overlay must have the EXACT same content width as the
// textarea — including accounting for the vertical scrollbar.
// textarea.clientWidth already excludes the scrollbar, so we
// use that directly.  We call this on resize and before rendering.
// -------------------------------------------------------
function syncOverlayWidth() {
    const overlay = document.getElementById('textarea-highlight-overlay');
    if (!overlay) return;
    // clientWidth excludes the scrollbar; offsetWidth includes border+padding
    overlay.style.width = markdownInput.clientWidth + 'px';
}

// -------------------------------------------------------
// renderTextareaHighlights()
// Draws coloured highlight boxes on the overlay div that
// sits on top of the textarea.  The overlay contains the
// same plain text as the textarea (with colour:transparent)
// so the browser lays out text identically; <mark> spans
// then colour the matching regions.
// -------------------------------------------------------
function renderTextareaHighlights(query, activeIndex) {
    const overlay = document.getElementById('textarea-highlight-overlay');
    if (!overlay) return;

    // Ensure overlay width exactly matches textarea text-area width (excl. scrollbar)
    syncOverlayWidth();

    // Sync the overlay's scroll position with the textarea each time
    overlay.scrollTop = markdownInput.scrollTop;

    if (!query || findMatches.length === 0) {
        overlay.innerHTML = '';
        return;
    }

    const text = markdownInput.value;
    const lowerQ = query.toLowerCase();
    let html = '';
    let last = 0;

    for (let m = 0; m < findMatches.length; m++) {
        const start = findMatches[m];
        const end   = start + query.length;

        // Text before this match — escape HTML but preserve whitespace structure
        if (start > last) {
            html += escapeHtmlOverlay(text.slice(last, start));
        }

        // The match itself wrapped in a <mark>
        const cls = m === activeIndex ? 'find-highlight find-highlight-active' : 'find-highlight';
        html += '<mark class="' + cls + '">' + escapeHtmlOverlay(text.slice(start, end)) + '</mark>';
        last = end;
    }

    // Remaining text after last match
    if (last < text.length) {
        html += escapeHtmlOverlay(text.slice(last));
    }

    overlay.innerHTML = html;

    // Keep overlay scroll in sync (setting innerHTML resets scrollTop)
    overlay.scrollTop = markdownInput.scrollTop;
}

// Escape for overlay HTML content — preserves newlines via white-space:pre-wrap
// Do NOT convert \n to <br> — the CSS white-space:pre-wrap handles them natively,
// and using <br> would double the line height causing highlight misalignment.
function escapeHtmlOverlay(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function findNext() {
    if (findMatches.length === 0) { doFind(); return; }
    findCurrentIndex = (findCurrentIndex + 1) % findMatches.length;
    highlightMatch(true);
    renderTextareaHighlights(document.getElementById('find-input').value, findCurrentIndex);
}

function findPrev() {
    if (findMatches.length === 0) { doFind(); return; }
    findCurrentIndex = (findCurrentIndex - 1 + findMatches.length) % findMatches.length;
    highlightMatch(true);
    renderTextareaHighlights(document.getElementById('find-input').value, findCurrentIndex);
}

function replaceCurrent() {
    if (findMatches.length === 0) return;
    const query = document.getElementById('find-input').value;
    const replacement = document.getElementById('replace-input').value;
    const pos = findMatches[findCurrentIndex];
    const text = markdownInput.value;
    markdownInput.value = text.substring(0, pos) + replacement + text.substring(pos + query.length);
    convertMarkdown();
    saveDraft();
    doFind(); // re-scan
}

function replaceAll() {
    const query = document.getElementById('find-input').value;
    const replacement = document.getElementById('replace-input').value;
    if (!query) return;
    const flags = 'gi';
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const count = (markdownInput.value.match(new RegExp(escaped, flags)) || []).length;
    markdownInput.value = markdownInput.value.replace(new RegExp(escaped, flags), replacement);
    convertMarkdown();
    saveDraft();
    doFind();
    showNotification('Replaced ' + count + ' occurrence' + (count !== 1 ? 's' : '') + '.');
}

// Live find-as-you-type
document.getElementById('find-input').addEventListener('input', doFind);
document.getElementById('find-input').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') { e.shiftKey ? findPrev() : findNext(); e.preventDefault(); }
    if (e.key === 'Escape') { closeFindBar(); }
});
document.getElementById('replace-input').addEventListener('keydown', function(e) {
    if (e.key === 'Escape') { closeFindBar(); }
});

// --- Keyboard shortcuts ---
document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); downloadStandalone(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); clearAll(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') { e.preventDefault(); saveAsPDF(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') { e.preventDefault(); openFindBar(false); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'h') { e.preventDefault(); openFindBar(true); }
});

// --- Dark Mode (#9) ---
const DARK_KEY = 'mdconverter_dark';
let isDark = (function() {
    try { return localStorage.getItem(DARK_KEY) === 'true'; } catch(e) { return false; }
})();

function applyDarkMode() {
    document.body.classList.toggle('dark-mode', isDark);
    const btn = document.getElementById('dark-mode-btn');
    if (btn) {
        // Use the toggle checkmark style (::before pseudo-element via .active class)
        btn.classList.toggle('active', isDark);
    }
}

function toggleDarkMode() {
    isDark = !isDark;
    try { localStorage.setItem(DARK_KEY, isDark); } catch(e) {}
    applyDarkMode();
}

// --- Line Numbers ---
// Uses canvas.measureText() to count visual rows per logical line,
// then assigns height = rows × lineHeightPx to each line number span.

let _lnCanvas = null;
let _lnLineH  = 0;   // CSS line-height in px
let _lnColW   = 0;   // available text width in px

function getLineMetrics() {
    const style    = getComputedStyle(markdownInput);
    const fontSize = parseFloat(style.fontSize);
    const lhRaw    = style.lineHeight;
    if (lhRaw === 'normal') {
        _lnLineH = fontSize * 1.2;
    } else if (lhRaw.endsWith('px')) {
        _lnLineH = parseFloat(lhRaw);
    } else {
        _lnLineH = fontSize * parseFloat(lhRaw);
    }
    const paddingL = parseFloat(style.paddingLeft)  || 0;
    const paddingR = parseFloat(style.paddingRight) || 0;
    _lnColW = markdownInput.clientWidth - paddingL - paddingR;

    if (!_lnCanvas) _lnCanvas = document.createElement('canvas');
    const ctx = _lnCanvas.getContext('2d');
    ctx.font = style.fontWeight + ' ' + style.fontSize + ' ' + style.fontFamily;
    return ctx;
}

function countVisualRows(ctx, lineText) {
    if (_lnColW <= 0 || lineText === '') return 1;
    const text   = lineText.replace(/\t/g, '        ');
    const words  = text.split(' ');
    const spaceW = ctx.measureText(' ').width;
    let rows = 1, currentW = 0;
    for (let w = 0; w < words.length; w++) {
        const wordW = ctx.measureText(words[w]).width;
        if (w === 0) {
            currentW = wordW;
            // Handle very long first word
            if (currentW > _lnColW) {
                const extra = Math.floor(currentW / _lnColW);
                rows += extra;
                currentW = currentW % _lnColW;
            }
        } else {
            if (currentW + spaceW + wordW > _lnColW) {
                rows++;
                currentW = wordW;
                // Handle very long subsequent word
                while (currentW > _lnColW) { rows++; currentW -= _lnColW; }
            } else {
                currentW += spaceW + wordW;
            }
        }
    }
    return rows;
}

function updateLineNumbers() {
    const lineNumbers = document.getElementById('line-numbers');
    if (!lineNumbers) return;

    const normalized = markdownInput.value.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = normalized.split('\n');

    const ctx = getLineMetrics();
    const lh  = _lnLineH;

    let html = '';
    for (let i = 0; i < lines.length; i++) {
        const rows = countVisualRows(ctx, lines[i]);
        const h = Math.round(rows * lh);
        html += '<span style="height:' + h + 'px;line-height:normal;display:flex;align-items:flex-start;justify-content:flex-end;">' + (i + 1) + '</span>';
    }

    const spacer = markdownInput.clientHeight;
    html += '<span style="height:' + spacer + 'px;display:block;flex-shrink:0;"></span>';

    lineNumbers.innerHTML = html;
    lineNumbers.scrollTop = markdownInput.scrollTop;
}

// Debounce line number updates triggered by typing — the measurement loop
// can be slow on large files, so we delay it until the user pauses typing.
let _lnDebounceTimer = null;
function updateLineNumbersDebounced() {
    clearTimeout(_lnDebounceTimer);
    _lnDebounceTimer = setTimeout(updateLineNumbers, 120);
}

markdownInput.addEventListener('input', updateLineNumbersDebounced);
markdownInput.addEventListener('scroll', function() {
    const ln = document.getElementById('line-numbers');
    if (ln) {
        // Use rAF so we read scrollTop after the browser has settled
        requestAnimationFrame(() => { ln.scrollTop = markdownInput.scrollTop; });
    }
    // Keep the find-highlight overlay in sync with the textarea scroll
    const overlay = document.getElementById('textarea-highlight-overlay');
    if (overlay && overlay.innerHTML) {
        overlay.scrollTop = markdownInput.scrollTop;
    }
});

// Re-measure if the panel is resized (e.g. drag resizer changes textarea width)
// Also sync the overlay width on resize so it always matches textarea.clientWidth
new ResizeObserver(() => {
    updateLineNumbers();
    syncOverlayWidth();
}).observe(markdownInput);

// --- Drag & Drop (#10) ---
const editorWrapper = document.getElementById('editor-wrapper');
const dropOverlay   = document.getElementById('drop-overlay');

function loadFileContent(file) {
    if (!file) return;
    const validTypes = ['.md', '.markdown', '.txt'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!validTypes.includes(ext) && file.type !== 'text/plain' && file.type !== 'text/markdown') {
        showNotification(currentLang === 'fr'
            ? 'Type de fichier non pris en charge. Utilisez .md, .markdown ou .txt'
            : 'Unsupported file type. Use .md, .markdown, or .txt', 'error');
        return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
        if (markdownInput.value.trim()) {
            if (!confirm(currentLang === 'fr'
                ? 'Remplacer le contenu actuel par le fichier déposé ?'
                : 'Replace current content with the dropped file?')) return;
        }
        markdownInput.value = e.target.result;
        convertMarkdown();
        saveDraft();
        updateLineNumbers();
        updateStatusBar();
        showNotification(translations.notifications.fileLoaded[currentLang]);
    };
    reader.readAsText(file);
}

// Show overlay when dragging a file over the editor wrapper
editorWrapper.addEventListener('dragenter', function(e) {
    e.preventDefault();
    if (e.dataTransfer.types.includes('Files')) {
        dropOverlay.classList.add('active');
    }
});

editorWrapper.addEventListener('dragover', function(e) {
    e.preventDefault();
});

editorWrapper.addEventListener('dragleave', function(e) {
    // Only hide if leaving the wrapper itself (not a child element)
    if (!editorWrapper.contains(e.relatedTarget)) {
        dropOverlay.classList.remove('active');
    }
});

editorWrapper.addEventListener('drop', function(e) {
    e.preventDefault();
    e.stopPropagation();
    dropOverlay.classList.remove('active');
    const file = e.dataTransfer.files[0];
    if (file) loadFileContent(file);
});

// Also handle drop on the whole left panel (in case overlay isn't covering)
document.getElementById('left-panel').addEventListener('dragover', function(e) { e.preventDefault(); });
document.getElementById('left-panel').addEventListener('drop', function(e) {
    e.preventDefault();
    dropOverlay.classList.remove('active');
    const file = e.dataTransfer.files[0];
    if (file) loadFileContent(file);
});

// Initial load — restore language, draft, and status bar
applyLanguage();
applyDarkMode();
loadDraft();
updateLineNumbers();
updateStatusBar();
