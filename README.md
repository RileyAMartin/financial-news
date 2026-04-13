# Financial News Terminal
This project is a financial data terminal designed to aggregate and visualize macro-economic indicators, exchange rates, and global news. It uses a data engineering pipeline to pull data from various sources into a centralized warehouse, which is then served through a backend API to a dashboard.

## Project Structure / Stack
- *Airflow:* Orchestrates the data pipelines, including weekly economic updates, daily exchange rates, and hourly news ingestion.
- *dbt:* Handles data transformations, cleaning raw data and converting it to a star schema format.
- *GCP:* Hosts Python cloud functions which are called by Airflow to perform data ingestion from external APIs, and also transfer data between different environments.
- *Backend:* A Node.JS and Express API that serves processed data and other information used by the client.
- *Frontend:* A React-based terminal interface to display data.

## Current Status
The data infrastructure and backend logic are complete. The pipelines are currently orchestrated by Airflow, and are able to handle large volumes of historical exchange and economic data. The focus, right now, is developing the frontend to make the data accessible.
