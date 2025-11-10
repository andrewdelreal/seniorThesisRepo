import '../css/Home.module.css';
import { JSX } from 'react';
import { useEffect, useState } from 'react';
import Graph from '../components/Graph';
import StockData from '../hooks/StockData';
import StockControls from '../components/StockControls';
import { UNSAFE_getTurboStreamSingleFetchDataStrategy } from 'react-router-dom';
import { toFormData } from 'axios';
import { stringify } from 'querystring';

function getTodayAndWeekBefore() {
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
    const todayDay = String(today.getDate()).padStart(2, '0');

    const lastWeekDate = new Date(today)
    lastWeekDate.setDate(today.getDate() - 60);
    const lastWeekYear = lastWeekDate.getFullYear();
    const lastWeekMonth = String(lastWeekDate.getMonth() + 1).padStart(2, '0');
    const lastWeekDay = String(lastWeekDate.getDate()).padStart(2, '0');

    return {today: `${todayYear}-${todayMonth}-${todayDay}`, lastWeek: `${lastWeekYear}-${lastWeekMonth}-${lastWeekDay}`};
  }

function Home(): JSX.Element {
  const { today, lastWeek } = getTodayAndWeekBefore();
  
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [symbol, setSymbol] = useState('AAPL');
  const [interval, setInterval] = useState('daily');
  const [start, setStart] = useState(lastWeek);
  const [end, setEnd] = useState(today);
  const [exchange, setExchange] = useState('nasdaq')

  const { data, loading, error } = StockData({ symbol, interval, start, end });

  useEffect(() => {
    const tokenChange = async (): Promise<void> =>  {
      if (token) {
        localStorage.setItem('token', token)
        // setToken(localStorage.getItem('token'));
      } else {
        localStorage.removeItem('token');
      }
    };

    tokenChange();
  }, [token]);

  

  return (
    <div className='text-center'>
      <h1 className='display-5 fw-bold text-purple mb-3'>Welcome Home {localStorage.getItem('googleName')}</h1>
      <p className='lead text-muted mb-4'>
        {/* This is your dashboard — clean, simple, and modern. */}
      </p>
      {/* <button className='btn btn-purple px-4 py-2 rounded-pill'>
        Get Started
      </button> */}

      <div>
        <StockControls
          exchange={exchange}
          setExchange={setExchange}
          symbol={symbol}
          setSymbol={setSymbol}
          interval={interval}
          setInterval={setInterval}
          start={start}
          setStart={setStart}
          end={end}
          setEnd={setEnd}
        />
      </div>

      <div>
        {!token? (
          <div/>
        ): (
          <div>
            <Graph data={data} symbol={symbol} interval={interval} start={start} end={end}/>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;