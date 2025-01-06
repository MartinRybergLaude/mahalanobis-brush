import { useEffect, useRef, FormEvent, useState, useCallback } from "react";
import * as d3 from "d3";
import { multiply, subtract, transpose, inv } from "mathjs";

export type DataPoint = {
  x: number;
  y: number;
};

type ChartProps = {
  data: DataPoint[];
};

function Chart({ data }: ChartProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [selectedX, setSelectedX] = useState<number>(0);
  const [selectedY, setSelectedY] = useState<number>(0);
  const [percentage, setPercentage] = useState<number>(10);
  const [highlightUpdate, setHighlightUpdate] = useState<number>(0);

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

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const x = Number(formData.get("x"));
    const y = Number(formData.get("y"));
    const pct = Number(formData.get("percentage"));

    setSelectedX(x);
    setSelectedY(y);
    setPercentage(pct);
    setHighlightUpdate((prev) => prev + 1);
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

    // Only calculate and apply highlighting if highlightUpdate has changed
    if (highlightUpdate > 0) {
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
    }

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
  }, [data, highlightUpdate]); // Only depend on data and highlightUpdate

  return (
    <div className="w-full px-4">
      <div className="max-w-7xl mx-auto">
        <form onSubmit={handleSubmit} className="mb-6 space-y-4">
          <div className="flex gap-4">
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
                value={selectedX}
                onChange={(e) => setSelectedX(Number(e.target.value))}
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
                value={selectedY}
                onChange={(e) => setSelectedY(Number(e.target.value))}
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
                value={percentage}
                onChange={(e) => setPercentage(Number(e.target.value))}
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
