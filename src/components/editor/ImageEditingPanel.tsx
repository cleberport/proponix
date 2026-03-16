import { CanvasElement } from '@/types/template';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Upload, Lock, Unlock, RotateCw, Crop, Maximize, RefreshCw } from 'lucide-react';
import { useRef, useState } from 'react';
import { Separator } from '@/components/ui/separator';

interface Props {
  element: CanvasElement;
  onUpdate: (updates: Partial<CanvasElement>) => void;
}

const ImageEditingPanel = ({ element, onUpdate }: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCropControls, setShowCropControls] = useState(false);

  const CANVAS_W = 595;
  const CANVAS_H = 842;

  const handleImageReplace = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        let newWidth = Math.min(element.width, CANVAS_W - 20);
        let newHeight = Math.round(newWidth / aspectRatio);
        if (newHeight > CANVAS_H - 20) {
          newHeight = CANVAS_H - 20;
          newWidth = Math.round(newHeight * aspectRatio);
        }
        onUpdate({ imageUrl: url, width: newWidth, height: newHeight });
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
  };

  const resetEffects = () => {
    onUpdate({
      imageBrightness: 100,
      imageContrast: 100,
      imageSaturation: 100,
      imageOpacity: 100,
    });
  };

  const resetCrop = () => {
    onUpdate({
      cropX: 0,
      cropY: 0,
      cropWidth: 100,
      cropHeight: 100,
    });
    setShowCropControls(false);
  };

  return (
    <div className="flex flex-col gap-3">
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

      {/* Frame Fit */}
      <div>
        <Label className="text-xs text-muted-foreground">Ajuste no Quadro</Label>
        <Select
          value={element.objectFit || 'contain'}
          onValueChange={(v) => onUpdate({ objectFit: v as CanvasElement['objectFit'] })}
        >
          <SelectTrigger className="h-7 text-xs mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="contain">Caber (Fit)</SelectItem>
            <SelectItem value="cover">Preencher (Fill)</SelectItem>
            <SelectItem value="fill">Esticar (Stretch)</SelectItem>
            <SelectItem value="none">Tamanho Original</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Object Position */}
      <div>
        <Label className="text-xs text-muted-foreground">Posição da Imagem</Label>
        <div className="grid grid-cols-3 gap-1 mt-1">
          {[
            { label: '↖', value: 'top left' },
            { label: '↑', value: 'top center' },
            { label: '↗', value: 'top right' },
            { label: '←', value: 'center left' },
            { label: '⊙', value: 'center' },
            { label: '→', value: 'center right' },
            { label: '↙', value: 'bottom left' },
            { label: '↓', value: 'bottom center' },
            { label: '↘', value: 'bottom right' },
          ].map((pos) => (
            <button
              key={pos.value}
              onClick={() => onUpdate({ objectPosition: pos.value, objectPositionX: undefined, objectPositionY: undefined })}
              className={`h-7 rounded border text-xs transition-colors ${
                (element.objectPosition || 'center') === pos.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:bg-accent'
              }`}
            >
              {pos.label}
            </button>
          ))}
        </div>
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

      {/* Crop */}
      <div>
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Recorte (Crop)</Label>
          <div className="flex gap-1">
            <Button
              variant={showCropControls ? 'secondary' : 'ghost'}
              size="sm"
              className="h-6 px-2 text-[10px]"
              onClick={() => setShowCropControls(!showCropControls)}
            >
              <Crop className="h-3 w-3 mr-1" />
              {showCropControls ? 'Fechar' : 'Editar'}
            </Button>
            {showCropControls && (
              <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={resetCrop}>
                <RefreshCw className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        {showCropControls && (
          <div className="mt-2 flex flex-col gap-2 rounded-md border border-border bg-accent/30 p-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] text-muted-foreground">X (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={90}
                  value={element.cropX || 0}
                  onChange={(e) => onUpdate({ cropX: Math.max(0, Math.min(90, +e.target.value)) })}
                  className="h-6 text-[10px]"
                />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Y (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={90}
                  value={element.cropY || 0}
                  onChange={(e) => onUpdate({ cropY: Math.max(0, Math.min(90, +e.target.value)) })}
                  className="h-6 text-[10px]"
                />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Largura (%)</Label>
                <Input
                  type="number"
                  min={10}
                  max={100}
                  value={element.cropWidth || 100}
                  onChange={(e) => onUpdate({ cropWidth: Math.max(10, Math.min(100, +e.target.value)) })}
                  className="h-6 text-[10px]"
                />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Altura (%)</Label>
                <Input
                  type="number"
                  min={10}
                  max={100}
                  value={element.cropHeight || 100}
                  onChange={(e) => onUpdate({ cropHeight: Math.max(10, Math.min(100, +e.target.value)) })}
                  className="h-6 text-[10px]"
                />
              </div>
            </div>
          </div>
        )}
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
