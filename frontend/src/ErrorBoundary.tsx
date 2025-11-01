import React from "react";
import { notify } from "./store/toast";

type Props = { children: React.ReactNode };
type State = { error?: Error };

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = {};
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error) {
    console.error(error);
    notify.error("Une erreur imprévue est survenue. Réessaie ou recharge la page.");
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="card" style={{ margin: 16 }}>
        <h1 style={{ fontSize: 18, marginBottom: 8 }}>Erreur d’application</h1>
        <div style={{ color: "var(--muted)", marginBottom: 10 }}>
          {this.state.error.message}
        </div>
        <button className="btn primary" onClick={() => location.reload()}>
          Recharger
        </button>
      </div>
    );
  }
}
