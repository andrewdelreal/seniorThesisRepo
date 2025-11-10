import { JSX, useState, useEffect } from "react";
import styles from "../css/Graph.module.css";
import Plot from "react-plotly.js";
import ParseStockData from "../hooks/ParseStockData";

function Graph({ data, symbol, interval, start, end }: {data: any, symbol: string, interval: string, start: string, end: string}): JSX.Element {
    const [x, setX] = useState<number[]>([1, 2, 3, 4, 5]);
    const [y, setY] = useState<number[]>([1, 2, 3, 4, 5]);
    const [color, setColor] = useState<string>("green");

    useEffect(() => {
         if (!data) return; // if no data, do nothing

        const updateXY = async () => {  // parse data in the right format for plotly
            const parsedData = await ParseStockData(data);
            setX(parsedData.xValues);
            setY(parsedData.yValues);

            if (parsedData.yValues.length >= 2) {
                const trend = parsedData.yValues[parsedData.yValues.length - 1] - parsedData.yValues[0];
                setColor(trend >= 0 ? "green" : "red"); // green for uptrend, red for downtrend
                // future: could add color for each up and down segment, make this an option as it will be slower.
            }
        }

        updateXY();
    }, [data]);

    function formatDateToMonthNameDayYear(dateString: string): string {
        const date = new Date(dateString);

        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };

        return new Intl.DateTimeFormat('en-US', options).format(date);
    }
    const graphData = [ // define data for plotly graph
        {
            x: x,
            y: y,
            mode: 'lines',
            name: 'Line Chart',
            line: { color: color }, // change this to be on trend of time frame dependent.
        },
    ];
    
    // may need to add this to the useEffect and state to change the arrow annotations.
    const layout = {
        title: {text: `${interval.charAt(0).toUpperCase() + interval.slice(1).toLowerCase()}` + 
            ` trend of ${symbol} from ${formatDateToMonthNameDayYear(start)} - ${formatDateToMonthNameDayYear(end)}`},
        xaxis: { title: {text: '' }},
        yaxis: { title: {text: '' }, tickprefix: '$', tickformat: ',.2f' },
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
                arrowcolor: color,
            },
        ],
    };

    return (
        <div className={styles.graphContainer}>
            <h2 className={styles.graphTitle}>Stock Viewer</h2>
            <div className={styles.graphPlaceholder}>
                <Plot
                    data={graphData}
                    layout={{title: layout.title, xaxis: layout.xaxis, yaxis: layout.yaxis, autosize: true, annotations: layout.annotations}}
                    style={{ width: '100%', height: '100%' }}
                    config={{ responsive: true }}
                />
            </div>
        </div>
    );
}

export default Graph;
