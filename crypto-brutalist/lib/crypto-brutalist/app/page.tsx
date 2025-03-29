"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowUpDown, ChevronDown, Menu } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Initial crypto data
const initialCryptoData = [
  { symbol: "BTC", name: "BTC/USD", price: 64231.45, change: 0 },
  { symbol: "ETH", name: "ETH/USD", price: 3421.78, change: 0 },
  { symbol: "SOL", name: "SOL/USD", price: 142.56, change: 0 },
  { symbol: "DOGE", name: "DOGE/USD", price: 0.1324, change: 0 },
  { symbol: "XRP", name: "XRP/USD", price: 0.5231, change: 0 },
]

// Function to generate historical price data for different time frames
const generateHistoricalData = (basePrice: number, timeFrame: string) => {
  const data = []
  let currentPrice = basePrice
  const now = new Date()

  // Define parameters based on time frame
  let dataPoints = 0
  let timeInterval = 0
  let formatOptions = {}

  switch (timeFrame) {
    case "1H":
      dataPoints = 60
      timeInterval = 60000 // 1 minute
      formatOptions = { hour: "2-digit", minute: "2-digit" }
      break
    case "1D":
      dataPoints = 24
      timeInterval = 3600000 // 1 hour
      formatOptions = { hour: "2-digit", minute: "2-digit" }
      break
    case "1W":
      dataPoints = 7
      timeInterval = 86400000 // 1 day
      formatOptions = { month: "short", day: "numeric" }
      break
    case "1M":
      dataPoints = 30
      timeInterval = 86400000 // 1 day
      formatOptions = { month: "short", day: "numeric" }
      break
    default:
      dataPoints = 24
      timeInterval = 3600000 // 1 hour
      formatOptions = { hour: "2-digit", minute: "2-digit" }
  }

  // Generate data points
  for (let i = dataPoints - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - i * timeInterval)

    // More volatility for shorter time frames, less for longer ones
    const volatilityFactor = timeFrame === "1H" ? 0.002 : timeFrame === "1D" ? 0.005 : timeFrame === "1W" ? 0.01 : 0.02

    const change = (Math.random() - 0.5) * basePrice * volatilityFactor
    currentPrice = Math.max(currentPrice + change, basePrice * 0.5) // Ensure price doesn't drop too much

    data.push({
      time: time.toLocaleString([], formatOptions as Intl.DateTimeFormatOptions),
      price: currentPrice.toFixed(2),
      timestamp: time.getTime(),
    })
  }

  return data
}

// Custom tooltip component for the chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border-2 border-black p-2 font-mono">
        <p className="font-bold">{label}</p>
        <p className="font-medium">PRICE: ${Number(payload[0].value).toLocaleString()}</p>
      </div>
    )
  }
  return null
}

