const API_BASE = "https://cloudphase2-eagfg4cvdjgvedf2.canadacentral-01.azurewebsites.net/api/dietdata"; // << change if needed

// Utility: find a key by possible aliases, case-insensitive.
function pickKey(row, candidates) {
  const keys = Object.keys(row || {});
  const lowered = keys.reduce((m, k) => (m[k.toLowerCase()] = k, m), {});
  for (const c of candidates) {
    const lk = c.toLowerCase();
    if (lk in lowered) return lowered[lk];
    // try remove spaces and parentheses
    const matched = keys.find(k => k.replace(/[()\s_]/g,'').toLowerCase() === lk.replace(/[()\s_]/g,''));
    if (matched) return matched;
  }
  return null;
}

let charts = [];
function resetCharts() { charts.forEach(c => c.destroy()); charts = []; }

async function loadData() {
  const dataset = document.getElementById('dataset').value;
  const cuisineFilter = (document.getElementById('filterCuisine').value || '').toLowerCase().trim();

  const url = `${API_BASE}?blob=${encodeURIComponent(dataset)}`;
  const res = await fetch(url);
  const json = await res.json();

  // Metadata panel
  const meta = [
    `Blob: ${json.blob}`,
    `Record count (total): ${json.record_count}`,
    `Execution time: ${json.execution_time_ms} ms`,
    `Allowed: ${(json.allowed_blobs || []).join(', ')}`
  ].join('\n');
  document.getElementById('meta').textContent = meta;

  const preview = Array.isArray(json.data_preview) ? json.data_preview : [];

  // Column detection (works with All_Diets/dash/keto)
  // Common columns per your files: Diet_type / Cuisine_type / Protein(g) / Carbs(g) / Fat(g)
  const sample = preview[0] || {};
  const K_DIET    = pickKey(sample, ['Diet_type', 'Diet', 'diet_type', 'diet']);
  const K_CUISINE = pickKey(sample, ['Cuisine_type', 'Cuisine', 'cuisine_type', 'cuisine']);
  const K_PROT    = pickKey(sample, ['Protein(g)', 'Protein', 'protein(g)', 'protein']);
  const K_CARBS   = pickKey(sample, ['Carbs(g)', 'Carbs', 'carbs(g)', 'carbs']);
  const K_FAT     = pickKey(sample, ['Fat(g)', 'Fat', 'fat(g)', 'fat']);

  const rows = preview.filter(r => {
    if (!cuisineFilter || !K_CUISINE) return true;
    return String(r[K_CUISINE] || '').toLowerCase().includes(cuisineFilter);
  });

  // 1) Bar: Top cuisines by count (from preview)
  const byCuisine = {};
  rows.forEach(r => {
    const c = K_CUISINE ? (r[K_CUISINE] || 'unknown') : 'unknown';
    byCuisine[c] = (byCuisine[c] || 0) + 1;
  });
  const cuisineLabels = Object.keys(byCuisine).sort((a,b)=>byCuisine[b]-byCuisine[a]).slice(0,10);
  const cuisineValues = cuisineLabels.map(k => byCuisine[k]);

  // 2) Scatter: Protein vs Fat (requires numeric values)
  const scatterPts = rows.map(r => ({
    x: K_PROT ? Number(r[K_PROT]) : NaN,
    y: K_FAT  ? Number(r[K_FAT])  : NaN
  })).filter(p => Number.isFinite(p.x) && Number.isFinite(p.y));

  // 3) Pie: Diet type share
  const byDiet = {};
  rows.forEach(r => {
    const d = K_DIET ? (r[K_DIET] || 'unknown') : 'unknown';
    byDiet[d] = (byDiet[d] || 0) + 1;
  });
  const dietLabels = Object.keys(byDiet);
  const dietValues = dietLabels.map(k => byDiet[k]);

  // Render charts
  resetCharts();
  charts.push(new Chart(document.getElementById('barCuisine'), {
    type: 'bar',
    data: { labels: cuisineLabels, datasets: [{ label: 'Count by cuisine (preview)', data: cuisineValues }] },
    options: { responsive: true, plugins: { legend: { display: false } } }
  }));

  charts.push(new Chart(document.getElementById('scatterPF'), {
    type: 'scatter',
    data: { datasets: [{ label: 'Protein vs Fat (preview)', data: scatterPts, pointRadius: 4 }] },
    options: {
      responsive: true,
      scales: { x: { title: { text: 'Protein (g)', display: true } }, y: { title: { text: 'Fat (g)', display: true } } }
    }
  }));

  charts.push(new Chart(document.getElementById('pieDiet'), {
    type: 'pie',
    data: { labels: dietLabels, datasets: [{ data: dietValues }] },
    options: { responsive: true }
  }));
}

document.getElementById('load').addEventListener('click', loadData);
window.addEventListener('DOMContentLoaded', loadData);