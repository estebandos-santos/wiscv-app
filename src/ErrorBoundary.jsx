import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state = { hasError: false, msg: "" }; }
  static getDerivedStateFromError(err){ return { hasError: true, msg: String(err) }; }
  componentDidCatch(err, info){ console.error(err, info); }
  render(){
    if (this.state.hasError) {
      return (
        <div style={{padding:16}}>
          <h2>Une erreur est survenue</h2>
          <pre style={{whiteSpace:"pre-wrap"}}>{this.state.msg}</pre>
          <p>Ouvre la console (F12) pour le détail exact.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