export default function Home() {
  const [cryptoData, setCryptoData] = useState(initialCryptoData)
  const [selectedCrypto, setSelectedCrypto] = useState(cryptoData[0])
  const [timeFrame, setTimeFrame] = useState("1D")
  const [chartData, setChartData] = useState(generateHistoricalData(selectedCrypto.price, timeFrame))
  const [orderBook, setOrderBook] = useState({
    sells: [] as { price: string; amount: string; total: string }[],
    buys: [] as { price: string; amount: string; total: string }[],
  })
  const [recentTrades, setRecentTrades] = useState(
    [] as { time: string; price: string; amount: string; type: string }[],
  )

  // Update all crypto prices periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setCryptoData((prevData) => {
        return prevData.map((crypto) => {
          // Different volatility for different coins
          const volatilityFactor =
            crypto.symbol === "BTC"
              ? 0.001
              : crypto.symbol === "ETH"
                ? 0.002
                : crypto.symbol === "SOL"
                  ? 0.003
                  : crypto.symbol === "DOGE"
                    ? 0.004
                    : 0.005

          const priceChange = (Math.random() - 0.5) * crypto.price * volatilityFactor
          const newPrice = Math.max(crypto.price + priceChange, crypto.price * 0.9)

          return {
            ...crypto,
            price: newPrice,
            change: (newPrice / crypto.price - 1) * 100,
          }
        })
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  // Update chart data when time frame changes
  useEffect(() => {
    setChartData(generateHistoricalData(selectedCrypto.price, timeFrame))
  }, [timeFrame, selectedCrypto])

  // Update chart data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setChartData((prevData) => {
        const lastPrice = Number(prevData[prevData.length - 1].price)
        const now = new Date()

        // Different update logic based on time frame
        if (timeFrame === "1H") {
          // For 1H, add a new minute and remove the oldest
          const volatility = lastPrice * 0.002
          const newPrice = lastPrice + (Math.random() - 0.5) * volatility

          const newData = [
            ...prevData.slice(1),
            {
              time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              price: newPrice.toFixed(2),
              timestamp: now.getTime(),
            },
          ]
          return newData
        } else {
          // For other time frames, just update the last price
          const volatility = lastPrice * (timeFrame === "1D" ? 0.005 : timeFrame === "1W" ? 0.01 : 0.02)
          const newPrice = lastPrice + (Math.random() - 0.5) * volatility

          const newData = [
            ...prevData.slice(0, -1),
            {
              ...prevData[prevData.length - 1],
              price: newPrice.toFixed(2),
            },
          ]
          return newData
        }
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [timeFrame])

  // Generate order book based on current price
  useEffect(() => {
    const currentPrice = selectedCrypto.price

    // Generate sell orders (higher than current price)
    const sells = Array.from({ length: 3 })
      .map((_, i) => {
        const priceOffset = (i + 1) * (currentPrice * 0.002) // 0.2% increments
        const price = currentPrice + priceOffset
        const amount = (Math.random() * 0.5).toFixed(4)
        const total = (price * Number(amount)).toFixed(2)

        return {
          price: price.toFixed(2),
          amount,
          total,
        }
      })
      .reverse()

    // Generate buy orders (lower than current price)
    const buys = Array.from({ length: 3 }).map((_, i) => {
      const priceOffset = (i + 1) * (currentPrice * 0.002) // 0.2% increments
      const price = currentPrice - priceOffset
      const amount = (Math.random() * 0.5).toFixed(4)
      const total = (price * Number(amount)).toFixed(2)

      return {
        price: price.toFixed(2),
        amount,
        total,
      }
    })

    setOrderBook({ sells, buys })
  }, [selectedCrypto])

  // Generate recent trades
  useEffect(() => {
    const generateTrades = () => {
      const now = new Date()
      const trades = Array.from({ length: 5 }).map((_, i) => {
        const tradeTime = new Date(now.getTime() - i * 30000) // 30 second intervals
        const isUp = Math.random() > 0.5
        const tradePrice = selectedCrypto.price + (isUp ? 1 : -1) * Math.random() * (selectedCrypto.price * 0.001)

        return {
          time: tradeTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          price: tradePrice.toFixed(2),
          amount: (Math.random() * 0.05).toFixed(4),
          type: isUp ? "buy" : "sell",
        }
      })

      setRecentTrades(trades)
    }

    generateTrades()
    const interval = setInterval(generateTrades, 10000)

    return () => clearInterval(interval)
  }, [selectedCrypto])

  // Handle crypto selection
  const handleCryptoSelect = (symbol: string) => {
    const selected = cryptoData.find((crypto) => crypto.symbol === symbol)
    if (selected) {
      setSelectedCrypto(selected)
      setChartData(generateHistoricalData(selected.price, timeFrame))
    }
  }

  return (
    <div className="min-h-screen font-mono bg-white text-black">
      {/* Header */}
      <header className="border-b-4 border-black p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Menu className="h-6 w-6" />
            <h1 className="text-2xl font-bold uppercase tracking-wider">CRYPTO_BRUT</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              className="border-2 border-black text-black hover:bg-black hover:text-white font-medium"
            >
              CONNECT WALLET
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left Sidebar */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="p-4 border-4 bg-white border-black">
            <h2 className="text-xl font-bold mb-4 uppercase">MARKETS</h2>
            <div className="space-y-2">
              {cryptoData.map((crypto, index) => (
                <div
                  key={index}
                  className={`flex justify-between items-center border-b-2 border-dashed border-gray-300 pb-2 cursor-pointer ${selectedCrypto.symbol === crypto.symbol ? "bg-gray-100" : ""}`}
                  onClick={() => handleCryptoSelect(crypto.symbol)}
                >
                  <span className="font-bold">{crypto.name}</span>
                  <div className="text-right">
                    <div className="font-medium">
                      {crypto.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </div>
                    <div className={crypto.change >= 0 ? "text-green-600" : "text-red-600"}>
                      {crypto.change >= 0 ? "+" : ""}
                      {crypto.change.toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              className="w-full mt-4 border-2 border-black text-black hover:bg-black hover:text-white font-medium"
            >
              VIEW ALL
            </Button>
          </Card>

          <Card className="p-4 border-4 bg-white border-black">
            <h2 className="text-xl font-bold mb-4 uppercase">PORTFOLIO</h2>
            <div className="text-center text-3xl font-bold mb-4">$12,456.78</div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="border-2 border-black p-2 text-center">
                <div className="text-sm font-medium">24H CHANGE</div>
                <div className="text-green-600 font-medium">+$241.56</div>
              </div>
              <div className="border-2 border-black p-2 text-center">
                <div className="text-sm font-medium">ASSETS</div>
                <div className="font-medium">5</div>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full border-2 border-black text-black hover:bg-black hover:text-white font-medium"
            >
              MANAGE
            </Button>
          </Card>
        </div>

        {/* Main Trading Area */}
        <div className="lg:col-span-6 space-y-6">
          <Card className="p-4 border-4 bg-white border-black">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">{selectedCrypto.name}</h2>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {selectedCrypto.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
                <div className={selectedCrypto.change >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                  {selectedCrypto.change >= 0 ? "+" : ""}
                  {selectedCrypto.change.toFixed(2)}%
                </div>
              </div>
            </div>

            {/* Live Chart */}
            <div className="border-2 border-black h-64 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#000000" strokeOpacity={0.3} />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 12, fontFamily: "monospace" }}
                    axisLine={{ stroke: "#000000" }}
                    tickLine={{ stroke: "#000000" }}
                  />
                  <YAxis
                    domain={["auto", "auto"]}
                    tick={{ fontSize: 12, fontFamily: "monospace" }}
                    axisLine={{ stroke: "#000000" }}
                    tickLine={{ stroke: "#000000" }}
                    width={80}
                    tickFormatter={(value) =>
                      `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                    }
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#000000"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 2, stroke: "#000000" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-4">
              {["1H", "1D", "1W", "1M"].map((period) => (
                <Button
                  key={period}
                  variant={period === timeFrame ? "default" : "outline"}
                  className={
                    period === timeFrame
                      ? "bg-black text-white hover:bg-gray-800 font-medium"
                      : "border-2 border-black text-black hover:bg-black hover:text-white font-medium"
                  }
                  onClick={() => setTimeFrame(period)}
                >
                  {period}
                </Button>
              ))}
            </div>
          </Card>

          <Card className="p-4 border-4 bg-white border-black">
            <Tabs defaultValue="buy">
              <TabsList className="grid w-full grid-cols-2 mb-4 bg-white">
                <TabsTrigger
                  value="buy"
                  className="data-[state=active]:bg-green-500 data-[state=active]:text-black border-2 border-black font-medium"
                >
                  BUY
                </TabsTrigger>
                <TabsTrigger
                  value="sell"
                  className="data-[state=active]:bg-red-500 data-[state=active]:text-black border-2 border-black font-medium"
                >
                  SELL
                </TabsTrigger>
              </TabsList>
              <TabsContent value="buy" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block font-bold">AMOUNT ({selectedCrypto.symbol})</label>
                    <div className="flex border-2 border-black">
                      <input
                        type="text"
                        placeholder="0.00"
                        className="p-2 w-full focus:outline-none font-medium bg-white text-black"
                      />
                      <div className="p-2 font-bold bg-black text-white">{selectedCrypto.symbol}</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block font-bold">PRICE (USD)</label>
                    <div className="flex border-2 border-black">
                      <input
                        type="text"
                        placeholder="0.00"
                        className="p-2 w-full focus:outline-none font-medium bg-white text-black"
                        value={selectedCrypto.price.toFixed(2)}
                        readOnly
                      />
                      <div className="p-2 font-bold bg-black text-white">USD</div>
                    </div>
                  </div>
                </div>
                <Button className="w-full bg-green-500 text-black hover:bg-green-600 h-12 text-lg font-bold">
                  BUY {selectedCrypto.symbol}
                </Button>
              </TabsContent>
              <TabsContent value="sell" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block font-bold">AMOUNT ({selectedCrypto.symbol})</label>
                    <div className="flex border-2 border-black">
                      <input
                        type="text"
                        placeholder="0.00"
                        className="p-2 w-full focus:outline-none font-medium bg-white text-black"
                      />
                      <div className="p-2 font-bold bg-black text-white">{selectedCrypto.symbol}</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block font-bold">PRICE (USD)</label>
                    <div className="flex border-2 border-black">
                      <input
                        type="text"
                        placeholder="0.00"
                        className="p-2 w-full focus:outline-none font-medium bg-white text-black"
                        value={selectedCrypto.price.toFixed(2)}
                        readOnly
                      />
                      <div className="p-2 font-bold bg-black text-white">USD</div>
                    </div>
                  </div>
                </div>
                <Button className="w-full bg-red-500 text-black hover:bg-red-600 h-12 text-lg font-bold">
                  SELL {selectedCrypto.symbol}
                </Button>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="p-4 border-4 bg-white border-black">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold uppercase">ORDER BOOK</h2>
              <ArrowUpDown className="h-5 w-5" />
            </div>

            {/* Sell Orders */}
            <div className="space-y-1 mb-4">
              {orderBook.sells.map((order, index) => (
                <div key={index} className="flex justify-between text-red-600 text-sm font-medium">
                  <span>{Number(order.price).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  <span>{order.amount}</span>
                  <span>{Number(order.total).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>

            {/* Current Price */}
            <div className="border-y-2 border-black py-2 text-center font-bold text-lg">
              {selectedCrypto.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>

            {/* Buy Orders */}
            <div className="space-y-1 mt-4">
              {orderBook.buys.map((order, index) => (
                <div key={index} className="flex justify-between text-green-600 text-sm font-medium">
                  <span>{Number(order.price).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  <span>{order.amount}</span>
                  <span>{Number(order.total).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4 border-4 bg-white border-black">
            <h2 className="text-xl font-bold mb-4 uppercase">RECENT TRADES</h2>
            <div className="space-y-2">
              {recentTrades.map((trade, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center border-b border-dashed border-gray-300 pb-1 text-sm font-medium"
                >
                  <span>{trade.time}</span>
                  <span className={trade.type === "buy" ? "text-green-600" : "text-red-600"}>
                    {Number(trade.price).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                  <span>{trade.amount}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-4 border-black p-4 mt-8">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-lg font-bold mb-2 uppercase">CRYPTO_BRUT</h3>
              <p className="text-sm font-medium">
                A BRUTALIST APPROACH TO CRYPTOCURRENCY TRADING. RAW. FUNCTIONAL. DIRECT.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2 uppercase">LINKS</h3>
              <div className="grid grid-cols-2 gap-2">
                {["MARKETS", "TRADE", "WALLET", "HISTORY", "SETTINGS", "HELP"].map((link, index) => (
                  <Link key={index} href="#" className="text-sm hover:underline font-medium">
                    {link}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2 uppercase">NEWSLETTER</h3>
              <div className="flex">
                <input
                  type="email"
                  placeholder="YOUR EMAIL"
                  className="p-2 w-full focus:outline-none border-2 font-medium bg-white border-black text-black"
                />
                <Button className="font-medium bg-black text-white hover:bg-gray-800">SUBSCRIBE</Button>
              </div>
            </div>
          </div>
          <Separator className="my-4 bg-gray-300" />
          <div className="text-center text-sm font-medium">
            © 2025 CRYPTO_BRUT. ALL RIGHTS RESERVED. BRUTALISM IN ACTION.
          </div>
        </div>
      </footer>
    </div>
  )
}

