import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { getSubsampledData } from "../utils/getSampledData";
import { getCovariance } from "../utils/getCovariance";
import { getMahalanobis } from "../utils/getMahalanobis";

export type DataPoint = number[];

export type SamplingMethod = "random" | "systematic" | "cluster";

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

        // Calculate covariance matrix for all dimensions
        const subsampledData = doSubsample
          ? await getSubsampledData({
              data,
              size: subsampleSize,
              method: samplingMethod,
            })
          : data;
        const covMatrix = await getCovariance({
          data: subsampledData,
          dims: DIMS,
        });

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
        dots.attr("fill", (d) => {
          const distance = getMahalanobis({
            point1: d,
            point2: selectedPoint,
            covMatrix,
          });
          return distance <= threshold ? "red" : "steelblue";
        });

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
  ]);

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
      </div>
    </div>
  );
}

export default Chart;
