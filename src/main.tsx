// =====================================================
// src/main.tsx
// Точка входа React
// =====================================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

// -----------------------------------------------------
// Error Boundary — защита от белого экрана
// -----------------------------------------------------
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: string;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('PoiskHelper: крит. ошибка', error, errorInfo);
    this.setState({
      errorInfo: errorInfo.componentStack || '',
    });
  }

  handleReload = function () {
    window.location.reload();
  };

  handleResetAndReload = function () {
    try {
      // Очищаем последнее состояние — если что-то сломало рендер
      localStorage.removeItem('poiskhelper_project_v2');
      localStorage.removeItem('poiskhelper_imported_v1');
    } catch (e) {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.errorOverlay}>
          <div style={styles.errorCard}>
            <div style={styles.errorTitle}>Что-то пошло не так</div>
            <div style={styles.errorMessage}>
              {this.state.error?.message || 'Неизвестная ошибка'}
            </div>
            {this.state.errorInfo && (
              <pre style={styles.errorStack}>
                {this.state.errorInfo.slice(0, 800)}
              </pre>
            )}
            <div style={styles.errorActions}>
              <button style={styles.errorBtn} onClick={this.handleReload}>
                Перезагрузить
              </button>
              <button
                style={styles.errorBtnDanger}
                onClick={this.handleResetAndReload}
                title="Очистит последнее сохранённое состояние в localStorage"
              >
                Сбросить и перезагрузить
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// -----------------------------------------------------
// === Root ===
// -----------------------------------------------------
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('main.tsx: элемент #root не найден');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// =====================================================
// === Стили ошибки (inline, чтобы работали без CSS) ===
// =====================================================
const styles: Record<string, React.CSSProperties> = {
  errorOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0d0d12',
    color: '#f2f2f5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Segoe UI, sans-serif',
    zIndex: 99999,
    padding: 20,
  },
  errorCard: {
    maxWidth: 560,
    width: '100%',
    backgroundColor: '#1a1a22',
    border: '1px solid rgba(231, 76, 60, 0.4)',
    borderRadius: 10,
    padding: '24px 28px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#e74c3c',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 13.5,
    color: '#f2f2f5',
    marginBottom: 12,
    lineHeight: 1.5,
    wordBreak: 'break-word',
  },
  errorStack: {
    fontSize: 11,
    color: '#b8b8c0',
    backgroundColor: '#0d0d12',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 6,
    padding: '10px 12px',
    overflow: 'auto',
    maxHeight: 220,
    marginBottom: 16,
    fontFamily: 'Consolas, monospace',
    lineHeight: 1.45,
  },
  errorActions: {
    display: 'flex',
    gap: 8,
    justifyContent: 'flex-end',
  },
  errorBtn: {
    padding: '8px 16px',
    backgroundColor: '#4a90d9',
    border: 'none',
    borderRadius: 6,
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  errorBtnDanger: {
    padding: '8px 16px',
    backgroundColor: 'transparent',
    border: '1px solid #e74c3c',
    borderRadius: 6,
    color: '#e74c3c',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
};