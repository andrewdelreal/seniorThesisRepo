import { JSX, useState, useEffect } from 'react';
import styles from '../css/ClusterGraph.module.css';
import Plot from 'react-plotly.js';

interface Point {
  [dimension: string]: number | string; // allows dynamic numeric dimensions

  cluster: number;
  symbol: string;
  description: string;
  exch: string;
}

function ClusterGraph({ data }: {data: any}): JSX.Element{
    const [x, setX] = useState<number[] | null>([0,1]);
    const [y, setY] = useState<number[] | null>([0,1]);
    const [pointText, setPointText] = useState<string[] | null>(['']);
    const [dimensions, setDimensions] = useState<string[] | null>(null);
    const [colors, setColors] = useState<string[] | null>(['red']);
    // need to add colors list that will change once the data extracted

    useEffect(() => {
        if (!data) return;

        console.log('data has changed');

        // once the data is updated, I will change the x,y and make sure to plot everythign accordingly.
        const updateXY = async () => {
            const points = data.points;
            const centroids = data.centroids;
            const dimensions = data.dimensions;

            const { xVals, yVals, pointText, colors} = await formatPoints(points, centroids, dimensions);

            console.log(xVals.length);

            setX(xVals);
            setY(yVals);
            setPointText(pointText);
            setColors(colors);
            setDimensions(dimensions);
        };

        updateXY();
        // update data of the graph by setting  x and y values
    }, [data]);

    const graphData = [ // define data for plotly graph
        {
            x: x,
            y: y,
            mode: 'markers',
            name: 'Scatter Data',
            marker: {
                color: colors
            },
            text: pointText,
            hoverinfo: 'text'
            // line: { color: 'red'}, // change this to be on trend of time frame dependent.
        },
    ];
    
    // may need to add this to the useEffect and state to change the arrow annotations.
    const layout = {
        title: {text: 'title'},
        xaxis: { title: {text: '' }},
        yaxis: { title: {text: '' }, tickprefix: '$', tickformat: ',.2f' },
        color: {text: 'blue'},
         annotations: [ // used for the arrow at the e
           
        ],
    };

    return (
        <div className={styles.graphContainer}>
            {/* <h2 className={styles.graphTitle}>Stock Viewer</h2> */}
            <div className={styles.graphPlaceholder}>
                {(!x || !y)? (
                    <div/>
                ): (
                    <div>
                        <Plot
                            data={graphData}
                            layout={{title: layout.title, xaxis: layout.xaxis, yaxis: layout.yaxis, autosize: true, annotations: layout.annotations}}
                            style={{ width: '100%', height: '100%' }}
                            config={{ responsive: true }}
                        />
                    </div>
                )}
                
            </div>
        </div>
    );
}

async function formatPoints(points: Point[], centroids: number[][], dimensions: string[]) {
    let xVals: number[] = [];
    let yVals: number[] = [];
    let pointText: string[] = [];
    let colors: string[] = [];

    var distinctColors = [
        '#e6194b60', // Red
        '#3cb44b60', // Green
        '#ffe11960', // Yellow
        '#4363d860', // Blue
        '#f5823160', // Orange
        '#911eb460', // Purple
        '#46f0f060', // Cyan
        '#f032e660', // Magenta
        '#bcf60c60', // Lime
        '#fabebe60', // Pink
        '#00808060', // Teal
        '#e6beff60', // Lavender
        '#9a632460', // Brown
        '#fffac860', // Beige
        '#80000060', // Maroon
        '#aaffc360', // Mint
        '#80800060', // Olive
        '#ffd8b160', // Apricot
        '#00007560', // Navy
        '#a9a9a960'  // Grey
    ];

    const x = dimensions[0];
    const y = dimensions[1];
    // eventually, the name of the dimension in the database, if over 2 dimensions, needs to change from 'change','vol'
    // to 'x', 'y', because I will have to reduce dimensionality. Or maybe I do that right away

    for (const point of points) {
        xVals.push(point[x] as number);
        yVals.push(point[y] as number);
        pointText.push(`(${point['symbol']}) ${point['exch']} ${point['description']} (${xVals.at(-1)}, ${yVals.at(-1)})`);
        colors.push(distinctColors[point['cluster']]);
    }
    console.log(colors)

    return { xVals, yVals, pointText, colors}
}

export default ClusterGraph;
