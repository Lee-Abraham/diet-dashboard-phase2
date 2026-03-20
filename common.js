// ===== common.js =====
export const API_BASE =
  "https://cloudphase2-eagfg4cvdjgvedf2.canadacentral-01.azurewebsites.net/api/dietdata";

export const getParam = (k, fallback="") => new URLSearchParams(location.search).get(k) ?? fallback;
export const setParams = (obj) => {
  const p = new URLSearchParams(location.search);
  Object.entries(obj).forEach(([k,v]) => (v == null ? p.delete(k) : p.set(k, v)));
  history.replaceState(null, "", `${location.pathname}?${p.toString()}`);
};

export async function fetchDataset(blobName){
  const url = `${API_BASE}?blob=${encodeURIComponent(blobName)}`;
  const res = await fetch(url);
  if(!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

export function pickKey(row, candidates){
  const keys = Object.keys(row || {});
  const lowered = keys.reduce((m, k) => (m[k.toLowerCase()] = k, m), {});
  for (const c of candidates) {
    const lk = c.toLowerCase();
    if (lk in lowered) return lowered[lk];
    const matched = keys.find(k => k.replace(/[()\s_]/g,'').toLowerCase() === lk.replace(/[()\s_]/g,''));
    if (matched) return matched;
  }
  return null;
}
export function extractKeys(sample){
  return {
    K_DIET:    pickKey(sample, ['Diet_type','Diet','diet_type','diet']),
    K_CUISINE: pickKey(sample, ['Cuisine_type','Cuisine','cuisine_type','cuisine']),
    K_PROT:    pickKey(sample, ['Protein(g)','Protein','protein(g)','protein']),
    K_CARBS:   pickKey(sample, ['Carbs(g)','Carbs','carbs(g)','carbs']),
    K_FAT:     pickKey(sample, ['Fat(g)','Fat','fat(g)','fat'])
  };
}
export function populateDatasets(selectEl, allowed){
  selectEl.innerHTML = "";
  (allowed || []).forEach(name => {
    const opt = document.createElement("option");
    opt.value = name; opt.textContent = name;
    selectEl.appendChild(opt);
  });
}
export function downloadChartPNG(chart, filename="chart.png"){
  const a = document.createElement("a");
  a.href = chart.toBase64Image("image/png", 1.0);
  a.download = filename;
  a.click();
}