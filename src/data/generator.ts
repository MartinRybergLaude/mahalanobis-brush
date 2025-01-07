import fs from "fs";
import path from "path";

// Utility function to add noise to a value
const addNoise = (value: number, noiseFactor: number = 0.1): number => {
  const noise = (Math.random() - 0.5) * 2 * noiseFactor * 100;
  return Math.max(0, Math.min(100, value + noise));
};

// Utility function to generate random outliers
const generateOutlier = (): number[] => {
  return Array(10)
    .fill(0)
    .map(() => Math.random() * 100);
};

// Generate a noisy line (x=y in all dimensions)
const generateLine = (numPoints: number = 1000): number[][] => {
  const points: number[][] = [];

  for (let i = 0; i < numPoints; i++) {
    const baseValue = (i / numPoints) * 100;
    // All dimensions will follow x=y with small noise
    const point = Array(10)
      .fill(0)
      .map(() => addNoise(baseValue, 0.1));
    points.push(point);
  }

  // Add outliers (5% of total points)
  const numOutliers = Math.floor(numPoints * 0.05);
  for (let i = 0; i < numOutliers; i++) {
    points.push(generateOutlier());
  }

  return points;
};

// Generate a 10D sphere
const generateSphere = (
  numPoints: number = 1000,
  center: number = 50,
  radius: number = 30
): number[][] => {
  const points: number[][] = [];

  for (let i = 0; i < numPoints; i++) {
    // Generate random point on unit sphere
    const vector = Array(10)
      .fill(0)
      .map(() => Math.random() * 2 - 1);
    const magnitude = Math.sqrt(
      vector.reduce((sum, val) => sum + val * val, 0)
    );

    // Scale to desired radius and add noise
    const point = vector.map((v) => {
      const scaled = center + (v / magnitude) * radius;
      return addNoise(scaled, 0.1);
    });

    points.push(point);
  }

  // Add outliers
  const numOutliers = Math.floor(numPoints * 0.05);
  for (let i = 0; i < numOutliers; i++) {
    points.push(generateOutlier());
  }

  return points;
};

// Generate multiple spheres with consistent structure across dimensions
const generateMultipleSpheres = (numPoints: number = 1000): number[][] => {
  const centers = [
    [30, 30, 30, 30, 30, 30, 30, 30, 30, 30], // First sphere center
    [70, 70, 70, 70, 70, 70, 70, 70, 70, 70], // Second sphere center
    [50, 50, 50, 50, 50, 50, 50, 50, 50, 50], // Third sphere center
  ];

  const points: number[][] = [];
  const pointsPerSphere = Math.floor(numPoints / centers.length);

  centers.forEach((center) => {
    // Generate points for each sphere with smaller radius
    const spherePoints = generateSphere(pointsPerSphere, 0, 10).map((point) =>
      point.map((v, i) => addNoise(v + center[i], 0.05))
    );
    points.push(...spherePoints);
  });

  return points;
};

// Generate a 10D torus using pairs of dimensions
const generateTorus = (numPoints: number = 1000): number[][] => {
  const points: number[][] = [];
  const R = 30; // Major radius
  const r = 10; // Minor radius

  for (let i = 0; i < numPoints; i++) {
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.random() * 2 * Math.PI;

    const point = Array(10).fill(0);

    // Create torus pattern in each pair of dimensions (0-1, 2-3, 4-5, 6-7, 8-9)
    for (let dim = 0; dim < 10; dim += 2) {
      point[dim] = (R + r * Math.cos(phi)) * Math.cos(theta);
      point[dim + 1] = (R + r * Math.cos(phi)) * Math.sin(theta);

      // Scale and center
      point[dim] = addNoise(point[dim] + 50, 0.1);
      point[dim + 1] = addNoise(point[dim + 1] + 50, 0.1);
    }

    points.push(point);
  }

  // Add outliers
  const numOutliers = Math.floor(numPoints * 0.05);
  for (let i = 0; i < numOutliers; i++) {
    points.push(generateOutlier());
  }

  return points;
};

// Generate and save all datasets
const generateAndSaveDatasets = () => {
  const datasets = {
    line: generateLine(),
    sphere: generateSphere(),
    "multiple-spheres": generateMultipleSpheres(),
    torus: generateTorus(),
  };

  for (const [name, data] of Object.entries(datasets)) {
    const filePath = path.join(__dirname, `${name}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data));
  }
};

// Generate the datasets
generateAndSaveDatasets();
