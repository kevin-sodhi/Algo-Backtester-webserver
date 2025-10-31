# 🧠 Algo Backtester Webserver
This project is a **Node.js + Express webserver** that connects to a **Java-based Algorithmic Backtracking Trading Engine**.  
It lets users upload historical stock CSV files (like AAPL or TSLA), choose moving-average strategy parameters, and run a **backtest** directly from a simple web interface.

The webserver passes the request to the Java engine, which performs all trading calculations (moving averages, buy/sell signals, equity tracking) and returns results in JSON — displayed as a formatted HTML report.
---

## 🚀 What This Project Does
When you open the site on **`http://localhost:3000`**, you can:

1. **Upload a CSV file** — your own stock data, e.g. `AAPL.csv`.
2. **Choose parameters** — fast and slow moving averages (e.g. 3 & 5). 
3. **Run a backtest** — the Node server spawns the Java engine, which computes:
   - SMA (Simple Moving Average) values  
   - Entry/exit signals (Buy, Sell, Hold)  
   - Equity curve (portfolio value over time)  
   - Summary metrics (total return %, bars read, etc.)
4. **See results instantly** — the server formats the JSON output into a readable web page with tables, metrics, and raw JSON which will be imporved with React.
---

## 🧩 Project Architecture
Algo-Backtester-webserver
<img width="626" height="505" alt="Screenshot 2025-10-30 at 10 06 06 PM" src="https://github.com/user-attachments/assets/81e50339-cc12-4d9f-83f5-258c31407072" />


## 🛠️ Tech Stack
| Layer | Technology |
|-------|-------------|
| **Backend** | Node.js, Express.js |
| **Integration** | Java 17 (Algorithmic Engine via `child_process.spawn`) |
| **File Uploads** | Multiparty |
| **Frontend** | HTML + CSS (static pages) |
| **Data Format** | CSV input → JSON output |
| **Error Handling** | Custom 404 and 500 HTML pages |

---

## ⚙️ How the Integration Works
1. The user submits a form (`fast=3`, `slow=5`) or uploads a CSV.  
2. The Node server runs:
   ```bash
   java -jar engine/algo-backtester.jar --csv ./data/AAPL.csv --fast 3 --slow 5 --strategy macrossover
   ```
3. The Java engine reads the CSV, performs moving-average logic, and prints JSON like:
   ```json
   {
     "metrics": { "barsRead": 10, "trades": 2, "totalReturnPct": 5.2 },
     "series": [ { "date": "2024-01-05", "smaFast": 108, "smaSlow": 106.2 }, ... ],
     "signals": [ { "date": "2024-01-05", "signal": "BUY" }, ... ]
   }
   ```
4. Node receives this output, parses it, and renders a web page showing:
   - Bars read  
   - Last SMA values  
   - Trades & total return  
   - Signal list  
   - Raw JSON for developers
---

## 🧰 Installation & Setup
### 1️⃣ Requirements
- **Node.js**
- **Java**
- Your Java JAR built as a fat JAR (with dependencies)
- 
### 2️⃣ Build the Java engine (from your Java repo)
In your Java project (`algo-backtester-java`):
```bash
mvn -q -DskipTests package
```
Copy the built JAR into your webserver folder:
```bash
cp target/algo-backtester-java-1.0.0-jar-with-dependencies.jar \
   ../Algo-Backtester-webserver/engine/algo-backtester.jar
```

### 3️⃣ Install and run the webserver
```bash
cd Algo-Backtester-webserver
npm install
npm run dev   # or npm start
```
Visit: **[http://localhost:3000](http://localhost:3000)**
---


## 🧪 Example Usage
- Upload your CSV → `AAPL.csv`
- Enter parameters → Fast = 3, Slow = 5
- Click **Run Backtest**

Example output summary:
```
Bars Read: 10
SMA Fast (last): 113
SMA Slow (last): 112
Trades: 0
Total Return %: 0
```
Then scroll down to see the full JSON data.
---

## 📦 Key Routes
| Endpoint | Method | Description |
|-----------|--------|-------------|
| `/` | GET | Home page with form |
| `/upload` | POST | Upload CSV file (stored in `/data/`) |
| `/backtest` | POST | Runs the Java engine with current CSV and MA parameters |
| `/files/:name` | GET | Downloads any CSV from `/data/` |
| `/error` | GET | Triggers a 500 test error |
| `/404` | GET | Example 404 page |

---
## 📸 Screenshot
<img width="1159" height="697" alt="Screenshot 2025-10-30 at 10 02 11 PM" src="https://github.com/user-attachments/assets/c76b46f5-7c70-48db-84e3-9a8202b01da8" />
<img width="1436" height="774" alt="Screenshot 2025-10-30 at 10 02 44 PM" src="https://github.com/user-attachments/assets/26a7b166-11ac-4ed5-8c16-951fd5ec6ed3" />



## 👤 Author
**Kevin Sodhi**  
Applied Computer Science + Finance/Economics @ University of Winnipeg  
📍 Canada  
🔗 [GitHub](https://github.com/kevin-sodhi) • [LinkedIn](https://linkedin.com/in/kevin-sodhi)

---
## 📝 License
MIT License © 2025 Kevin Sodhi  
Free to use and modify for educational and academic purposes.

