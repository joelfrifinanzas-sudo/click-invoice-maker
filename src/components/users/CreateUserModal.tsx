import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, UserPlus } from "lucide-react";

interface CreateUserModalProps {
  companyId: string;
  onUserCreated: () => void;
  disabled?: boolean;
}

export function CreateUserModal({ companyId, onUserCreated, disabled }: CreateUserModalProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    role: "cajera" as "admin" | "cajera" | "cliente",
    password: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email.trim() || !formData.full_name.trim()) {
      toast({
        title: "Campos requeridos",
        description: "Email y nombre completo son obligatorios",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        email: formData.email.trim(),
        full_name: formData.full_name.trim(),
        role: formData.role,
        company_id: companyId,
        ...(formData.password.trim() && { password: formData.password.trim() })
      };

      const { data, error } = await supabase.functions.invoke('create_user_and_membership', {
        body: payload
      });

      if (error) {
        throw new Error(error.message || 'Error creating user');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Usuario creado",
        description: `${formData.email} ha sido agregado exitosamente`
      });

      // Reset form and close modal
      setFormData({
        email: "",
        full_name: "",
        role: "cajera",
        password: ""
      });
      setOpen(false);
      
      // Trigger optimistic UI update
      onUserCreated();

    } catch (error: any) {
      toast({
        title: "Error al crear usuario",
        description: error.message || "Intente nuevamente",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled}>
          <UserPlus className="w-4 h-4 mr-2" />
          Crear usuario
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear nuevo usuario</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="usuario@ejemplo.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name">Nombre completo *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              placeholder="Juan Pérez"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rol</Label>
            <Select
              value={formData.role}
              onValueChange={(value: "admin" | "cajera" | "cliente") => 
                setFormData(prev => ({ ...prev, role: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="cajera">Cajera</SelectItem>
                <SelectItem value="cliente">Cliente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña temporal (opcional)</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Dejar vacío para generar automáticamente"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Crear usuario
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}