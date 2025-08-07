import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Search, User } from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  rncCedula: string;
  email: string;
  phone: string;
  address: string;
}

const Contactos = () => {
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([
    {
      id: '1',
      name: 'Juan Pérez',
      rncCedula: '001-1234567-8',
      email: 'juan@email.com',
      phone: '(809) 123-4567',
      address: 'Av. Principal 123, Santo Domingo'
    },
    {
      id: '2',
      name: 'Empresa ABC S.R.L.',
      rncCedula: '130-12345-6',
      email: 'contacto@empresa.com',
      phone: '(809) 987-6543',
      address: 'Calle Comercial 456, Santiago'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [newContact, setNewContact] = useState<Omit<Contact, 'id'>>({
    name: '',
    rncCedula: '',
    email: '',
    phone: '',
    address: ''
  });

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.rncCedula.includes(searchTerm) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveContact = () => {
    if (!newContact.name || !newContact.rncCedula) {
      toast({
        title: "Error",
        description: "Nombre y RNC/Cédula son obligatorios.",
        variant: "destructive",
      });
      return;
    }

    if (editingContact) {
      setContacts(prev => prev.map(contact => 
        contact.id === editingContact.id 
          ? { ...newContact, id: editingContact.id }
          : contact
      ));
      toast({
        title: "Contacto actualizado",
        description: "El contacto se ha actualizado correctamente.",
      });
    } else {
      const id = Date.now().toString();
      setContacts(prev => [...prev, { ...newContact, id }]);
      toast({
        title: "Contacto agregado",
        description: "El nuevo contacto se ha agregado correctamente.",
      });
    }

    setNewContact({ name: '', rncCedula: '', email: '', phone: '', address: '' });
    setEditingContact(null);
    setIsDialogOpen(false);
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setNewContact({ ...contact });
    setIsDialogOpen(true);
  };

  const handleDeleteContact = (id: string) => {
    setContacts(prev => prev.filter(contact => contact.id !== id));
    toast({
      title: "Contacto eliminado",
      description: "El contacto se ha eliminado correctamente.",
    });
  };

  const openNewContactDialog = () => {
    setEditingContact(null);
    setNewContact({ name: '', rncCedula: '', email: '', phone: '', address: '' });
    setIsDialogOpen(true);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-subtle">
        <div className="container mx-auto py-8 px-4">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-foreground">Contactos</h1>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openNewContactDialog}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Contacto
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>
                      {editingContact ? 'Editar Contacto' : 'Nuevo Contacto'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingContact ? 'Modifica los datos del contacto.' : 'Agrega un nuevo contacto a tu lista.'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre *</Label>
                      <Input
                        id="name"
                        value={newContact.name}
                        onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Nombre del contacto o empresa"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rncCedula">RNC/Cédula *</Label>
                      <Input
                        id="rncCedula"
                        value={newContact.rncCedula}
                        onChange={(e) => setNewContact(prev => ({ ...prev, rncCedula: e.target.value }))}
                        placeholder="123-4567890-1 o 130-12345-6"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Correo</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newContact.email}
                        onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="correo@ejemplo.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input
                        id="phone"
                        value={newContact.phone}
                        onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="(809) 123-4567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Dirección</Label>
                      <Input
                        id="address"
                        value={newContact.address}
                        onChange={(e) => setNewContact(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Dirección completa"
                      />
                    </div>
                    <Button onClick={handleSaveContact} className="w-full">
                      {editingContact ? 'Actualizar' : 'Guardar'} Contacto
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Lista de Contactos
                </CardTitle>
                <CardDescription>
                  Gestiona tus clientes y contactos para la facturación
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre, RNC/cédula o correo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>RNC/Cédula</TableHead>
                        <TableHead>Correo</TableHead>
                        <TableHead>Teléfono</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContacts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            {searchTerm ? 'No se encontraron contactos que coincidan con la búsqueda.' : 'No hay contactos registrados.'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredContacts.map((contact) => (
                          <TableRow key={contact.id}>
                            <TableCell className="font-medium">{contact.name}</TableCell>
                            <TableCell>{contact.rncCedula}</TableCell>
                            <TableCell>{contact.email || '-'}</TableCell>
                            <TableCell>{contact.phone || '-'}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditContact(contact)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteContact(contact.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Contactos;