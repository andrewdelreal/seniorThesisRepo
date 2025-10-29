import { JSX } from "react";
import "../css/Graph.module.css";
import Plot from "react-plotly.js";

function Graph(): JSX.Element {
    const data = [
        {
            x: [1, 2, 3, 4, 5],
            y: [10, 15, 13, 17, 12],
            mode: 'lines',
            name: 'Line Chart',
        },
    ];

    const layout = {
        title: {text: 'Sample Line Chart'},
        xaxis: { title: {text: 'X Axis' }},
        yaxis: { title: {text: 'Y Axis' }},
    };

    return (
        <div className="graph-container">
            <h2 className="graph-title">Sample Graph</h2>
            <div className="graph-placeholder">
                <Plot
                    data={data}
                    layout={{title: layout.title, xaxis: layout.xaxis, yaxis: layout.yaxis, autosize: true}}
                    style={{ width: '100%', height: '100%' }}
                    config={{ responsive: true }}
                />
            </div>
        </div>
    );
}

export default Graph;
