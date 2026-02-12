import React from "react";
import ReactDOM from "react-dom/client";
import axios from "axios";
import "./index.css";
import App from "./App";

// Configure API base URL for production deployments (e.g., Vercel -> Render)
const apiBaseUrl = process.env.REACT_APP_API_URL?.replace(/\/$/, "");
if (apiBaseUrl) {
  axios.defaults.baseURL = apiBaseUrl;
  console.log('API Base URL configured:', apiBaseUrl);
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
