import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAuthMe, setAdminKey, usesSessionAuth } from "../api/client";

export function LoginPage() {
  const [key, setKey] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!usesSessionAuth()) {
      return;
    }
    fetchAuthMe().then((me) => {
      if (me.authenticated) {
        navigate("/", { replace: true });
      } else {
        window.location.assign("/auth/login?return=%2F");
      }
    }).catch(() => window.location.assign("/auth/login?return=%2F"));
  }, [navigate]);

  function submit(e: FormEvent) {
    e.preventDefault();
    setAdminKey(key.trim());
    navigate("/");
  }

  if (usesSessionAuth()) {
    return (
      <div className="page narrow">
        <p className="muted">Omdirigerer til login…</p>
      </div>
    );
  }

  return (
    <div className="page narrow">
      <h1>ECK Admin</h1>
      <p className="muted">Dev: log ind med admin API-nøgle.</p>
      <form onSubmit={submit} className="card stack">
        <label>
          X-Admin-Api-Key
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="ADMIN_API_KEY"
            required
          />
        </label>
        <button type="submit">Fortsæt</button>
      </form>
    </div>
  );
}
