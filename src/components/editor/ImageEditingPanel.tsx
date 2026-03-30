import { CanvasElement } from '@/types/template';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Upload, Lock, Unlock, RotateCw, RefreshCw } from 'lucide-react';
import { useRef } from 'react';
import { Separator } from '@/components/ui/separator';
import { optimizeImageFile } from '@/lib/imageOptimization';

interface Props {
  element: CanvasElement;
  onUpdate: (updates: Partial<CanvasElement>) => void;
}

const ImageEditingPanel = ({ element, onUpdate }: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const CANVAS_W = 595;
  const CANVAS_H = 842;

  const handleImageReplace = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await optimizeImageFile(file, {
        maxDimension: element.type === 'logo' ? 1400 : 1800,
        targetBytes: element.type === 'logo' ? 900_000 : 800_000,
        preferredFormat: element.type === 'logo' ? 'image/png' : 'image/jpeg',
      });

      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        let newWidth = Math.min(element.width, CANVAS_W - 20);
        let newHeight = Math.round(newWidth / aspectRatio);
        if (newHeight > CANVAS_H - 20) {
          newHeight = CANVAS_H - 20;
          newWidth = Math.round(newHeight * aspectRatio);
        }
        onUpdate({
          imageUrl: url,
          width: newWidth,
          height: newHeight,
          imageScale: 1,
          imageOffsetX: 0,
          imageOffsetY: 0,
        });
      };
      img.src = url;
    } catch (error) {
      console.error('Erro ao substituir imagem:', error);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const resetEffects = () => {
    onUpdate({
      imageBrightness: 100,
      imageContrast: 100,
      imageSaturation: 100,
      imageOpacity: 100,
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Tip */}
      <div className="rounded-md bg-accent/50 px-3 py-2">
        <p className="text-[11px] text-foreground leading-relaxed">
          <strong>Duplo clique</strong> na imagem para enquadrar.
          Arraste para reposicionar, <strong>scroll</strong> para zoom.
        </p>
      </div>

      {/* Replace Image */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageReplace}
        className="hidden"
      />
      <Button
        variant="outline"
        size="sm"
        className="w-full text-xs"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="mr-1.5 h-3 w-3" />
        Substituir Imagem
      </Button>


      <Separator />

      {/* Lock */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {element.locked ? <Lock className="h-3.5 w-3.5 text-muted-foreground" /> : <Unlock className="h-3.5 w-3.5 text-muted-foreground" />}
          <Label className="text-xs text-muted-foreground">Travar posição</Label>
        </div>
        <Switch
          checked={element.locked || false}
          onCheckedChange={(checked) => onUpdate({ locked: checked })}
        />
      </div>

      <Separator />

      {/* Rotation */}
      <div>
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Rotação</Label>
          <span className="text-[10px] text-muted-foreground">{element.rotation || 0}°</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Slider
            value={[element.rotation || 0]}
            min={0}
            max={360}
            step={1}
            className="flex-1"
            onValueChange={([val]) => onUpdate({ rotation: val })}
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => onUpdate({ rotation: ((element.rotation || 0) + 90) % 360 })}
          >
            <RotateCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <Separator />

      {/* Border */}
      <div>
        <Label className="text-xs text-muted-foreground mb-1 block">Borda</Label>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Label className="text-[10px] text-muted-foreground w-14">Largura</Label>
            <Slider
              value={[element.borderWidth || 0]}
              min={0}
              max={20}
              step={1}
              className="flex-1"
              onValueChange={([val]) => onUpdate({ borderWidth: val })}
            />
            <span className="text-[10px] text-muted-foreground w-6 text-right">{element.borderWidth || 0}</span>
          </div>
          {(element.borderWidth || 0) > 0 && (
            <div className="flex items-center gap-2">
              <Label className="text-[10px] text-muted-foreground w-14">Cor</Label>
              <input
                type="color"
                value={element.borderColor || '#000000'}
                onChange={(e) => onUpdate({ borderColor: e.target.value })}
                className="h-6 w-6 cursor-pointer rounded border border-border"
              />
              <Input
                value={element.borderColor || '#000000'}
                onChange={(e) => onUpdate({ borderColor: e.target.value })}
                className="h-6 flex-1 text-[10px]"
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            <Label className="text-[10px] text-muted-foreground w-14">Raio</Label>
            <Slider
              value={[element.borderRadius || 0]}
              min={0}
              max={50}
              step={1}
              className="flex-1"
              onValueChange={([val]) => onUpdate({ borderRadius: val })}
            />
            <span className="text-[10px] text-muted-foreground w-6 text-right">{element.borderRadius || 0}</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Effects */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <Label className="text-xs text-muted-foreground">Efeitos Visuais</Label>
          <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px]" onClick={resetEffects}>
            Resetar
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Label className="text-[10px] text-muted-foreground w-16">Brilho</Label>
            <Slider
              value={[element.imageBrightness ?? 100]}
              min={0}
              max={200}
              step={1}
              className="flex-1"
              onValueChange={([val]) => onUpdate({ imageBrightness: val })}
            />
            <span className="text-[10px] text-muted-foreground w-8 text-right">{element.imageBrightness ?? 100}%</span>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-[10px] text-muted-foreground w-16">Contraste</Label>
            <Slider
              value={[element.imageContrast ?? 100]}
              min={0}
              max={200}
              step={1}
              className="flex-1"
              onValueChange={([val]) => onUpdate({ imageContrast: val })}
            />
            <span className="text-[10px] text-muted-foreground w-8 text-right">{element.imageContrast ?? 100}%</span>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-[10px] text-muted-foreground w-16">Saturação</Label>
            <Slider
              value={[element.imageSaturation ?? 100]}
              min={0}
              max={200}
              step={1}
              className="flex-1"
              onValueChange={([val]) => onUpdate({ imageSaturation: val })}
            />
            <span className="text-[10px] text-muted-foreground w-8 text-right">{element.imageSaturation ?? 100}%</span>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-[10px] text-muted-foreground w-16">Opacidade</Label>
            <Slider
              value={[element.imageOpacity ?? 100]}
              min={0}
              max={100}
              step={1}
              className="flex-1"
              onValueChange={([val]) => onUpdate({ imageOpacity: val })}
            />
            <span className="text-[10px] text-muted-foreground w-8 text-right">{element.imageOpacity ?? 100}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditingPanel;