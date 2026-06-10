# Python Integration, GitHub Push, and Cloud Deployment Guidelines (College Guide)

Congratulations! This project has been elevated to a **Modern Hybrid Enterprise Architecture** combining a high-performance React frontend, an Express Node.js application server, and a dedicated **Python Admin CLI, Predictive Analytics & Intelligence Module**.

Below are the complete steps to run the Python modules, upload your code to Git, and host your app live on Vercel or Render!

---

## 1. How to Run the Python Scripts Locally

Simply open your terminal or command prompt at the project root folder and execute the following commands:

### A. Run the Core Syllabus Command-Line Interface (`main.py`)
This is the **exact, highly-detailed console-based application matching your college syllabus guidelines!** It contains full Abstraction, Polymorphism, Inheritance (`StandardRoom` and `DeluxeRoom` inheriting from abstract `Room`), Encapsulation (protecting details/salaries), Sets, Tuples, Lambda filter sorting, and Custom Exceptions.
```bash
python3 python/main.py
```
*(On Windows: `python python/main.py`)*

### B. Run the Interactive Administrator Command-Line Terminal (`admin_terminal.py`)
This is another console dashboard that provides dynamic pricing and high-level operations.
```bash
python3 python/admin_terminal.py
```
*(On Windows: `python python/admin_terminal.py`)*

### C. Run the AI-Powered Dynamic Pricing & Demand Forecaster (`demand_forecaster.py`)
This script analyzes live booking occupancies and dynamically calculates optimal dynamic price recommendations based on real-time hospitality demand rules!
```bash
python3 python/demand_forecaster.py
```
- **Output Audit Insights File:** `python/reports/pricing_demand_forecast.txt`

### D. Run the Business Intelligence & Analytics Engine (`analytics_engine.py`)
This script compiles database statistics (booking counts, ledger revenues, ratings, complaint volumes) and exports a professional analytical business audit memo.
```bash
python3 python/analytics_engine.py
```
- **Output Business Memo File:** `python/reports/hotel_business_report.txt`

### E. Run the Database Backup and CSV Exporter ETL Pipeline (`backup_and_export.py`)
This pipeline converts live JSON transactions into historical backup snapshots and exports rooms, guests, bookings, and billing ledgers into clean CSV sheets for MS Excel.
```bash
python3 python/backup_and_export.py
```
- **Backup Folder:** `python/backups/`
- **Excel Exports:** `python/exports/`

---

## 2. Dynamic Pricing & Yield Optimization (Why this makes your college project amazing!)
In modern hospitality systems (like Marriott, Taj, or Airbnb), prices are never fixed. They change based on **Real-Time Demand Forecasts**. 
By adding `demand_forecaster.py`, your project demonstrates:
1. **Dynamic Yield Management:** Automatically spikes pricing when occupancy exceeds peak limits (e.g. >50% or >80%) to maximize revenue.
2. **Promotional Campaign Triggers:** Automatically suggests a 15% promotional drop when occupancy drops to critical zones (<20%) to fill vacant suites.
3. **Data Science Pipelines:** Demonstrates raw data filtering, object grouping, and mathematical mapping in Python.

---

## 3. How to Push the Code to your GitHub Repository

To upload your entire hybrid codebase into your personal repository: `https://github.com/ashishsingh256259/Hotel-and-Management-System.git` from your local machine, follow these commands:

### Step 1: Download the Project Code
Go to the AI Studio dashboard sidebar, click the **Settings Cog / Export** menu, and choose **Export as ZIP**. Extract this ZIP file into a folder on your computer.

### Step 2: Initialize Git in your folder
Open your terminal inside the extracted project folder, then run:
```bash
# Initialize git
git init

# Add remote repository URL
git remote add origin https://github.com/ashishsingh256259/Hotel-and-Management-System.git

# Verify remote repository
git remote -v
```

### Step 3: Add and Commit Files
```bash
# Add all files to staging index
git add .

# Create initial commit
git commit -m "feat: complete unified hybrid node-react and python administrative architecture"
```

### Step 4: Rename Branch and Push
Ensure your branch name matches the GitHub default (`main`):
```bash
git branch -M main

# Force push to override any existing empty placeholder structure
git push -u origin main --force
```

*Note: If GitHub prompts you for authentication, use your GitHub username and a **Personal Access Token (PAT)** as your password (which you can generate in GitHub under Settings -> Developer Settings -> Personal Access Tokens).*

---

## 4. How to Deploy the Application Live on Vercel & Render

Because this is a real-world **full-stack hybrid application** with an Express Node.js backend server and a React frontend, you will deploy them cleanly using two standard methods:

### Method A: Unified Deployment on Render (Highly Recommended)
Render allows you to deploy Node.js web services with simple absolute ease.

1. **Sign Up/Log In:** Go to [Render](https://render.com) and link your GitHub account.
2. **Create Web Service:** Click **New +** -> **Web Service** and select your repository: `Hotel-and-Management-System`.
3. **Configure Settings:**
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start`
   - **Environment Variables:**
     - Add `NODE_ENV = production`
     - Add any other environment credentials you have (such as custom keys, if any).
4. **Deploy:** Render will automatically build the React assets and run the Express server on port 3000, serving your frontend SPA and APIs together under a single free HTTPS cloud domain!

### Method B: Deploying on Vercel (Frontend SPA) + Render (Backend Express APIs)
If you prefer splitting the frontend and backend:

#### 1. Frontend: Deploying React on Vercel
1. Go to [Vercel](https://vercel.com) and click **Add New** -> **Project**.
2. Select your `Hotel-and-Management-System` repository.
3. Vercel automatically detects Vite/React configuration. Under **Build & Development Settings**, keep defaults:
   - **Output Directory:** `dist`
4. Click **Deploy**. Vercel will host your dynamic frontend React pages.

#### 2. Backend: Deploying Express APIs on Render
1. Create a Render **Web Service** just for the API routes. 
2. Change the React server target environment parameters dynamically (e.g., matching the host dynamically in your frontend network configuration so your UI calls your Render backend instead of localhost).
