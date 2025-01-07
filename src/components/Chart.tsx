import { useEffect, useRef, useCallback, useState } from "react";
import * as d3 from "d3";
import { multiply, subtract, transpose, inv } from "mathjs";

export type DataPoint = number[];

export type SamplingMethod = "random" | "systematic" | "cluster";

type ChartProps = {
  data: DataPoint[];
  selectedPoint: number[];
  percentage: number;
  subsampleSize?: number;
  samplingMethod?: SamplingMethod;
  onPerformanceData?: (data: PerformanceData) => void;
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
}: ChartProps) {
  const DIMS = data[0].length;
  const svgRef = useRef<SVGSVGElement | null>(null);

  const getSubsampledData = useCallback(
    (data: DataPoint[], size: number, method: SamplingMethod) => {
      if (!size || size >= data.length) return data;

      const startTime = performance.now();
      let result: DataPoint[];

      switch (method) {
        case "random":
          // Random sampling (existing method)
          result = [...data].sort(() => Math.random() - 0.5).slice(0, size);
          break;

        case "systematic":
          // Systematic sampling (every nth element)
          const step = Math.floor(data.length / size);
          result = data.filter((_, index) => index % step === 0).slice(0, size);
          break;

        case "cluster":
          // Simple k-means like clustering
          const k = Math.min(10, Math.floor(size / 50)); // Number of clusters
          const centers: DataPoint[] = data.slice(0, k); // Initial centers

          // Assign points to nearest center
          const clusters: DataPoint[][] = Array(k)
            .fill(null)
            .map(() => []);
          data.forEach((point) => {
            let minDist = Infinity;
            let nearestCenter = 0;

            centers.forEach((center, i) => {
              const dist = point.reduce(
                (sum, val, i) => sum + Math.pow(val - center[i], 2),
                0
              );
              if (dist < minDist) {
                minDist = dist;
                nearestCenter = i;
              }
            });

            clusters[nearestCenter].push(point);
          });

          // Take proportional samples from each cluster
          result = clusters.flatMap((cluster) => {
            const clusterSize = Math.floor(
              (cluster.length / data.length) * size
            );
            return cluster
              .sort(() => Math.random() - 0.5)
              .slice(0, clusterSize);
          });
          break;

        default:
          result = data;
      }

      const endTime = performance.now();

      if (onPerformanceData) {
        onPerformanceData({
          samplingTime: endTime - startTime,
          covarianceTime: 0, // Will be updated in calculateCovariance
          totalPoints: data.length,
          sampledPoints: result.length,
          method: method,
        });
      }

      return result;
    },
    [onPerformanceData]
  );

  const calculateCovariance = useCallback(
    (data: number[][]) => {
      const startTime = performance.now();

      // Use subsampled data for covariance calculation if specified
      const dataForCovariance = subsampleSize
        ? getSubsampledData(data, subsampleSize, samplingMethod)
        : data;

      // Calculate means for each dimension
      const means = Array(DIMS).fill(0);
      for (const point of dataForCovariance) {
        for (let i = 0; i < DIMS; i++) {
          means[i] += point[i];
        }
      }
      means.forEach((_, i) => (means[i] /= dataForCovariance.length));

      // Calculate covariance matrix
      const covMatrix = Array(DIMS)
        .fill(0)
        .map(() => Array(DIMS).fill(0));

      for (const point of dataForCovariance) {
        for (let i = 0; i < DIMS; i++) {
          for (let j = 0; j < DIMS; j++) {
            covMatrix[i][j] += (point[i] - means[i]) * (point[j] - means[j]);
          }
        }
      }

      // Divide by n-1 for sample covariance
      for (let i = 0; i < DIMS; i++) {
        for (let j = 0; j < DIMS; j++) {
          covMatrix[i][j] /= dataForCovariance.length - 1;
        }
      }

      const endTime = performance.now();

      if (onPerformanceData) {
        onPerformanceData({
          samplingTime: 0, // Already reported in getSubsampledData
          covarianceTime: endTime - startTime,
          totalPoints: data.length,
          sampledPoints: dataForCovariance.length,
          method: subsampleSize ? samplingMethod : "full",
        });
      }

      return covMatrix;
    },
    [DIMS, subsampleSize, samplingMethod, getSubsampledData, onPerformanceData]
  );

  const calculateMahalanobisDistance = (
    point1: number[],
    point2: number[],
    covMatrix: number[][]
  ) => {
    const diff = subtract(point1, point2) as number[];
    const invCovMatrix = inv(covMatrix);
    const transposedDiff = transpose([diff]);

    // Calculate Mahalanobis distance: sqrt((x-y)^T * C^-1 * (x-y))
    const result = multiply(multiply(diff, invCovMatrix), transposedDiff);
    return Math.sqrt(result[0]);
  };

  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return;
    console.log("rerendered data");

    // Clear any existing elements
    d3.select(svgRef.current).selectAll("*").remove();

    // Set dimensions based on container width
    const containerWidth = svgRef.current.parentElement?.clientWidth ?? 800;
    const width = containerWidth;
    const height = Math.min(600, containerWidth * 0.6);
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create scales
    const xScale = d3.scaleLinear().domain([0, 100]).range([0, innerWidth]);

    const yScale = d3.scaleLinear().domain([0, 100]).range([innerHeight, 0]);

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
    const covarianceMatrix = calculateCovariance(data);

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
      distance: calculateMahalanobisDistance(
        point,
        selectedPoint,
        covarianceMatrix
      ),
    }));

    const sortedDistances = [...distances].sort(
      (a, b) => a.distance - b.distance
    );
    const thresholdIndex = Math.floor(data.length * (percentage / 100));
    const threshold = sortedDistances[thresholdIndex]?.distance ?? Infinity;

    // Update dot colors
    dots.attr("fill", (d) => {
      const distance = calculateMahalanobisDistance(
        d,
        selectedPoint,
        covarianceMatrix
      );
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
  }, [data, selectedPoint, percentage, calculateCovariance]);

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
