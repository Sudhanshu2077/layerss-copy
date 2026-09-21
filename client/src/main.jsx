import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

function bootFailed() {
  var root = document.getElementById("root");
  if (root) {
    root.innerHTML =
      '<p style="font-family:sans-serif;text-align:center;padding:3rem 1rem;color:#3a0e1a">Layerss could not start on this browser. Please update it to the latest version and try again.</p>';
  }
}

try {
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (err) {
  bootFailed();
}
