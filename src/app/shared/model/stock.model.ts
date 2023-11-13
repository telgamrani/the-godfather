import { StockExchange } from "../enum/stock-exchange.enum";

export interface Stock {
	symbol: string,
	stockExchange: StockExchange,
	stocksIndustryID: number,
	currentPrice: number,
	open: number,
	low: number,
	heigh: number,
	close: number,
	curentPriceVariationPercent: number,
	threeMonthsProfitCounter: number,
	threeMonthsLossCounter: number,
	threeMonthsProfitLossPercent: number,
	threeMonthsProfitLossPlusMinusChart: string
}
