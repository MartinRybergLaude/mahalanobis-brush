import { useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";
import { multiply, subtract, transpose, inv } from "mathjs";

export type DataPoint = number[];

type ChartProps = {
  data: DataPoint[];
  selectedPoint: number[];
  percentage: number;
};

function Chart({ data, selectedPoint, percentage }: ChartProps) {
  const DIMS = data[0].length;
  const svgRef = useRef<SVGSVGElement | null>(null);

  const calculateCovariance = useCallback(
    (data: number[][]) => {
      // Calculate means for each dimension
      const means = Array(DIMS).fill(0);
      for (const point of data) {
        for (let i = 0; i < DIMS; i++) {
          means[i] += point[i];
        }
      }
      means.forEach((_, i) => (means[i] /= data.length));

      // Calculate covariance matrix
      const covMatrix = Array(DIMS)
        .fill(0)
        .map(() => Array(DIMS).fill(0));

      for (const point of data) {
        for (let i = 0; i < DIMS; i++) {
          for (let j = 0; j < DIMS; j++) {
            covMatrix[i][j] += (point[i] - means[i]) * (point[j] - means[j]);
          }
        }
      }

      // Divide by n-1 for sample covariance
      for (let i = 0; i < DIMS; i++) {
        for (let j = 0; j < DIMS; j++) {
          covMatrix[i][j] /= data.length - 1;
        }
      }

      return covMatrix;
    },
    [DIMS]
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
