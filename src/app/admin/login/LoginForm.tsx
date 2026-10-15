"use client";
import { useActionState } from "react";
import { loginAction } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, null);
  return (
    <form action={action} className="mt-6 space-y-3">
      <div>
        <label className="a-label" htmlFor="login">Логин</label>
        <input id="login" name="login" required autoComplete="username" className="a-input py-2.5" defaultValue={state?.login} key={state?.login} />
      </div>
      <div>
        <label className="a-label" htmlFor="password">Пароль</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="a-input py-2.5" />
      </div>
      {state?.error && <p role="alert" className="text-sm text-stop">{state.error}</p>}
      <button className="a-btn-primary w-full py-2.5" disabled={pending}>{pending ? "Входим…" : "Войти"}</button>
    </form>
  );
}
