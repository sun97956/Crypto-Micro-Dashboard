# Crypto Macro Dashboard

一个面向加密市场的宏观数据看板，将链上价格、美联储经济数据与市场情绪整合在同一个页面，帮助你在做投资判断时快速建立宏观视角。

**线上地址：** [crypto-micro-dashboard.vercel.app](https://crypto-micro-dashboard.vercel.app)

---

## 看板内容

**价格与市场**
- BTC、ETH、SOL、BNB、XRP、HYPE 实时报价，24h / 7d 涨跌幅
- BTC 历史走势面积图，支持 7D / 30D / 90D 切换
- 全球加密市场总市值、BTC 市场占比、稳定币规模

**宏观经济**
- 美联储基金利率、10 年期美债收益率、CPI、欧元兑美元汇率
- M2 货币供应量与 BTC 价格的长期对比图（2020 年至今）

**市场情绪**
- Alternative.me 恐惧与贪婪指数近期走势，含 Extreme Fear / Greed 分区线

---

## 使用方式

**方式一：直接访问线上版本**

打开线上地址即可，无需注册或登录。数据默认缓存（价格每小时更新，宏观与情绪每天更新），点击右上角 **Refresh** 按钮可手动刷新所有数据。

**方式二：本地运行**

需要自行申请 CoinMarketCap、CoinGecko Pro、FRED 的 API Key，在根目录创建 `.env.local` 填入后启动：

```bash
git clone https://github.com/sun97956/Crypto-Micro-Dashboard.git
cd Crypto-Micro-Dashboard
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看。

---

## 数据来源

[CoinMarketCap](https://coinmarketcap.com) · [CoinGecko](https://coingecko.com) · [FRED](https://fred.stlouisfed.org) · [Alternative.me](https://alternative.me)
