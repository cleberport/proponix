import { Inbox } from 'lucide-react';

const Recebidos = () => {
  return (
    <div className="p-4 md:p-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Inbox className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Recebidos</h1>
          <p className="text-sm text-muted-foreground hidden sm:block">Propostas recebidas de outros usuários</p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
          <Inbox className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Nenhuma proposta recebida</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Quando você receber propostas de outros usuários, elas aparecerão aqui.
        </p>
      </div>
    </div>
  );
};

export default Recebidos;
