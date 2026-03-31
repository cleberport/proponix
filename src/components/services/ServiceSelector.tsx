import { useServices, Service } from '@/hooks/useServices';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Package, Plus } from 'lucide-react';
import { useState } from 'react';
import ServiceLibrary from './ServiceLibrary';

interface Props {
  selectedServiceId: string;
  onSelect: (service: Service | null) => void;
  label?: string;
}

const ServiceSelector = ({ selectedServiceId, onSelect, label }: Props) => {
  const { services, loading, reload } = useServices();
  const [libraryOpen, setLibraryOpen] = useState(false);

  const handleLibraryClose = (open: boolean) => {
    setLibraryOpen(open);
    if (!open) reload();
  };

  const handleChange = (value: string) => {
    if (value === '__manage__') {
      setLibraryOpen(true);
      return;
    }
    const service = services.find(s => s.id === value) || null;
    onSelect(service);
  };

  return (
    <div>
      {label && <label className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground block">{label}</label>}
      <div className="flex gap-2">
        <Select value={selectedServiceId} onValueChange={handleChange}>
          <SelectTrigger className="h-12 md:h-10 flex-1">
            <SelectValue placeholder={loading ? 'Carregando...' : 'Selecionar serviço...'} />
          </SelectTrigger>
          <SelectContent>
            {services.map(s => (
              <SelectItem key={s.id} value={s.id}>
                <div className="flex items-center gap-2">
                  <Package className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">{s.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    R$ {s.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </SelectItem>
            ))}
            <SelectItem value="__manage__">
              <div className="flex items-center gap-2 text-primary">
                <Plus className="h-3.5 w-3.5" />
                <span>Gerenciar serviços...</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <ServiceLibrary open={libraryOpen} onOpenChange={handleLibraryClose} />
    </div>
  );
};

export default ServiceSelector;
