import { useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";
import { multiply, subtract, transpose, inv } from "mathjs";

export type DataPoint = {
  x: number;
  y: number;
};

type ChartProps = {
  data: DataPoint[];
  selectedX: number;
  selectedY: number;
  percentage: number;
};

function Chart({ data, selectedX, selectedY, percentage }: ChartProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const calculateMean = (values: number[]): number => {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  };

  const calculateCovariance = useCallback(
    (x: number[], y: number[]): number[][] => {
      const meanX = calculateMean(x);
      const meanY = calculateMean(y);
      const n = x.length;

      let covarXX = 0;
      let covarXY = 0;
      let covarYY = 0;

      for (let i = 0; i < n; i++) {
        const diffX = x[i] - meanX;
        const diffY = y[i] - meanY;
        covarXX += diffX * diffX;
        covarXY += diffX * diffY;
        covarYY += diffY * diffY;
      }

      return [
        [covarXX / (n - 1), covarXY / (n - 1)],
        [covarXY / (n - 1), covarYY / (n - 1)],
      ];
    },
    []
  );

  const calculateMahalanobisDistance = (
    point: DataPoint,
    referencePoint: DataPoint,
    covarianceMatrix: number[][]
  ): number => {
    const diff = subtract(
      [point.x, point.y],
      [referencePoint.x, referencePoint.y]
    );
    const invCovariance = inv(covarianceMatrix);
    const result = multiply(
      multiply(diff, invCovariance),
      transpose(diff)
    ) as number;
    return Math.sqrt(result);
  };

  useEffect(() => {
    if (!svgRef.current || !data) return;

    // Clear any existing elements
    d3.select(svgRef.current).selectAll("*").remove();

    // Set dimensions based on container width
    const containerWidth = svgRef.current.parentElement?.clientWidth ?? 800;
    const width = containerWidth;
    const height = Math.min(600, containerWidth * 0.6); // Responsive height
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

    // Create chart group and apply margins
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add X axis
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale));

    // Add Y axis
    g.append("g").call(d3.axisLeft(yScale));

    // Calculate covariance matrix
    const xValues = data.map((d) => d.x);
    const yValues = data.map((d) => d.y);
    const covarianceMatrix = calculateCovariance(xValues, yValues);

    // Add dots with basic color
    const dots = g
      .selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", (d) => xScale(d.x))
      .attr("cy", (d) => yScale(d.y))
      .attr("r", 3)
      .attr("fill", "steelblue");

    // Modify this section to remove highlightUpdate check
    const referencePoint = { x: selectedX, y: selectedY };
    const distances = data.map((point) => ({
      point,
      distance: calculateMahalanobisDistance(
        point,
        referencePoint,
        covarianceMatrix
      ),
    }));

    const sortedDistances = [...distances].sort(
      (a, b) => a.distance - b.distance
    );
    const thresholdIndex = Math.floor(data.length * (percentage / 100));
    const threshold = sortedDistances[thresholdIndex]?.distance ?? Infinity;

    // Update dot colors based on distances
    dots.attr("fill", (d) => {
      const distance = calculateMahalanobisDistance(
        d,
        referencePoint,
        covarianceMatrix
      );
      return distance <= threshold ? "red" : "steelblue";
    });

    // Add axis labels
    g.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + 35)
      .attr("text-anchor", "middle")
      .text("X Axis");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerHeight / 2)
      .attr("y", -35)
      .attr("text-anchor", "middle")
      .text("Y Axis");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, selectedX, selectedY, percentage]); // Update dependencies

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
