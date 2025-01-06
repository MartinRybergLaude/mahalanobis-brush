import fs from "fs";
import path from "path";

interface Point {
  x: number;
  y: number;
}

// Utility function to add noise to a point
const addNoise = (value: number, magnitude: number = 1): number => {
  return value + (Math.random() - 0.5) * magnitude * 2;
};

// Utility function to occasionally generate outliers
const addOutlier = (point: Point, probability: number = 0.05): Point => {
  if (Math.random() < probability) {
    return {
      x: Math.max(1, Math.min(100, point.x + (Math.random() - 0.5) * 60)),
      y: Math.max(1, Math.min(100, point.y + (Math.random() - 0.5) * 60)),
    };
  }
  return point;
};

// Generate a donut shape
export function generateDonut(numPoints: number = 1000000): Point[] {
  const points: Point[] = [];
  const centerX = 50;
  const centerY = 50;
  const radius = 20;

  for (let i = 0; i < numPoints; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = radius + addNoise(0, 10);
    const point = {
      x: Math.max(1, Math.min(100, centerX + Math.cos(angle) * distance)),
      y: Math.max(1, Math.min(100, centerY + Math.sin(angle) * distance)),
    };
    points.push(addOutlier(point));
  }
  return points;
}

// Generate a linear relationship with noise
export function generateLine(numPoints: number = 1000000): Point[] {
  const points: Point[] = [];
  const slope = 0.8;
  const intercept = 10;

  for (let i = 0; i < numPoints; i++) {
    const x = Math.random() * 98 + 1; // 1 to 99
    const point = {
      x,
      y: Math.max(1, Math.min(100, slope * x + intercept + addNoise(0, 8))),
    };
    points.push(addOutlier(point));
  }
  return points;
}

// Generate an S-curve
export function generateSCurve(numPoints: number = 1000000): Point[] {
  const points: Point[] = [];

  for (let i = 0; i < numPoints; i++) {
    const x = Math.random() * 98 + 1; // 1 to 99
    const base = 50 + 30 * Math.tanh((x - 50) / 15);
    const point = {
      x,
      y: Math.max(1, Math.min(100, base + addNoise(0, 7))),
    };
    points.push(addOutlier(point));
  }
  return points;
}

// Generate a cluster (representing a projection of a sphere)
export function generateCluster(numPoints: number = 1000000): Point[] {
  const points: Point[] = [];
  const centerX = 50;
  const centerY = 50;

  for (let i = 0; i < numPoints; i++) {
    // Use Box-Muller transform for normal distribution
    const r = Math.sqrt(-2 * Math.log(Math.random()));
    const theta = 2 * Math.PI * Math.random();
    const point = {
      x: Math.max(1, Math.min(100, centerX + r * Math.cos(theta) * 20)),
      y: Math.max(1, Math.min(100, centerY + r * Math.sin(theta) * 20)),
    };
    points.push(addOutlier(point));
  }
  return points;
}

// Function to save data to JSON files
function saveToJson(data: Point[], filename: string) {
  const filePath = path.join(__dirname, filename);
  fs.writeFileSync(filePath, JSON.stringify(data));
}

// Generate and save all datasets
function generateAllDatasets() {
  saveToJson(generateDonut(), "donut.json");
  saveToJson(generateLine(), "line.json");
  saveToJson(generateSCurve(), "scurve.json");
  saveToJson(generateCluster(), "cluster.json");
}

// Uncomment to generate all datasets
generateAllDatasets();
