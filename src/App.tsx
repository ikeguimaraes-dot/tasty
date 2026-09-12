import { Component, lazy, Suspense, useEffect, type ReactNode } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AppProvider } from './lib/context'
import { Shell } from './components/Shell'
import { ToastView, Loading, EmptyState } from './components/ui'
import { Feed } from './pages/Feed'
import { Welcome, Auth, Onboarding } from './pages/Auth'
const Discover = lazy(() => import('./pages/Discover').then((m) => ({ default: m.Discover })))
const Create = lazy(() => import('./pages/Create').then((m) => ({ default: m.Create })))
const WriteReview = lazy(() => import('./pages/Create').then((m) => ({ default: m.WriteReview })))
const Bill = lazy(() => import('./pages/Bill').then((m) => ({ default: m.Bill })))
const Games = lazy(() => import('./pages/Games').then((m) => ({ default: m.Games })))
const GameSetup = lazy(() => import('./pages/Games').then((m) => ({ default: m.GameSetup })))
const GameRoomPage = lazy(() => import('./pages/Games').then((m) => ({ default: m.GameRoomPage })))
const Profile = lazy(() => import('./pages/Profile').then((m) => ({ default: m.Profile })))
const Notifications = lazy(() =>
  import('./pages/Profile').then((m) => ({ default: m.Notifications })),
)
const Detail = lazy(() => import('./pages/Details').then((m) => ({ default: m.Detail })))
const SingleReview = lazy(() =>
  import('./pages/Details').then((m) => ({ default: m.SingleReview })),
)
const Saved = lazy(() => import('./pages/Details').then((m) => ({ default: m.Saved })))
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  render() {
    return this.state.hasError ? (
      <div className="fatal-error">
        <h1>Vamos preparar a mesa de novo?</h1>
        <p>Algo não carregou como esperado. Recarregue para continuar.</p>
        <button className="btn" onClick={() => window.location.reload()}>
          Tentar novamente
        </button>
      </div>
    ) : (
      this.props.children
    )
  }
}
export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <ScrollToTop />
        <a className="skip-link" href="#main-content">
          Pular para o conteúdo
        </a>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route element={<Shell />}>
              <Route index element={<Feed />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/create" element={<Create />} />
              <Route path="/write" element={<WriteReview />} />
              <Route path="/bill" element={<Bill />} />
              <Route path="/games" element={<Games />} />
              <Route path="/games/:kind" element={<GameSetup />} />
              <Route path="/games/:kind/room/:roomId" element={<GameRoomPage />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/people/:id" element={<Profile />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/saved" element={<Saved />} />
              <Route path="/dish/:id" element={<Detail kind="dish" />} />
              <Route path="/restaurant/:id" element={<Detail kind="restaurant" />} />
              <Route path="/review/:id" element={<SingleReview />} />
              <Route
                path="*"
                element={
                  <EmptyState
                    title="Essa mesa ainda não existe"
                    text="Volte ao feed para descobrir algo gostoso."
                    action="Ir para o feed"
                    to="/"
                  />
                }
              />
            </Route>
          </Routes>
        </Suspense>
        <ToastView />
      </AppProvider>
    </ErrorBoundary>
  )
}
