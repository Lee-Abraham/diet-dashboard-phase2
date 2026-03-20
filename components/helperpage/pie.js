import { fetchDataset, extractKeys, populateDatasets, downloadChartPNG, getParam, setParams } from "../../common.js";

let chart;
const destroyChart = () => (chart && chart.destroy(), chart = null);
const colors = (n) => Array.from({length:n}, (_,i)=> i%2 ? "#ffd400" : "#ffb800");

async function load(){
  const dsSel = document.getElementById("dataset");
  const ds = dsSel.value;
  const groupBy = document.getElementById("groupBy").value; // 'diet' | 'cuisine'
  const minCount = parseInt(document.getElementById("minCount").value, 10);
  setParams({ blob: ds, g: groupBy, m: minCount });

  const json = await fetchDataset(ds);
  document.getElementById("meta").textContent =
    `Blob: ${json.blob}\nRecords: ${json.record_count}\nExec: ${json.execution_time_ms} ms`;

  const preview = Array.isArray(json.data_preview) ? json.data_preview : [];
  const { K_DIET, K_CUISINE } = extractKeys(preview[0] || {});
  const key = groupBy === "diet" ? K_DIET : K_CUISINE;

  const counts = {};
  preview.forEach(r => { const k = key ? (r[key] || 'unknown') : 'unknown'; counts[k] = (counts[k] || 0) + 1; });

  const entries = Object.entries(counts).sort((a,b)=>b[1]-a[1]);
  const major = entries.filter(([,c]) => c >= minCount);
  const others = entries.filter(([,c]) => c < minCount).reduce((s,[,c])=>s+c,0);
  if (others > 0) major.push(["Other", others]);

  const labels = major.map(e=>e[0]);
  const values = major.map(e=>e[1]);

  destroyChart();
  chart = new Chart(document.getElementById("pie"), {
    type:"pie",
    data:{ labels, datasets:[{ data:values, backgroundColor: colors(values.length) }] },
    options:{ responsive:true, plugins:{ tooltip:{ callbacks:{ label: (ctx) => ` ${ctx.label}: ${ctx.parsed}` } } } }
  });
}

async function init(){
  const blob = getParam("blob", "All_Diets.csv");
  const g    = getParam("g", "diet");
  const m    = parseInt(getParam("m", "2"), 10);

  const probe = await fetchDataset(blob);
  const dsSel = document.getElementById("dataset");
  populateDatasets(dsSel, probe.allowed_blobs);
  dsSel.value = blob;

  document.getElementById("groupBy").value = g;
  document.getElementById("minCount").value = isNaN(m)?2:m;

  document.getElementById("btnLoad").onclick = load;
  document.getElementById("btnDownload").onclick = () => chart && downloadChartPNG(chart, `pie_${dsSel.value}.png`);
  await load();
}
init();