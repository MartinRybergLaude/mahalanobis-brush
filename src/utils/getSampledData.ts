/* eslint-disable no-case-declarations */
import { DataPoint } from "../components/Chart";

import { SamplingMethod } from "../components/Chart";

type getSubsampledDataProps = {
  data: number[][];
  size: number | undefined;
  method: SamplingMethod;
};

export async function getSubsampledData({
  data,
  size,
  method,
}: getSubsampledDataProps) {
  if (!size || size >= data.length) return data;

  let result: DataPoint[];

  await new Promise((resolve) => setTimeout(resolve, 0));

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
        const clusterSize = Math.floor((cluster.length / data.length) * size);
        return cluster.sort(() => Math.random() - 0.5).slice(0, clusterSize);
      });
      break;

    default:
      result = data;
  }

  return result;
}
