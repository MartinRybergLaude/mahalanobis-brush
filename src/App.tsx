import { useRef, FormEvent, useState, useCallback, useMemo } from "react";
import Chart, { DataPoint, SamplingMethod } from "./components/Chart";
import linedata from "./data/line.json";
import scurvedata from "./data/multiple-spheres.json";
import clusterdata from "./data/sphere.json";
import donutdata from "./data/torus.json";

type PerformanceData = {
  samplingTime: number;
  covarianceTime: number;
  totalPoints: number;
  sampledPoints: number;
  method: string;
};

function App() {
  const formRef = useRef<HTMLFormElement>(null);
  const [datasetSize, setDatasetSize] = useState<number>(5000);
  const [selectedX, setSelectedX] = useState<number>(50);
  const [selectedY, setSelectedY] = useState<number>(50);
  const [percentage, setPercentage] = useState<number>(60);
  const [dimensions, setDimensions] = useState<number>(2);
  const [subsampleSize, setSubsampleSize] = useState<number | undefined>(
    undefined
  );
  const [showSubsampleControls, setShowSubsampleControls] = useState(false);
  const [samplingMethod, setSamplingMethod] = useState<
    "random" | "systematic" | "cluster"
  >("random");
  const [performanceData, setPerformanceData] =
    useState<PerformanceData | null>(null);

  const datasets = useMemo(
    () => ({
      line: (linedata as DataPoint[]).slice(0, datasetSize),
      scurve: (scurvedata as DataPoint[]).slice(0, datasetSize),
      cluster: (clusterdata as DataPoint[]).slice(0, datasetSize),
      donut: (donutdata as DataPoint[]).slice(0, datasetSize),
    }),
    [datasetSize]
  );

  const [selectedDataset, setSelectedDataset] = useState<
    "line" | "scurve" | "cluster" | "donut"
  >("line");

  const dataset = useMemo(() => {
    return datasets[selectedDataset];
  }, [selectedDataset, datasets]);

  // Chop away the dimensions of the dataset to the selected number of dimensions
  const reducedDataset = useMemo(() => {
    return dataset.map((point) => point.slice(0, dimensions));
  }, [dataset, dimensions]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    setSelectedX(Number(formData.get("x")));
    setSelectedY(Number(formData.get("y")));
    setPercentage(Number(formData.get("percentage")));
    setDimensions(Number(formData.get("dimensions")));
    setSubsampleSize(Number(formData.get("subsampleSize")));
    setSamplingMethod(formData.get("samplingMethod") as SamplingMethod);
    setDatasetSize(Number(formData.get("size")));
  };

  const handlePerformanceData = useCallback((data: PerformanceData) => {
    setPerformanceData(data);
  }, []);

  const selectedPoint = useMemo(() => {
    return [selectedX, selectedY, ...Array(dimensions - 2).fill(0)];
  }, [selectedX, selectedY, dimensions]);

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
              htmlFor="size"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Dataset size
            </label>
            <input
              type="number"
              id="size"
              name="size"
              defaultValue={datasetSize}
              min="1"
              max="100000"
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
        <div className="mb-4 p-4 bg-white rounded-lg shadow">
          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="enableSubsampling"
                checked={showSubsampleControls}
                onChange={(e) => {
                  setShowSubsampleControls(e.target.checked);
                  if (!e.target.checked) setSubsampleSize(undefined);
                }}
                className="mr-2"
              />
              Enable Subsampling
            </label>

            {showSubsampleControls && (
              <>
                <div className="flex items-center gap-2">
                  <label>Subsample Size:</label>
                  <input
                    type="number"
                    name="subsampleSize"
                    min="10"
                    max={reducedDataset.length}
                    defaultValue={subsampleSize ?? reducedDataset.length}
                    className="border rounded px-2 py-1 w-24"
                  />
                  <span className="text-sm text-gray-500">
                    (Total points: {reducedDataset.length})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <label>Sampling Method:</label>
                  <select
                    name="samplingMethod"
                    defaultValue={samplingMethod}
                    className="border rounded px-2 py-1"
                  >
                    <option value="random">Random</option>
                    <option value="systematic">Systematic</option>
                    <option value="cluster">Cluster-based</option>
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Performance Metrics Display */}
          {performanceData && (
            <div className="mt-4 text-sm text-gray-600">
              <h4 className="font-semibold">Performance Metrics:</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p>
                    Sampling Time: {performanceData.samplingTime.toFixed(2)}ms
                  </p>
                  <p>
                    Covariance Time: {performanceData.covarianceTime.toFixed(2)}
                    ms
                  </p>
                </div>
                <div>
                  <p>Method: {performanceData.method}</p>
                  <p>
                    Sample Size: {performanceData.sampledPoints}/
                    {performanceData.totalPoints} points
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </form>

      <Chart
        data={reducedDataset}
        selectedPoint={selectedPoint}
        percentage={percentage}
        subsampleSize={subsampleSize}
        samplingMethod={samplingMethod}
        onPerformanceData={handlePerformanceData}
      />
    </div>
  );
}

export default App;
