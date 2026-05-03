/**
 * CodeVisualizer Extension API
 * Inspired by VS Code's extension architecture.
 */

export interface ExtensionManifest {
  name: string;
  version: string;
  publisher: string;
  engines: {
    codevisualizer: string;
  };
  main: string;
  contributes?: {
    commands?: { command: string; title: string; category?: string }[];
    themes?: { label: string; uiTheme: string; path: string }[];
    languages?: { id: string; extensions: string[]; aliases: string[] }[];
  };
}

export interface IExtensionContext {
  subscriptions: { dispose(): void }[];
}

export class ExtensionManager {
  private static instance: ExtensionManager;
  private commands = new Map<string, (...args: any[]) => any>();

  private constructor() {}

  static getInstance() {
    if (!ExtensionManager.instance) {
      ExtensionManager.instance = new ExtensionManager();
    }
    return ExtensionManager.instance;
  }

  /**
   * Register a command that can be invoked via the Command Palette
   */
  registerCommand(id: string, callback: (...args: any[]) => any) {
    this.commands.set(id, callback);
    return {
      dispose: () => this.commands.delete(id)
    };
  }

  /**
   * Execute a registered command
   */
  executeCommand(id: string, ...args: any[]) {
    const cmd = this.commands.get(id);
    if (!cmd) {
      console.warn(`Command ${id} not found`);
      return;
    }
    return cmd(...args);
  }

  getRegisteredCommands() {
    return Array.from(this.commands.keys());
  }
}

export const extensions = ExtensionManager.getInstance();
