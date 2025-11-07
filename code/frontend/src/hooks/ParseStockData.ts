function ParseStockData(data: {history: {day: Object[]}}): Promise<{xValues: number[], yValues: number[]}> {
    // args: raw stock data
    // returns: Promise of parsed x and y values for graphing

    // check data validity
    if (!data || !data.history || !data.history.day) {
        console.error("Invalid data format or missing history/day:", data);
        return Promise.resolve({ xValues: [], yValues: [] });
    }

    const xValues: number[] = data.history.day.map((d: any) => d.date); // get timestamps as x values
    const yValues: number[] = data.history.day.map((d: any) => d.close); // use closing prices as y values

    return Promise.resolve({ xValues, yValues });
}

export default ParseStockData;
