// src/components/VirtualTourEditor.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, PlusCircle } from 'lucide-react';
import { VirtualTour } from './VirtualTour';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Json } from '@/types/supabase';

// --- TYPES ---
interface HotSpot {
  pitch: number;
  yaw: number;
  type: 'scene' | 'info';
  text?: string;
  sceneId?: string;
}

interface Scene {
  title: string;
  hfov: number;
  pitch: number;
  yaw: number;
  type: 'equirectangular';
  panorama: string;
  hotSpots?: HotSpot[];
}

interface PannellumConfig {
  default: {
    firstScene: string;
    author: string;
    sceneFadeDuration: number;
    autoLoad?: boolean;
  };
  scenes: Record<string, Scene>;
}

// --- PROPS ---
interface VirtualTourEditorProps {
  initialConfig: Json | null;
  onChange: (config: PannellumConfig) => void;
  baseImagePath: string;
}

// --- TYPE GUARD ---
function isPannellumConfig(data: any): data is PannellumConfig {
  return (
    data &&
    typeof data === 'object' &&
    !Array.isArray(data) &&
    'default' in data &&
    'scenes' in data &&
    typeof data.default === 'object' &&
    typeof data.scenes === 'object'
  );
}

// --- COMPOSANT ---
export function VirtualTourEditor({ initialConfig, onChange, baseImagePath }: VirtualTourEditorProps) {
  
  // --- STATE INITIALIZATION ---
  const getDefaultConfig = (): PannellumConfig => ({ // 1. Typage explicite du retour
    default: {
      firstScene: 'scene-1',
      author: 'OPTIMA GESTION',
      sceneFadeDuration: 1000,
      autoLoad: true,
    },
    scenes: {
      'scene-1': {
        title: 'Scène initiale',
        hfov: 110,
        pitch: 0,
        yaw: 0,
        type: 'equirectangular',
        panorama: `${baseImagePath}/panorama-1.jpg`,
        hotSpots: [],
      },
    },
  });

  // 2. Utilisation de la fonction d'initialisation paresseuse de useState
  const [config, setConfig] = useState<PannellumConfig>(() => {
    if (isPannellumConfig(initialConfig)) {
      return initialConfig; // C'est maintenant sûr
    }
    return getDefaultConfig();
  });

  const [activeSceneId, setActiveSceneId] = useState<string>(() => Object.keys(config.scenes)[0] || '');

  // --- EFFECTS ---
  useEffect(() => {
    onChange(config);
  }, [config, onChange]);

  useEffect(() => {
    if (!config.scenes[activeSceneId]) {
      setActiveSceneId(Object.keys(config.scenes)[0] || '');
    }
  }, [config.scenes, activeSceneId]);

  // --- HANDLERS (inchangés) ---
  const handleConfigChange = (field: string, value: string | number) => {
    const newConfig = { ...config, default: { ...config.default, [field]: value } };
    setConfig(newConfig);
  };
  
  const handleSceneChange = (sceneId: string, field: keyof Scene, value: string | number) => {
  const newScenes = { ...config.scenes };
  const scene = { ...(newScenes[sceneId] as Scene) };
  Object.assign(scene, { [field]: value } as Partial<Scene>);
  newScenes[sceneId] = scene;
  setConfig({ ...config, scenes: newScenes });
  };
  
  const addScene = () => {
    const newSceneId = `scene-${Date.now()}`;
    const newScene: Scene = {
        title: 'Nouvelle Scène',
        hfov: 110, pitch: 0, yaw: 0,
        type: 'equirectangular',
        panorama: `${baseImagePath}/default-panorama.jpg`,
        hotSpots: []
    };
    const newConfig = { ...config, scenes: { ...config.scenes, [newSceneId]: newScene } };
    setConfig(newConfig);
    setActiveSceneId(newSceneId);
  };
  
  const removeScene = (sceneId: string) => {
    const newScenes = { ...config.scenes };
    delete newScenes[sceneId];
    let newDefaultScene = config.default.firstScene;
    if (newDefaultScene === sceneId || Object.keys(newScenes).length === 0) {
        newDefaultScene = Object.keys(newScenes)[0] || '';
    }
    setConfig({ ...config, scenes: newScenes, default: { ...config.default, firstScene: newDefaultScene }});
  };

  const handleHotSpotChange = (sceneId: string, index: number, field: keyof HotSpot, value: any) => {
  const newScenes = { ...config.scenes };
  const hotSpots = [...(newScenes[sceneId].hotSpots || [])];
  const hotSpot = { ...(hotSpots[index] as HotSpot) };
  Object.assign(hotSpot, { [field]: value } as Partial<HotSpot>);
  hotSpots[index] = hotSpot;
  newScenes[sceneId].hotSpots = hotSpots;
  setConfig({ ...config, scenes: newScenes });
  };
  
  const addHotSpot = (sceneId: string) => {
    const newHotSpot: HotSpot = { pitch: 0, yaw: 0, type: 'info', text: 'Information' };
    const newScenes = { ...config.scenes };
    newScenes[sceneId].hotSpots = [...(newScenes[sceneId].hotSpots || []), newHotSpot];
    setConfig({ ...config, scenes: newScenes });
  };
  
  const removeHotSpot = (sceneId: string, index: number) => {
    const newScenes = { ...config.scenes };
    const hotSpots = [...(newScenes[sceneId].hotSpots || [])];
    hotSpots.splice(index, 1);
    newScenes[sceneId].hotSpots = hotSpots;
    setConfig({ ...config, scenes: newScenes });
  };

  const activeScene = config.scenes[activeSceneId];

  // --- RENDER ---
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-4">
      <Card className="md:col-span-1 h-fit">
        <CardHeader><CardTitle>Éditeur de Visite Virtuelle</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Scène Active</Label>
            <div className="flex gap-2">
                <Select value={activeSceneId} onValueChange={setActiveSceneId} disabled={Object.keys(config.scenes).length === 0}>
                    <SelectTrigger><SelectValue placeholder="Aucune scène"/></SelectTrigger>
                    <SelectContent>
                        {Object.keys(config.scenes).map(id => <SelectItem key={id} value={id}>{config.scenes[id].title} ({id})</SelectItem>)}
                    </SelectContent>
                </Select>
                <Button onClick={addScene} size="icon" variant="outline"><PlusCircle className="h-4 w-4"/></Button>
                <Button onClick={() => removeScene(activeSceneId)} size="icon" variant="destructive" disabled={Object.keys(config.scenes).length === 0}><Trash2 className="h-4 w-4"/></Button>
            </div>
          </div>

          {activeScene && (
            <div className="space-y-4 p-4 border rounded-lg">
                <div className="space-y-2">
                    <Label htmlFor={`title-${activeSceneId}`}>Titre de la Scène</Label>
                    <Input id={`title-${activeSceneId}`} value={activeScene.title} onChange={e => handleSceneChange(activeSceneId, 'title', e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor={`panorama-${activeSceneId}`}>Image Panoramique</Label>
                    <Input id={`panorama-${activeSceneId}`} value={activeScene.panorama} onChange={e => handleSceneChange(activeSceneId, 'panorama', e.target.value)} />
                </div>

                <h4 className="font-semibold mt-4">HotSpots</h4>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {(activeScene.hotSpots || []).map((spot, index) => (
                    <div key={index} className="p-3 border rounded-md space-y-2">
                         <div className="flex justify-between items-center">
                            <p className="text-sm font-medium">Hotspot {index + 1}</p>
                            <Button onClick={() => removeHotSpot(activeSceneId, index)} size="icon" variant="ghost" className="h-6 w-6"><Trash2 className="h-4 w-4 text-destructive"/></Button>
                        </div>
                        <Select value={spot.type} onValueChange={(v) => handleHotSpotChange(activeSceneId, index, 'type', v)}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent><SelectItem value="info">Info</SelectItem><SelectItem value="scene">Lien vers Scène</SelectItem></SelectContent>
                        </Select>
                        {spot.type === 'scene' ? (
                            <Select value={spot.sceneId} onValueChange={(v) => handleHotSpotChange(activeSceneId, index, 'sceneId', v)}>
                                <SelectTrigger><SelectValue placeholder="Choisir une scène..."/></SelectTrigger>
                                <SelectContent>
                                    {Object.keys(config.scenes).filter(id => id !== activeSceneId).map(id => <SelectItem key={id} value={id}>{config.scenes[id].title}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        ) : (
                            <Input value={spot.text} placeholder="Texte d'information" onChange={e => handleHotSpotChange(activeSceneId, index, 'text', e.target.value)} />
                        )}
                        <div className="grid grid-cols-2 gap-2">
                            <Input type="number" value={spot.pitch} placeholder="Pitch" onChange={e => handleHotSpotChange(activeSceneId, index, 'pitch', parseFloat(e.target.value))} />
                            <Input type="number" value={spot.yaw} placeholder="Yaw" onChange={e => handleHotSpotChange(activeSceneId, index, 'yaw', parseFloat(e.target.value))} />
                        </div>
                    </div>
                ))}
                </div>
                <Button onClick={() => addHotSpot(activeSceneId)} variant="outline" size="sm" className="mt-2"><PlusCircle className="mr-2 h-4 w-4"/> Ajouter un Hotspot</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="md:col-span-2">
        <Card>
            <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle>Prévisualisation</CardTitle>
                <p className="text-sm text-muted-foreground">Cliquez pour obtenir les coordonnées (pitch/yaw)</p>
            </CardHeader>
            <CardContent>
                <div className="relative w-full h-[500px] rounded-lg bg-muted">
          {Object.keys(config.scenes).length > 0 && config.default.firstScene ? (
            <VirtualTour scenes={config as unknown as PannellumConfig} />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p>Aucune scène à afficher. Ajoutez-en une pour commencer.</p>
            </div>
          )}
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

