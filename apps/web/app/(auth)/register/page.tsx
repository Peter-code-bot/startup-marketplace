import { RegisterForm } from "./register-form";

export const metadata = {
  title: "Crear cuenta — VICINO",
  description: "Crea tu cuenta en VICINO y empieza a comprar y vender",
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">VICINO</h1>
          <p className="text-muted-foreground">Crea tu cuenta</p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}
