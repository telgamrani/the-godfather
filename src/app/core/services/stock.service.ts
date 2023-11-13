import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { filter, mergeMap } from 'rxjs';
import { of } from 'rxjs/internal/observable/of';
import { catchError } from 'rxjs/internal/operators/catchError';
import { map } from 'rxjs/internal/operators/map';
import { StockExchange } from 'src/app/shared/enum/stock-exchange.enum';
import { Stock } from 'src/app/shared/model/stock.model';

@Injectable({
  providedIn: 'root',
})
export class StockService {
  constructor(private http: HttpClient) {}

  fetchStockClosePricesByIntervalAndRange(
    stockSymbol: string,
    interval: string,
    range: string,
    stocksIndustryID: number
  ) {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${stockSymbol}?interval=${interval}&range=${range}`;

    return this.http.get(url).pipe(
      map((reponse: any) => {
        let closePrices = reponse?.chart?.result[0]?.indicators?.quote[0]?.low;
        let marketPrice = reponse?.chart?.result[0]?.meta?.regularMarketPrice;
        return {
          closePrices: closePrices,
          stockSymbol: stockSymbol,
          marketPrice: marketPrice,
          stocksIndustryID: stocksIndustryID,
        };
      }),
      catchError((error) => of(null))
    );
  }

  fetchStockMarketPriceOpensPricesByIntervalAndRange(
    stockSymbol: string,
    interval: string,
    range: string
  ) {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${stockSymbol}?interval=${interval}&range=${range}&includePrePost=true`;

    return this.http.get(url).pipe(
      map((reponse: any) => {
        let openPrices = reponse?.chart?.result[0]?.indicators?.quote[0]?.open;
        let marketPrice = reponse?.chart?.result[0]?.meta?.regularMarketPrice;
        return {
          openPrices: openPrices,
          marketPrice: marketPrice,
          stockSymbol: stockSymbol,
        };
      }),
      catchError((error) => of(null))
    );
  }

  fetchStockMarketPriceClosesPricesByIntervalAndRange(
    stockSymbol: string,
    interval: string,
    range: string
  ) {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${stockSymbol}?interval=${interval}&range=${range}`;

    return this.http.get(url).pipe(
      map((reponse: any) => {
        let closePrices =
          reponse?.chart?.result[0]?.indicators?.quote[0]?.close;
        return { closePrices: closePrices, stockSymbol: stockSymbol };
      }),
      catchError((error) => of(null))
    );
  }

  fetchStocksSymbolAndExchange() {
    return this.http
      .get(
        'https://api.etorostatic.com/sapi/instrumentsmetadata/V1.1/instruments/bulk?bulkNumber=1&totalBulks=1'
      )
      .pipe(
        map((response: any) => {
          if (response) {
            return response.InstrumentDisplayDatas.filter(
              (item: any) => item.InstrumentTypeID == 5
            ).map((item: any) => {
              return {
                symbol: item.SymbolFull,
                stocksIndustryID: item.StocksIndustryID,
                stockExchange:
                  item.ExchangeID === 4
                    ? StockExchange.NASDAQ
                    : StockExchange.NYSE,
              } as Stock;
            });
          }
        })
      );
  }

  filterByTrainlingPE(stock: any) {
    return this.http
      .get(
        `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${stock.symbol}`
      )
      .pipe(
        map((response: any) => {
          if (response?.quoteResponse?.result[0]?.trailingPE > 0) {
            return stock;
          } else {
            return false;
          }
        }),
        catchError((error) => of(null))
      );
  }
}
