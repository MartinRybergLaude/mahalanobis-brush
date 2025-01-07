type getCovarianceProps = {
  data: number[][];
  dims: number;
};

export async function getCovariance({ data, dims }: getCovarianceProps) {
  await new Promise((resolve) => setTimeout(resolve, 0));

  // Calculate means for each dimension
  const means = Array(dims).fill(0);
  for (const point of data) {
    for (let i = 0; i < dims; i++) {
      means[i] += point[i];
    }
  }
  means.forEach((_, i) => (means[i] /= data.length));

  // Calculate covariance matrix
  const covMatrix = Array(dims)
    .fill(0)
    .map(() => Array(dims).fill(0));

  for (const point of data) {
    for (let i = 0; i < dims; i++) {
      for (let j = 0; j < dims; j++) {
        covMatrix[i][j] += (point[i] - means[i]) * (point[j] - means[j]);
      }
    }
  }

  // Divide by n-1 for sample covariance
  for (let i = 0; i < dims; i++) {
    for (let j = 0; j < dims; j++) {
      covMatrix[i][j] /= data.length - 1;
    }
  }

  return covMatrix;
}
