import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export default function Login() {
  const { user, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Login | App";
  }, []);

  if (user) return <Navigate to="/app/inicio" replace />;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      toast({ title: "Error de inicio de sesión", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sesión iniciada" });
      navigate("/app/inicio", { replace: true });
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signUp(email, password);
    setSubmitting(false);
    if (error) {
      toast({ title: "Error al registrarse", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Registro exitoso", description: "Revisa tu correo para confirmar (si aplica)." });
    }
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-4">Iniciar sesión</h1>
      <form className="space-y-4" onSubmit={handleLogin}>
        <div>
          <label className="block mb-1">Email</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="block mb-1">Contraseña</label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div className="flex items-center gap-2">
          <Button type="submit" disabled={submitting}>Entrar</Button>
          <Button type="button" variant="outline" onClick={handleSignup} disabled={submitting}>Crear cuenta</Button>
        </div>
      </form>
    </main>
  );
}
