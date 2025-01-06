import Chart, { DataPoint } from "./components/Chart";
import data from "./data/line.json";

function App() {
  const dataset = (data as DataPoint[]).slice(0, 5000);

  return (
    <div className="App">
      <h1>Scatter Plot</h1>
      <Chart data={dataset} />
    </div>
  );
}

export default App;
