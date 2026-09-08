import { Component, StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider } from "@/lib/auth/provider";
import { SpoonfulApp } from "@/components/spoonful-app";
import { unlockTester } from "@/lib/tester";
import "./styles.css";

window.__SPOONFUL_APK__ = true;
unlockTester();
document.documentElement.dataset.theme = "paper";

class KitchenError extends Component<{ children: ReactNode }, { err: Error | null }> {
  state = { err: null as Error | null };

  static getDerivedStateFromError(err: Error) {
    return { err };
  }

  render() {
    if (!this.state.err) return this.props.children;
    return (
      <main
        style={{
          minHeight: "100vh",
          padding: 28,
          fontFamily: "system-ui, sans-serif",
          color: "#16110c",
          background: "#f3e0c8",
        }}
      >
        <p style={{ letterSpacing: "0.16em", textTransform: "uppercase", fontSize: 12, color: "#e24a12" }}>
          Spoonful
        </p>
        <h1 style={{ fontSize: 32 }}>The kitchen hit a snag</h1>
        <p style={{ lineHeight: 1.5 }}>{this.state.err.message}</p>
      </main>
    );
  }
}

const root = document.getElementById("root");
if (!root) throw new Error("Spoonful could not find the kitchen root.");

createRoot(root).render(
  <StrictMode>
    <KitchenError>
      <AuthProvider>
        <SpoonfulApp />
      </AuthProvider>
    </KitchenError>
  </StrictMode>,
);
