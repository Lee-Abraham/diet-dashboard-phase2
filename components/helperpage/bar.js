import { fetchDataset, extractKeys, populateDatasets, downloadChartPNG, getParam, setParams } from "../../common.js";

let chart;
const destroyChart = () => (chart && chart.destroy(), chart = null);
const updateTopNVal = () => document.getElementById("topNVal").textContent = document.getElementById("topN").value;

async function load(){
  try{
    const dsSel = document.getElementById("dataset");
    const ds = dsSel.value;
    const cuisineFilter = (document.getElementById("filterCuisine").value || "").toLowerCase().trim();
    const topN = parseInt(document.getElementById("topN").value, 10);
    setParams({ blob: ds, q: cuisineFilter, n: topN });

    const json = await fetchDataset(ds);
    document.getElementById("meta").textContent =
      `Blob: ${json.blob}\nRecords: ${json.record_count}\nExec: ${json.execution_time_ms} ms`;

    const preview = Array.isArray(json.data_preview) ? json.data_preview : [];
    const { K_CUISINE } = extractKeys(preview[0] || {});
    const rows = preview.filter(r => !cuisineFilter || (K_CUISINE && String(r[K_CUISINE]||'').toLowerCase().includes(cuisineFilter)));

    const byCuisine = {};
    rows.forEach(r => { const c = K_CUISINE ? (r[K_CUISINE] || 'unknown') : 'unknown'; byCuisine[c] = (byCuisine[c]||0)+1; });
    const entries = Object.entries(byCuisine).sort((a,b)=>b[1]-a[1]).slice(0, topN);
    const labels = entries.map(e=>e[0]);
    const values = entries.map(e=>e[1]);

    destroyChart();
    chart = new Chart(document.getElementById("barCuisine"), {
      type: "bar",
      data: { labels, datasets: [{ label: "Count (preview)", data: values, backgroundColor: "#ffd400", borderColor:"#ffb800" }] },
      options: {
        responsive: true,
        plugins: { legend: { display:false }, tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y} recipes` } } },
        scales: { x:{ ticks:{ color:"#b9b9c2" } }, y:{ ticks:{ color:"#b9b9c2" } } }
      }
    });
  }catch(err){
    document.getElementById("meta").textContent = "Error: " + err.message;
    console.error(err);
  }
}

async function init(){
  const blob = getParam("blob", "All_Diets.csv");
  const q    = getParam("q", "");
  const n    = parseInt(getParam("n", "10"), 10);

  const probe = await fetchDataset(blob);
  const dsSel = document.getElementById("dataset");
  populateDatasets(dsSel, probe.allowed_blobs);
  dsSel.value = blob;

  document.getElementById("filterCuisine").value = q;
  document.getElementById("topN").value = isNaN(n)?10:n;
  updateTopNVal();

  document.getElementById("btnLoad").onclick = load;
  document.getElementById("topN").oninput = updateTopNVal;
  document.getElementById("btnDownload").onclick = () => chart && downloadChartPNG(chart, `bar_${dsSel.value}.png`);

  await load();
}
init();