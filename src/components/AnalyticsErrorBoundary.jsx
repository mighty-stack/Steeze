import { Component } from 'react';
import { trackClientError } from '../lib/analytics/track.js';

export default class AnalyticsErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    trackClientError(error?.message || 'Application render failed');
  }

  render() {
    if (this.state.hasError) {
      return <div className="form-error" role="alert">This page could not be displayed. Reload to try again.</div>;
    }
    return this.props.children;
  }
}
