export interface AdapterCapabilities {
  name: string;
  type: 'ai_model' | 'sdd_engine';
  status: 'available' | 'unavailable' | 'initializing';
  capabilities: string[];
  limitations: string[];
}

export interface IToolAdapter {
  getCapabilities(): AdapterCapabilities;
}

export class AdapterRegistry {
  private adapters: Map<string, IToolAdapter> = new Map();

  register(name: string, adapter: IToolAdapter): void {
    this.adapters.set(name, adapter);
  }

  get(name: string): IToolAdapter | undefined {
    return this.adapters.get(name);
  }

  list(): AdapterCapabilities[] {
    return Array.from(this.adapters.values()).map(a => a.getCapabilities());
  }
}

export const adapterRegistry = new AdapterRegistry();
