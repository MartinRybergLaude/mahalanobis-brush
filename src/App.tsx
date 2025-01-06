import { useState } from "react";
import Chart, { DataPoint } from "./components/Chart";
import linedata from "./data/line.json";
import scurvedata from "./data/scurve.json";
import clusterdata from "./data/cluster.json";
import donutdata from "./data/donut.json";

function App() {
  const datasets = {
    line: (linedata as DataPoint[]).slice(0, 5000),
    scurve: (scurvedata as DataPoint[]).slice(0, 5000),
    cluster: (clusterdata as DataPoint[]).slice(0, 5000),
    donut: (donutdata as DataPoint[]).slice(0, 5000),
  };

  const [selectedDataset, setSelectedDataset] =
    useState<keyof typeof datasets>("line");

  return (
    <div className="App">
      <h1>Scatter Plot</h1>
      <select
        value={selectedDataset}
        onChange={(e) =>
          setSelectedDataset(e.target.value as keyof typeof datasets)
        }
        className="mb-4 p-2 border rounded"
      >
        <option value="line">Line</option>
        <option value="scurve">S-Curve</option>
        <option value="cluster">Cluster</option>
        <option value="donut">Donut</option>
      </select>
      <Chart data={datasets[selectedDataset]} />
    </div>
  );
}

export default App;
