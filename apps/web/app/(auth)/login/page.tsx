import { LoginForm } from "./login-form";

export const metadata = {
  title: "Iniciar sesión — VICINO",
  description: "Inicia sesión en VICINO para comprar y vender con confianza",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">VICINO</h1>
          <p className="text-muted-foreground">Tu mercado de confianza</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
