import { Component, OnInit } from '@angular/core';
import { count, finalize } from 'rxjs';
import { concat } from 'rxjs/internal/observable/concat';
import { StockService } from './core/services/stock.service';
import { All_STOCKS } from './shared/const/all-stocks.const';
import { STOCKS_ASIE } from './shared/const/stocks-asie.const';
import { STOCKS_ASX } from './shared/const/stocks-asx.const';
import { STOCKS_EUROPE } from './shared/const/stocks-europe.const';
import { STOCKS_US } from './shared/const/stocks-us.const';
import { Stock } from './shared/model/stock.model';
import Chart from 'chart.js/auto';
import { MY_LIST } from './shared/const/my-list.const';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'the-godfather';

  stocks = new Array<Stock | string>();
  stocksToDisplay = new Array<Stock>();
  indexPrices = new Array<number>();

  echangeMarket: string = 'us';
  public charts = new Array<any>();

  constructor(private stockService: StockService) {}

  ngOnInit(): void {
    this.echangeMarket = 'us';
    switch (this.echangeMarket) {
      case 'us':
        this.stocks = STOCKS_US;
        break;

      case 'europe':
        this.stocks = STOCKS_EUROPE;
        break;

      case 'asx':
        this.stocks = STOCKS_ASX;
        break;

      case 'asie':
        this.stocks = STOCKS_ASIE;
        break;

      default:
        this.stocks = STOCKS_US;
        break;
    }

    this.stocks = [
      ...STOCKS_US,
      //...STOCKS_EUROPE,
      //...STOCKS_ASX,
      //...STOCKS_ASIE,
    ];
    //this.stocks = MY_LIST;
    //this.stocks = All_STOCKS;

    this.manyUpWeeksStrategy();
    //this.bestThanIndexStrategy();
    //this.rsiStrategy();

    //this.stockService.fetchStocksSymbolAndExchange().subscribe(console.log);
    //this.filterByTrainlingPE();
  }

  private filterByTrainlingPE() {
    const stockPosotovePE = Array<any>();
    const requestArray = new Array();
    this.stocks.forEach((stock: any) => {
      requestArray.push(this.stockService.filterByTrainlingPE(stock));
    });

    concat(...requestArray)
      .pipe(
        finalize(() => {
          console.log('stockPosotovePE : ', stockPosotovePE);
        })
      )
      .subscribe((response: any) => {
        if (response) {
          stockPosotovePE.push(response);
          console.log(response);
        }
      });
  }

  private bestThanIndexStrategy() {
    const requestArray = new Array();
    for (let index = 0; index < this.stocks.length; index++) {
      const stock = this.stocks[index];
      const symbol = typeof stock === 'string' ? stock : stock.symbol;
      requestArray.push(
        this.stockService.fetchStockClosePricesByIntervalAndRange(
          symbol,
          '1d',
          '3mo',
          1
        )
      );
    }

    concat(...requestArray).subscribe(
      (response: any) => {
        if (response && response.stockSymbol) {
          const stock = {
            symbol: response.stockSymbol,
            stocksIndustryID: response.stocksIndustryID,
          } as Stock;

          this.calculateMovingAvgBitGap(stock, response.closePrices);
          this.stocksToDisplay = [...this.stocksToDisplay, stock].sort(
            (a, b) => {
              return b.threeMonthsLossCounter - a.threeMonthsLossCounter;
            }
          );
        }
      }
      //error => console.log('error : ',error)
    );
  }

  private manyUpWeeksStrategy() {
    const requestArray = new Array();
    for (let index = 0; index < this.stocks.length; index++) {
      //for (let index = 0; index < 1; index++) {
      const stock = this.stocks[index];
      const symbol = typeof stock === 'string' ? stock : stock.symbol;
      requestArray.push(
        this.stockService.fetchStockClosePricesByIntervalAndRange(
          symbol,
          '1wk',
          '3y',
          1
        )
      );
    }

    concat(...requestArray).subscribe(
      (response: any) => {
        if (response && response.stockSymbol) {
          const stock = {
            symbol: response.stockSymbol,
            stocksIndustryID: response.stocksIndustryID,
          } as Stock;

          this.calculateMovingAvgBitGap(stock, response.closePrices);
          this.stocksToDisplay = [...this.stocksToDisplay, stock].sort(
            (a, b) => {
              return b.threeMonthsLossCounter - a.threeMonthsLossCounter;
            }
          );
        }
      }
      //error => console.log('error : ',error)
    );
  }

  private rsiStrategy() {
    const requestArray = new Array();
    for (let index = 0; index < this.stocks.length; index++) {
      const stock = this.stocks[index];
      const symbol = typeof stock === 'string' ? stock : stock.symbol;
      requestArray.push(
        this.stockService.fetchStockClosePricesByIntervalAndRange(
          symbol,
          '1d',
          '6mo',
          1
        )
      );
    }

    concat(...requestArray).subscribe(
      (response: any) => {
        if (response && response.stockSymbol) {
          const stock = {
            symbol: response.stockSymbol,
          } as Stock;

          this.calculateMovingAvgBitGap(stock, response.closePrices);
          this.stocksToDisplay = [...this.stocksToDisplay, stock].sort(
            (a, b) => {
              return a.threeMonthsLossCounter - b.threeMonthsLossCounter;
            }
          );
        }
      }
      //error => console.log('error : ',error)
    );
  }

  private calculateRSI(
    stock: Stock,
    stockPricesHistory: Array<number>,
    futurPrice?: number
  ) {
    stockPricesHistory = stockPricesHistory?.filter((n) => n);

    const percentOneDay =
      ((stockPricesHistory[stockPricesHistory.length - 1] -
        stockPricesHistory[stockPricesHistory.length - 2]) *
        100) /
      stockPricesHistory[stockPricesHistory.length - 2];
    const percentOneWeek =
      ((stockPricesHistory[stockPricesHistory.length - 2] -
        stockPricesHistory[stockPricesHistory.length - 3]) *
        100) /
      stockPricesHistory[stockPricesHistory.length - 2];
    stock.threeMonthsProfitLossPlusMinusChart =
      stock.threeMonthsProfitLossPlusMinusChart.concat(
        ` (d: ${percentOneDay.toFixed(2)}%) (wk: ${percentOneWeek.toFixed(
          2
        )}%) ${stockPricesHistory[stockPricesHistory.length - 2].toFixed(
          2
        )} --> ${stockPricesHistory[stockPricesHistory.length - 1].toFixed(2)}`
      );
    stock.threeMonthsLossCounter =
      this.calculateRSIIndicator(stockPricesHistory);
  }

  private calculateMovingAvgBitGap(
    stock: Stock,
    stockPricesHistory: Array<number>
  ) {
    let futurPrice = stockPricesHistory[stockPricesHistory.length - 30];
    stockPricesHistory = stockPricesHistory.splice(
      0,
      stockPricesHistory.length - 1
    );
    const stockPricesHistoryCopy = [...stockPricesHistory];
    stockPricesHistory = stockPricesHistory?.filter((n) => n);
    let movingAvg = this.movingAvg(stockPricesHistory, 30, null)
      ? (this.movingAvg(stockPricesHistory, 15, null) as Array<number>)
      : [];

    let avgLastPrice = movingAvg[movingAvg?.length - 1];
    stock.currentPrice = stockPricesHistory[stockPricesHistory.length - 1];
    stock.curentPriceVariationPercent =
      ((stock.currentPrice - avgLastPrice) * 100) / stock.currentPrice;
    stock.threeMonthsProfitLossPlusMinusChart = '' + stock.stocksIndustryID;
    movingAvg = movingAvg?.filter((n) => n);

    this.calculateHowWeeksUp(stock, stockPricesHistoryCopy, movingAvg);
    //this.calculateBestThanIndex(stock, stockPricesHistoryCopy);
    //this.calculateRSI(stock, stockPricesHistoryCopy);
  }

  private calculateBestThanIndex(
    stock: Stock,
    stockPricesHistory: Array<number>
  ) {
    if (stock?.symbol === '^IXIC') {
      this.indexPrices = stockPricesHistory;
      stock.threeMonthsLossCounter = -2;
    } else if (this.indexPrices && this.indexPrices.length > 0) {
      let counterBestThanIndex = 0;

      for (let index = stockPricesHistory.length - 1; index > 1; index--) {
        const currentStockPrice = stockPricesHistory[index];
        const previousStockPrice = stockPricesHistory[index - 1];
        const stockPriceVariation =
          ((currentStockPrice - previousStockPrice) * 100) / previousStockPrice;

        const currentIndexPrice = this.indexPrices[index];
        const previousIndexPrice = this.indexPrices[index - 1];
        const IndexPriceVariation =
          ((currentIndexPrice - previousIndexPrice) * 100) / previousIndexPrice;

        if (stockPriceVariation > IndexPriceVariation) {
          counterBestThanIndex++;
        } else {
          break;
        }
      }

      stock.threeMonthsLossCounter = counterBestThanIndex;
    } else {
      stock.threeMonthsLossCounter = -1;
    }
  }

  private calculateHowWeeksUp(
    stock: Stock,
    stockPricesHistory: Array<number>,
    mmaPrice: Array<number>
  ) {
    stockPricesHistory = stockPricesHistory?.filter((n) => n);
    let counter = 0;
    let retry = 3;

    for (let index = stockPricesHistory.length - 1; index > 0; index--) {
      const currentPrice = stockPricesHistory[index];
      const previousPrice = stockPricesHistory[index - 1];

      if (currentPrice >= previousPrice) {
        counter++;
      } else if (retry > 0) {
        retry--;
      } else {
        break;
      }
    }

    stock.threeMonthsLossCounter = counter;
    const rsi = this.calculateRSIIndicator([...stockPricesHistory]);

    stock.threeMonthsProfitLossPlusMinusChart = ` rsi: ${rsi.toFixed(
      2
    )} | ${counter} | mm: ${stock.curentPriceVariationPercent.toFixed(2)}`;

    // Chart
    setTimeout(
      () =>
        this.createChart(
          'chart' + stock.symbol,
          rsi,
          stockPricesHistory,
          mmaPrice
        ),
      100
    );
  }

  createChart(
    id: string,
    rsi: number,
    pricesParam?: Array<number>,
    mmaParam?: Array<number>
  ) {
    console.log(id, pricesParam, mmaParam);

    //const prices = ['542', '542', '536', '327', '17', '100.00', '538', '541'];
    const prices = pricesParam ?? [];
    //const mmaParamX = ['467', '576', '572', '79', '92'];
    const mmaTmp = mmaParam ?? [];

    const labels = Array(prices.length).fill(0);
    let mma = Array(prices.length).fill(prices[0]);
    mma.splice(mma.length - mmaTmp.length, mmaTmp.length, ...mmaTmp);

    this.charts.push(
      new Chart(id, {
        type: 'line', //this denotes tha type of chart

        data: {
          // values on X-Axis
          labels: labels,
          datasets: [
            {
              label: 'Price',
              data: prices,
              backgroundColor: 'blue',
              borderColor: 'blue',
            },
            {
              label: `MMA (rsi: ${rsi.toFixed(2)})`,
              data: mma,
              backgroundColor: 'pink',
              borderColor: 'pink',
            },
          ],
        },
        options: {
          aspectRatio: 2.5,
        },
      })
    );
  }

  /**
   * returns an array with moving average of the input array
   * @param array - the input array
   * @param count - the number of elements to include in the moving average calculation
   * @param qualifier - an optional function that will be called on each
   *  value to determine whether it should be used
   */
  private movingAvg(array: any, count: any, qualifier: any) {
    let result = [],
      val;

    // pad beginning of result with null values
    for (let i = 0; i < count - 1; i++) result.push(null);

    // calculate average for each subarray and add to result
    for (let i = 0, len = array.length - count; i <= len; i++) {
      val = this.avg(array.slice(i, i + count), qualifier);
      if (isNaN(val)) result.push(null);
      else result.push(val);
    }

    return result;
  }

  // calculate average for subarray
  private avg(array: any, qualifier: any) {
    let sum = 0,
      count = 0,
      val;
    for (let i in array) {
      val = array[i];
      if (!qualifier || qualifier(val)) {
        sum += val;
        count++;
      }
    }

    return sum / count;
  }

  calculateRSIIndicator(closingPrices: Array<number>) {
    const prices = closingPrices.splice(closingPrices.length - 14);
    // Calculate the average of the upward price changes
    let avgUpwardChange = 0;
    for (let i = 1; i < prices.length; i++) {
      avgUpwardChange += Math.max(0, prices[i] - prices[i - 1]);
    }
    avgUpwardChange /= 14;

    // Calculate the average of the downward price changes
    let avgDownwardChange = 0;
    for (let i = 1; i < prices.length; i++) {
      avgDownwardChange += Math.max(0, prices[i - 1] - prices[i]);
    }
    avgDownwardChange /= 14;

    // Calculate the RSI
    const rsi = 100 - 100 / (1 + avgUpwardChange / avgDownwardChange);

    return rsi;
  }
}
