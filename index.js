import { getRequestHeaders } from '../../../../script.js';

const PANEL_ID = 'lbx_panel';

// Fetch a lorebook (World Info) from the SillyTavern server by its name.
async function fetchWorldInfo(name) {
    const res = await fetch('/api/worldinfo/get', {
        method: 'POST',
        headers: getRequestHeaders(),
        body: JSON.stringify({ name }),
    });
    if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
    }
    return await res.json();
}

// Show the JSON in the panel so it can be copied, and offer a download link.
function showFallback(json, fileName) {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    jQuery('#lbx_output').val(json).show();
    jQuery('#lbx_copy').show();
    jQuery('#lbx_link')
        .attr({ href: url, download: fileName })
        .text(`Download ${fileName}`)
        .show();
}

async function onExport() {
    const name = jQuery('#lbx_name').val().trim();
    const status = jQuery('#lbx_status');

    if (!name) {
        status.text('Enter a lorebook name first.');
        return;
    }

    status.text('Exporting...');
    try {
        const data = await fetchWorldInfo(name);
        const json = JSON.stringify(data, null, 2);
        const fileName = `${name}.json`;
        const file = new File([json], fileName, { type: 'application/json' });

        // Native share sheet works well on phones (save to Files, Drive, etc.).
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({ files: [file], title: name });
                status.text(`Shared ${fileName}.`);
                return;
            } catch (err) {
                // User cancelled or share failed: fall through to the fallback.
            }
        }

        showFallback(json, fileName);
        status.text(`Ready: ${fileName}. Tap the link to save, or copy the text.`);
    } catch (err) {
        console.error('[Lorebook Exporter]', err);
        status.text(`Export failed: ${err.message}`);
    }
}

function copyOutput() {
    const text = jQuery('#lbx_output').val();
    navigator.clipboard.writeText(text)
        .then(() => jQuery('#lbx_status').text('Copied to clipboard.'))
        .catch(() => {
            jQuery('#lbx_output')[0].select();
            document.execCommand('copy');
            jQuery('#lbx_status').text('Copied.');
        });
}

function addPanel() {
    if (jQuery(`#${PANEL_ID}`).length) return;

    const defaultName = jQuery('#world_editor_select option:selected').text().trim();

    const html = `
    <div id="${PANEL_ID}" class="inline-drawer">
        <div class="inline-drawer-toggle inline-drawer-header">
            <b>Lorebook Exporter</b>
            <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
        </div>
        <div class="inline-drawer-content">
            <label for="lbx_name">Lorebook name</label>
            <input id="lbx_name" class="text_pole" type="text" value="${defaultName}">
            <div style="display:flex; gap:8px; margin-top:8px;">
                <input id="lbx_export" class="menu_button" type="button" value="Export">
            </div>
            <div id="lbx_status" style="margin-top:8px;"></div>
            <a id="lbx_link" href="#" style="display:none; margin-top:8px;"></a>
            <input id="lbx_copy" class="menu_button" type="button" value="Copy JSON" style="display:none; margin-top:8px;">
            <textarea id="lbx_output" class="text_pole" rows="8" style="display:none; margin-top:8px;" readonly></textarea>
        </div>
    </div>`;

    jQuery('#extensions_settings').append(html);
    jQuery('#lbx_export').on('click', onExport);
    jQuery('#lbx_copy').on('click', copyOutput);
}

jQuery(() => {
    addPanel();
});
