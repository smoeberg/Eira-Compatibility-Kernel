import { Link, Outlet } from "react-router-dom";
import { clearAdminKey, usesSessionAuth } from "./api/client";

export function Layout() {
  return (
    <div className="shell">
      <nav className="nav">
        <Link to="/" className="brand">
          ECK · Eira Systems
        </Link>
        <button
          type="button"
          className="linkish"
          onClick={() => {
            if (usesSessionAuth()) {
              window.location.href = "/auth/logout";
              return;
            }
            clearAdminKey();
            window.location.href = "/login";
          }}
        >
          Log ud
        </button>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
