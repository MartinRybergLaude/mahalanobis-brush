import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { getSubsampledData } from "../utils/getSampledData";
import { getCovariance } from "../utils/getCovariance";
import { getMahalanobis } from "../utils/getMahalanobis";

export type DataPoint = number[];

export type SamplingMethod = "random" | "systematic" | "cluster";

type SavedEntry = {
  id: number;
  timestamp: string;
  performanceData: PerformanceData;
  selectedCount: number;
  selectedPointIndices: Set<string>;
  differenceFromFirst?: number;
};

type ChartProps = {
  data: DataPoint[];
  selectedPoint: number[];
  percentage: number;
  subsampleSize?: number;
  samplingMethod?: SamplingMethod;
  doSubsample?: boolean;
  onPerformanceData?: (data: PerformanceData) => void;
  onLoadingChange?: (loading: boolean) => void;
};

type PerformanceData = {
  samplingTime: number;
  covarianceTime: number;
  totalPoints: number;
  sampledPoints: number;
  method: SamplingMethod | "full";
};

function Chart({
  data,
  selectedPoint,
  percentage,
  subsampleSize,
  samplingMethod = "random",
  onPerformanceData,
  onLoadingChange,
  doSubsample,
}: ChartProps) {
  const DIMS = data[0].length;
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [savedEntries, setSavedEntries] = useState<SavedEntry[]>([]);
  const [currentPerformanceData, setCurrentPerformanceData] =
    useState<PerformanceData | null>(null);
  const [selectedPointsCount, setSelectedPointsCount] = useState<number>(0);
  const [currentSelectedIndices, setCurrentSelectedIndices] = useState<
    Set<string>
  >(new Set());

  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return;

    const updateChart = async () => {
      try {
        onLoadingChange?.(true);

        // Clear any existing elements
        d3.select(svgRef.current).selectAll("*").remove();

        // Set dimensions based on container width
        const containerWidth =
          svgRef?.current?.parentElement?.clientWidth ?? 800;
        const width = containerWidth;
        const height = Math.min(600, containerWidth * 0.6);
        const margin = { top: 20, right: 30, bottom: 40, left: 50 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        // Create scales
        const xScale = d3.scaleLinear().domain([0, 100]).range([0, innerWidth]);

        const yScale = d3
          .scaleLinear()
          .domain([0, 100])
          .range([innerHeight, 0]);

        // Create SVG
        const svg = d3
          .select(svgRef.current)
          .attr("width", width)
          .attr("height", height);

        const g = svg
          .append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`);

        // Add axes
        g.append("g")
          .attr("transform", `translate(0,${innerHeight})`)
          .call(d3.axisBottom(xScale));

        g.append("g").call(d3.axisLeft(yScale));

        const startSubsample = performance.now();
        const subsampledData = doSubsample
          ? await getSubsampledData({
              data,
              size: subsampleSize,
              method: samplingMethod,
            })
          : data;
        const endSubsample = performance.now();

        // Calculate covariance matrix for all dimensions
        const startCov = performance.now();
        const covMatrix = await getCovariance({
          data: subsampledData,
          dims: DIMS,
        });
        const endCov = performance.now();

        const performanceData: PerformanceData = {
          samplingTime: endSubsample - startSubsample,
          covarianceTime: endCov - startCov,
          totalPoints: data.length,
          sampledPoints: subsampledData.length,
          method: samplingMethod,
        };
        onPerformanceData?.(performanceData);

        // Add dots
        const dots = g
          .selectAll("circle")
          .data(data)
          .enter()
          .append("circle")
          .attr("cx", (d) => xScale(d[0]))
          .attr("cy", (d) => yScale(d[1]))
          .attr("r", 3)
          .attr("fill", "steelblue");

        // Add cross at selected point
        if (selectedPoint) {
          const crossSize = 10;
          // Vertical line
          g.append("line")
            .attr("x1", xScale(selectedPoint[0]))
            .attr("y1", yScale(selectedPoint[1]) - crossSize)
            .attr("x2", xScale(selectedPoint[0]))
            .attr("y2", yScale(selectedPoint[1]) + crossSize)
            .attr("stroke", "black")
            .attr("stroke-width", 2);

          // Horizontal line
          g.append("line")
            .attr("x1", xScale(selectedPoint[0]) - crossSize)
            .attr("y1", yScale(selectedPoint[1]))
            .attr("x2", xScale(selectedPoint[0]) + crossSize)
            .attr("y2", yScale(selectedPoint[1]))
            .attr("stroke", "black")
            .attr("stroke-width", 2);
        }

        // Calculate distances and update colors
        const distances = data.map((point) => ({
          point,
          distance: getMahalanobis({
            point1: point,
            point2: selectedPoint,
            covMatrix,
          }),
        }));

        const sortedDistances = [...distances].sort(
          (a, b) => a.distance - b.distance
        );
        const thresholdIndex = Math.floor(data.length * (percentage / 100));
        const threshold = sortedDistances[thresholdIndex]?.distance ?? Infinity;

        // Update dot colors
        let selectedCount = 0;
        const selectedIndices = new Set<string>();

        dots.attr("fill", (d) => {
          const distance = getMahalanobis({
            point1: d,
            point2: selectedPoint,
            covMatrix,
          });
          const isSelected = distance <= threshold;
          if (isSelected) {
            selectedCount++;
            // Store the point as a string for comparison
            selectedIndices.add(JSON.stringify(d));
          }
          return isSelected ? "red" : "steelblue";
        });

        // Update the state with selected indices
        setSelectedPointsCount(selectedCount);
        setCurrentPerformanceData(performanceData);
        setCurrentSelectedIndices(selectedIndices);

        // Add axis labels
        g.append("text")
          .attr("x", innerWidth / 2)
          .attr("y", innerHeight + 35)
          .attr("text-anchor", "middle")
          .text(`Dimension ${1}`);

        g.append("text")
          .attr("transform", "rotate(-90)")
          .attr("x", -innerHeight / 2)
          .attr("y", -35)
          .attr("text-anchor", "middle")
          .text(`Dimension ${2}`);
      } finally {
        onLoadingChange?.(false);
      }
    };

    updateChart();
  }, [
    data,
    selectedPoint,
    percentage,
    onLoadingChange,
    doSubsample,
    samplingMethod,
    subsampleSize,
    DIMS,
    onPerformanceData,
  ]);

  // Add save handler
  const handleSave = () => {
    if (!currentPerformanceData) return;

    const newEntry: SavedEntry = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      performanceData: currentPerformanceData,
      selectedCount: selectedPointsCount,
      selectedPointIndices: currentSelectedIndices,
    };

    setSavedEntries((prev) => {
      const updated = [...prev, newEntry];

      // Calculate difference from first entry for all entries
      if (updated.length > 1) {
        const firstEntry = updated[0];

        updated.forEach((entry) => {
          if (entry === firstEntry) {
            entry.differenceFromFirst = 0;
          } else {
            // Calculate symmetric difference (points that are in one set but not both)
            let differentPoints = 0;

            // Check points selected in current entry but not in first
            entry.selectedPointIndices.forEach((point) => {
              if (!firstEntry.selectedPointIndices.has(point)) {
                differentPoints++;
              }
            });

            // Check points selected in first entry but not in current
            firstEntry.selectedPointIndices.forEach((point) => {
              if (!entry.selectedPointIndices.has(point)) {
                differentPoints++;
              }
            });

            // Calculate percentage of different points relative to total selected points
            const totalUniquePoints = new Set([
              ...Array.from(entry.selectedPointIndices),
              ...Array.from(firstEntry.selectedPointIndices),
            ]).size;

            entry.differenceFromFirst =
              (differentPoints / totalUniquePoints) * 100;
          }
        });
      }
      return updated;
    });
  };

  return (
    <div className="w-full px-4">
      <div className="max-w-7xl mx-auto">
        <div className="w-full">
          <svg
            ref={svgRef}
            className="w-full"
            style={{ minHeight: "400px" }}
          ></svg>
        </div>

        {/* Add save button */}
        <div className="mt-4 mb-6">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save Current State
          </button>
        </div>

        {/* Add results table */}
        {savedEntries.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2">Time</th>
                  <th className="border p-2">Method</th>
                  <th className="border p-2">Total Points</th>
                  <th className="border p-2">Sampled Points</th>
                  <th className="border p-2">Covariance Time (ms)</th>
                  <th className="border p-2">Selected Points</th>
                  <th className="border p-2">Diff from First (%)</th>
                </tr>
              </thead>
              <tbody>
                {savedEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="border p-2">{entry.timestamp}</td>
                    <td className="border p-2">
                      {entry.performanceData.method}
                    </td>
                    <td className="border p-2">
                      {entry.performanceData.totalPoints}
                    </td>
                    <td className="border p-2">
                      {entry.performanceData.sampledPoints}
                    </td>
                    <td className="border p-2">
                      {entry.performanceData.covarianceTime.toFixed(2)}
                    </td>
                    <td className="border p-2">{entry.selectedCount}</td>
                    <td className="border p-2">
                      {entry.differenceFromFirst !== undefined
                        ? `${entry.differenceFromFirst.toFixed(1)}%`
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Chart;
