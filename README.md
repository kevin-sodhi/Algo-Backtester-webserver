Algo Backtester Webserver (Node + Java)
======================================

Node + Express web app that wraps a Java moving-average backtester. Users sign up / log in, upload a CSV, choose fast/slow MA windows, and the server runs the Java JAR to generate signals + metrics and renders results with Pug.

⸻

DEMO SCREENSHOTS
----------------

Login:
docs/login.png
<img width="1706" height="970" alt="login" src="https://github.com/user-attachments/assets/ffbf556a-627a-4f9d-9083-88cbde885f57" />

Create Account (Signup):
docs/create-account.png
<img width="1706" height="890" alt="create-account" src="https://github.com/user-attachments/assets/7d8820ab-0875-4fde-b99d-3d0dc5f146b7" />

Home (Upload + Run Backtest):
docs/home.png
<img width="1706" height="948" alt="home" src="https://github.com/user-attachments/assets/6ccb30c8-8aaf-4f89-a8a1-99cb788a826c" />


Backtest Results (Metrics + Signals + Chart):
docs/backtest-results.png
<img width="1706" height="948" alt="backtest-results" src="https://github.com/user-attachments/assets/3a7cb085-dddb-41a7-9676-05e244c23d59" />

⸻

FEATURES
--------

• Auth with PBKDF2 password hashing + sessions
• CSV uploads (CSV-only enforced)
• Runs Java JAR via child_process.spawn() and parses JSON output
• Results page shows metrics table, signal list, raw JSON, and a Chart.js visualization
• Download route for saved datasets: /files/:name

⸻

FOLDER SETUP (IMPORTANT)
-----------------------

You must clone BOTH repos into the same parent folder so the webserver can find the Java engine build.

Your structure should look like:

Algo-Backtester/
Algo-Backtester-webserver/
algo-backtester-java/

⸻

1. CLONE BOTH REPOS
------------------

mkdir Algo-Backtester
cd Algo-Backtester

git clone https://github.com/kevin-sodhi/Algo-Backtester-webserver.git
git clone https://github.com/kevin-sodhi/algo-backtester-java.git

⸻

PREREQUISITES
-------------

• Node.js + npm
• Java 17
• Maven
• MongoDB Atlas connection (or update credentials to your own)

⸻

2. BUILD THE JAVA ENGINE (REQUIRED)
-----------------------------------

From the parent folder:

cd algo-backtester-java
mvn -q -DskipTests package

The webserver expects the jar here:

../algo-backtester-java/target/algo-backtester-java-1.0.0-jar-with-dependencies.jar

NOTE:
For submission, a copy of the jar may also exist in:
Algo-Backtester-webserver/engine/algo-backtester.jar

If you want to use that instead, update the jar path in:
services/javaIntegration.js

⸻

3. INSTALL & RUN THE WEBSERVER
------------------------------

Open an integrated terminal in the Algo-Backtester-webserver folder:

cd ../Algo-Backtester-webserver
npm install
npm run dev

Then open:

http://localhost:3000

You will land on the login page first.

⸻

HOW TO USE (END-TO-END)
-----------------------

1. Go to http://localhost:3000
2. Create an account at /signup, then log in at /login
3. Open the main UI (legacy form):
http://localhost:3000/old-home
4. Upload a CSV (try: public/sample.csv)
5. Enter fast/slow MA windows (example: 5 and 20)
6. Run backtest and view metrics, signals, raw JSON, and chart on the results page

⸻

USEFUL ROUTES
-------------

• /signup        Create account
• /login         Log in
• /logout        Log out
• /old-home      Upload + run backtest UI
• /backtest/run  Runs the Java engine and renders results
• /files/:name   Download a dataset from the server data folder

⸻

CSV NOTES
---------

Use public/sample.csv or your own.
The Java engine expects a time series dataset (format depends on the engine implementation).

⸻

TROUBLESHOOTING
---------------

Java JAR not found / backtest fails:
• Rebuild Java repo:

cd ../algo-backtester-java
mvn -q -DskipTests package

• Confirm jar exists:

algo-backtester-java/target/algo-backtester-java-1.0.0-jar-with-dependencies.jar

Upload rejected:
• Only .csv files are allowed.

Invalid MA parameters:
• Fast and slow must be positive integers, and typically fast < slow.

⸻

PROJECT STRUCTURE
-----------------

• AlgoBacktester.js             Express entry point (sessions, views, routers, error handlers)
• services/javaIntegration.js   Spawns Java JAR + parses JSON output
• routes/                       auth, home, upload, backtest, downloads
• views/                        Pug templates (base, login, signup, backtest-results, error)
• public/                       static assets (legacy HTML, CSS, sample CSV, images)
• engine/                       submitted jar copy (optional path)
• ../data/                      upload target and default CSV storage (outside repo root)
