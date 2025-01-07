import { useRef, FormEvent, useState } from "react";
import Chart, { DataPoint } from "./components/Chart";
import linedata from "./data/line.json";
import scurvedata from "./data/multiple-spheres.json";
import clusterdata from "./data/sphere.json";
import donutdata from "./data/torus.json";

function App() {
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedX, setSelectedX] = useState<number>(50);
  const [selectedY, setSelectedY] = useState<number>(50);
  const [percentage, setPercentage] = useState<number>(60);
  const [dimensions, setDimensions] = useState<number>(2);

  const datasets = {
    line: (linedata as DataPoint[]).slice(0, 5000),
    scurve: (scurvedata as DataPoint[]).slice(0, 5000),
    cluster: (clusterdata as DataPoint[]).slice(0, 5000),
    donut: (donutdata as DataPoint[]).slice(0, 5000),
  };

  const [selectedDataset, setSelectedDataset] =
    useState<keyof typeof datasets>("line");

  const dataset = datasets[selectedDataset];

  // Chop away the dimensions of the dataset to the selected number of dimensions
  const reducedDataset = dataset.map((point) => point.slice(0, dimensions));

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    setSelectedX(Number(formData.get("x")));
    setSelectedY(Number(formData.get("y")));
    setPercentage(Number(formData.get("percentage")));
    setDimensions(Number(formData.get("dimensions")));
  };

  return (
    <div className="container mx-auto p-4">
      <form ref={formRef} onSubmit={handleSubmit} className="mb-6 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <label
              htmlFor="dataset"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Select Dataset
            </label>
            <select
              id="dataset"
              value={selectedDataset}
              onChange={(e) =>
                setSelectedDataset(e.target.value as keyof typeof datasets)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="line">Line</option>
              <option value="scurve">Clusters</option>
              <option value="cluster">Sphere</option>
              <option value="donut">Torus</option>
            </select>
          </div>
          <div className="flex-1">
            <label
              htmlFor="dims"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Dimensions
            </label>
            <input
              type="number"
              id="dims"
              name="dimensions"
              defaultValue={dimensions}
              min="2"
              max="10"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex-1">
            <label
              htmlFor="x"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              X Value
            </label>
            <input
              type="number"
              id="x"
              name="x"
              defaultValue={selectedX}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex-1">
            <label
              htmlFor="y"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Y Value
            </label>
            <input
              type="number"
              id="y"
              name="y"
              defaultValue={selectedY}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex-1">
            <label
              htmlFor="percentage"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Percentage
            </label>
            <input
              type="number"
              id="percentage"
              name="percentage"
              defaultValue={percentage}
              min="0"
              max="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            className="flex-1 w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Update
          </button>
        </div>
      </form>

      <Chart
        data={reducedDataset}
        selectedPoint={[selectedX, selectedY, ...Array(dimensions - 2).fill(0)]}
        percentage={percentage}
      />
    </div>
  );
}

export default App;
