import { inv, multiply, subtract, transpose } from "mathjs";

type getMahalanobisProps = {
  point1: number[];
  point2: number[];
  covMatrix: number[][];
};

export function getMahalanobis({
  point1,
  point2,
  covMatrix,
}: getMahalanobisProps) {
  const diff = subtract(point1, point2) as number[];
  const invCovMatrix = inv(covMatrix);
  const transposedDiff = transpose([diff]);

  // Calculate Mahalanobis distance: sqrt((x-y)^T * C^-1 * (x-y))
  const result = multiply(multiply(diff, invCovMatrix), transposedDiff);
  return Math.sqrt(result[0]);
}
