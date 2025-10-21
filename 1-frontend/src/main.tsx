import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import AdminCommentsPage from './pages/admin/comments';
import AdminUsersPage from './pages/admin/users';
import NotFoundPage from './pages/not-found';

// Check if we have dehydrated state from SSR
const dehydratedState = (window as any).__DEHYDRATED_STATE__;

if (dehydratedState) {
  // Hydrate the app with server-side data
  hydrateRoot(document.getElementById("root")!, <App />);
  // Clean up the global variable
  delete (window as any).__DEHYDRATED_STATE__;
} else {
  // Regular client-side rendering
  createRoot(document.getElementById("root")!).render(<App />);
}
