import { JSX } from "react";
import styles from "../css/Graph.module.css";
import Plot from "react-plotly.js";

function Graph(): JSX.Element {
    const x: number[] = [1, 2, 3, 4, 5];
    const y: number[] = [10, 15, 13, 17, 12];

    const data = [
        {
            x: x,
            y: y,
            mode: 'lines',
            name: 'Line Chart',
            line: { color: 'blue' }, // change this to be on trend of time frame dependent.
        },
    ];

    const layout = {
        title: {text: 'Sample Line Chart'},
        xaxis: { title: {text: 'X Axis' }},
        yaxis: { title: {text: 'Y Axis' }},
        color: {text: 'blue'},
         annotations: [ // used for the arrow at the e
            {
                x: x[x.length - 1], // points for head
                y: y[y.length - 1],
                ax: x[x.length - 2],  // points for tail
                ay: y[y.length - 2],
                xref: "x" as const,
                yref: "y" as const,
                axref: 'x' as const, 
                ayref: 'y' as const, 
                text: "",
                showarrow: true,
                arrowhead: 3,
                arrowsize: 2,
                arrowwidth: 2,
                arrowcolor: "blue",
            },
        ],
    };

    return (
        <div className={styles.graphContainer}>
            <h2 className={styles.graphTitle}>Sample Graph</h2>
            <div className={styles.graphPlaceholder}>
                <Plot
                    data={data}
                    layout={{title: layout.title, xaxis: layout.xaxis, yaxis: layout.yaxis, autosize: true, annotations: layout.annotations}}
                    style={{ width: '100%', height: '100%' }}
                    config={{ responsive: true }}
                />
            </div>
        </div>
    );
}

export default Graph;
