import ApiError from "../errors/ApiError";

export async function getMarketHistory(
    symbol: string, 
    interval: string, 
    start: string, 
    end: string
) {
    const  options  = {
        method: 'GET',
        headers: {Accept: 'application/json', Authorization: 'Bearer ' + process.env.TRADIER_BEARER_TOKEN}
    };

    const response = await fetch(
        `https://api.tradier.com/v1/markets/history?symbol=${symbol}&interval=${interval}&start=${start}&end=${end}`, 
        options
    );

    if (!response.ok) { 
        const text = await response.text(); 
        
        console.error("Tradier API error:", response.status, text);

        throw new ApiError( 502, 
            "TRADIER_API_FAILED", 
            "Failed to fetch market history" 
        ); 
    }

    return response.json();
}