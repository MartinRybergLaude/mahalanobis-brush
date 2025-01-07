import * as fs from "fs";

function convertTxtToJson(inputFilePath: string, outputFilePath: string): void {
  // Read the .txt file content
  const fileContent = fs.readFileSync(inputFilePath, "utf8");

  // Convert the content into a number[][] array
  const data: number[][] = fileContent
    .trim() // Remove any trailing whitespace
    .split("\n") // Split into lines
    .map(
      (line) =>
        line
          .trim() // Remove leading/trailing whitespace on each line
          .split(/\s+/) // Split by whitespace (one or more spaces/tabs)
          .map(Number) // Convert each string to a number
    );

  // Convert the array to JSON
  const jsonContent = JSON.stringify(data, null, 2); // Pretty print JSON with 2-space indentation

  // Write the JSON content to the output file
  fs.writeFileSync(outputFilePath, jsonContent, "utf8");

  console.log(`JSON file has been created at: ${outputFilePath}`);
}

// Example usage:
const inputFilePath = "./data.txt"; // Path to your input .txt file
const outputFilePath = "./data.json"; // Path to the output .json file
convertTxtToJson(inputFilePath, outputFilePath);
