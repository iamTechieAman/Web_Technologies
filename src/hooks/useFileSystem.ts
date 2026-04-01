'use client';
import { useState, useEffect, useCallback } from 'react';
import localforage from 'localforage';
import { FileNode, SupportedLanguage } from '@/types';

const STORAGE_KEY = 'codevisualizer_filesystem';

// Zero-dependency UUID generator
const generateUUID = () => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export function useFileSystem() {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localforage
  useEffect(() => {
    const load = async () => {
      const saved = await localforage.getItem<FileNode[]>(STORAGE_KEY);
      if (saved && saved.length > 0) {
        setFiles(saved);
      } else {
        // Initial state: Start with an empty workspace
        setFiles([]);
      }
      setIsLoaded(true);
    };
    load();
  }, []);

  // Save to localforage
  useEffect(() => {
    if (isLoaded) {
      localforage.setItem(STORAGE_KEY, files);
    }
  }, [files, isLoaded]);

  const findNode = (nodes: FileNode[], id: string): FileNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNode(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const updateNodeContent = useCallback((id: string, content: string) => {
    setFiles(prev => {
      const update = (nodes: FileNode[]): FileNode[] => {
        return nodes.map(node => {
          if (node.id === id) return { ...node, content };
          if (node.children) return { ...node, children: update(node.children) };
          return node;
        });
      };
      return update(prev);
    });
  }, []);

  const createFile = useCallback((parentId: string, name: string, language?: SupportedLanguage) => {
    const newNode: FileNode = {
      id: generateUUID(),
      name,
      type: 'file',
      language: language || 'javascript',
      content: '',
      parentId: parentId === 'root' ? undefined : parentId
    };

    setFiles(prev => {
      if (parentId === 'root') return [...prev, newNode];
      const update = (nodes: FileNode[]): FileNode[] => {
        return nodes.map(node => {
          if (node.id === parentId) {
            return { ...node, children: [...(node.children || []), newNode] };
          }
          if (node.children) return { ...node, children: update(node.children) };
          return node;
        });
      };
      return update(prev);
    });

    return newNode;
  }, []);

  const createFolder = useCallback((parentId: string, name: string) => {
    const newNode: FileNode = {
      id: generateUUID(),
      name,
      type: 'folder',
      children: [],
      parentId: parentId === 'root' ? undefined : parentId
    };

    setFiles(prev => {
      if (parentId === 'root') return [...prev, newNode];
      const update = (nodes: FileNode[]): FileNode[] => {
        return nodes.map(node => {
          if (node.id === parentId) {
            return { ...node, children: [...(node.children || []), newNode] };
          }
          if (node.children) return { ...node, children: update(node.children) };
          return node;
        });
      };
      return update(prev);
    });

    return newNode;
  }, []);

  const deleteNode = useCallback((id: string) => {
    setFiles(prev => {
      const remove = (nodes: FileNode[]): FileNode[] => {
        return nodes
          .filter(node => node.id !== id)
          .map(node => (node.children ? { ...node, children: remove(node.children) } : node));
      };
      return remove(prev);
    });
  }, []);

  const renameNode = useCallback((id: string, newName: string) => {
    setFiles(prev => {
      const update = (nodes: FileNode[]): FileNode[] => {
        return nodes.map(node => {
          if (node.id === id) return { ...node, name: newName };
          if (node.children) return { ...node, children: update(node.children) };
          return node;
        });
      };
      return update(prev);
    });
  }, []);

  const importProject = useCallback(async (newFiles: FileNode[]) => {
    setFiles(newFiles);
    await localforage.setItem('codevisualizer_files', newFiles);
    return newFiles;
  }, []);

  const resetWorkspace = useCallback(async () => {
    const defaultFiles: FileNode[] = [
      { id: '1', name: 'main.py', type: 'file', language: 'python', content: '# Welcome to CodeVisualizer\nprint("Hello World")' }
    ];
    setFiles(defaultFiles);
    await localforage.setItem('codevisualizer_files', defaultFiles);
  }, []);

  return {
    files,
    isLoaded,
    createFile,
    createFolder,
    deleteNode,
    renameNode,
    updateNodeContent,
    findNode: (id: string) => findNode(files, id),
    importProject,
    resetWorkspace
  };
}
