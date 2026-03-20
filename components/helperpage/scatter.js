import { fetchDataset, extractKeys, populateDatasets, downloadChartPNG, getParam, setParams } from "../../common.js";

let chart;
const destroyChart = () => (chart && chart.destroy(), chart = null);
const labelFor = (axis) => axis === "protein" ? "Protein (g)" : axis === "carbs" ? "Carbs (g)" : "Fat (g)";

async function load(){
  const dsSel = document.getElementById("dataset");
  const ds = dsSel.value;
  const axX = document.getElementById("axisX").value;
  const axY = document.getElementById("axisY").value;
  const cuisineFilter = (document.getElementById("filterCuisine").value || "").toLowerCase().trim();

  setParams({ blob: ds, x: axX, y: axY, q: cuisineFilter });

  const json = await fetchDataset(ds);
  document.getElementById("meta").textContent =
    `Blob: ${json.blob}\nRecords: ${json.record_count}\nExec: ${json.execution_time_ms} ms`;

  const preview = Array.isArray(json.data_preview) ? json.data_preview : [];
  const { K_CUISINE, K_PROT, K_CARBS, K_FAT } = extractKeys(preview[0] || {});
  const getVal = (r, axis) => axis === "protein" ? Number(r[K_PROT]) : axis === "carbs" ? Number(r[K_CARBS]) : Number(r[K_FAT]);

  const rows = preview.filter(r => !cuisineFilter || (K_CUISINE && String(r[K_CUISINE]||'').toLowerCase().includes(cuisineFilter)));
  const points = rows.map(r => ({ x: getVal(r, axX), y: getVal(r, axY) }))
                     .filter(p => Number.isFinite(p.x) && Number.isFinite(p.y));

  destroyChart();
  chart = new Chart(document.getElementById("scatterPF"), {
    type:"scatter",
    data:{ datasets:[{ label:`${labelFor(axX)} vs ${labelFor(axY)}`, data: points, pointRadius:4, backgroundColor:"#ffd400" }] },
    options:{
      responsive:true,
      plugins:{ tooltip:{ callbacks:{ label: ctx => `(${ctx.parsed.x}, ${ctx.parsed.y})` } } },
      scales:{
        x:{ title:{ display:true, text: labelFor(axX), color:"#b9b9c2" }, ticks:{ color:"#b9b9c2" } },
        y:{ title:{ display:true, text: labelFor(axY), color:"#b9b9c2" }, ticks:{ color:"#b9b9c2" } }
      }
    }
  });
}

async function init(){
  const blob = getParam("blob", "All_Diets.csv");
  const axX  = getParam("x", "protein");
  const axY  = getParam("y", "fat");
  const q    = getParam("q", "");

  const probe = await fetchDataset(blob);
  const dsSel = document.getElementById("dataset");
  populateDatasets(dsSel, probe.allowed_blobs);
  dsSel.value = blob;

  document.getElementById("axisX").value = axX;
  document.getElementById("axisY").value = axY;
  document.getElementById("filterCuisine").value = q;

  document.getElementById("btnLoad").onclick = load;
  document.getElementById("btnDownload").onclick = () => chart && downloadChartPNG(chart, `scatter_${dsSel.value}.png`);
  await load();
}
init();