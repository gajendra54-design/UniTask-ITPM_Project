import { createRoot } from "react-dom/client";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import "./index.css";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <DndProvider backend={HTML5Backend}>
    <AuthProvider>
      <App />
    </AuthProvider>
  </DndProvider>
);
