'use client';
import { useState, useEffect, useCallback } from 'react';
import localforage from 'localforage';
import { FileNode, SupportedLanguage } from '@/types';
import { safeArray, safeString } from '@/lib/safe';

const STORAGE_KEY = 'codevisualizer_filesystem';

const generateUUID = (): string => {
  if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export function useFileSystem(): {
  files: FileNode[];
  isLoaded: boolean;
  createFile: (parentId: string, name: string, language?: SupportedLanguage) => { id: string };
  createFolder: (parentId: string, name: string) => { id: string };
  deleteNode: (id: string) => void;
  renameNode: (id: string, newName: string) => void;
  updateNodeContent: (id: string, content: string, language?: SupportedLanguage) => void;
  findNode: (id: string) => FileNode | null;
  importProject: (newFiles: FileNode[]) => Promise<void>;
  resetWorkspace: () => void;
} {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const saved = await localforage.getItem<FileNode[]>(STORAGE_KEY);
        if (Array.isArray(saved)) {
          setFiles(saved);
        } else {
          setFiles([]);
        }
      } catch (error) {
        setFiles([]);
      }
      setIsLoaded(true);
    };
    load();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      const persistTimer = window.setTimeout(() => {
        localforage.setItem(STORAGE_KEY, files).catch(() => {});
      }, 500);
      return () => window.clearTimeout(persistTimer);
    }
  }, [files, isLoaded]);

  const findNode = useCallback((nodes: FileNode[] | undefined, id: string): FileNode | null => {
    const safeNodes = safeArray<FileNode>(nodes);
    for (const node of safeNodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNode(node.children, id);
        if (found) return found;
      }
    }
    return null;
  }, []);

  const validateName = useCallback((name: string, parentId: string, currentFiles: FileNode[], currentId?: string): string => {
    const trimmed = safeString(name).trim();
    if (!trimmed) throw new Error('Name cannot be empty');
    if (/[\\/:*?"<>|]/.test(trimmed)) throw new Error('Invalid characters');

    const parent = parentId === 'root'
      ? { children: currentFiles }
      : findNode(currentFiles, parentId);

    const siblings = safeArray<FileNode>(parent?.children);
    if (siblings.length > 0) {
      const exists = siblings.some(
        n => n.name.toLowerCase() === trimmed.toLowerCase() && n.id !== currentId
      );
      if (exists) throw new Error(`"${trimmed}" already exists`);
    }

    return trimmed;
  }, [findNode]);

  const updateNodeContent = useCallback((id: string, content: string, language?: SupportedLanguage) => {
    setFiles(prev => {
      const update = (nodes: FileNode[]): FileNode[] =>
        nodes.map(node =>
          node.id === id
            ? { ...node, content: content || '', ...(language ? { language } : {}) }
            : node.children
              ? { ...node, children: update(node.children) }
              : node
        );
      return update(prev);
    });
  }, []);

  const createFile = useCallback((parentId: string, name: string, language?: SupportedLanguage) => {
    let newId = generateUUID();
    setFiles(prev => {
      try {
        const validName = validateName(name, parentId, prev);
        const newNode: FileNode = {
          id: newId,
          name: validName,
          type: 'file',
          language: language || 'javascript',
          content: '',
          parentId: parentId === 'root' ? undefined : parentId
        };

        if (parentId === 'root') return [...prev, newNode];

        const update = (nodes: FileNode[]): FileNode[] =>
          nodes.map(node =>
            node.id === parentId
              ? { ...node, children: [...(node.children || []), newNode] }
              : node.children
                ? { ...node, children: update(node.children) }
                : node
          );
        return update(prev);
      } catch (e: unknown) {
        setTimeout(() => alert(e instanceof Error ? e.message : 'Error creating file'), 0);
        return prev;
      }
    });
    return { id: newId }; // Return a partial stub so the caller has the ID to open the tab immediately
  }, [validateName]);

  const createFolder = useCallback((parentId: string, name: string) => {
    let newId = generateUUID();
    setFiles(prev => {
      try {
        const validName = validateName(name, parentId, prev);
        const newNode: FileNode = {
          id: newId,
          name: validName,
          type: 'folder',
          children: [],
          parentId: parentId === 'root' ? undefined : parentId
        };

        if (parentId === 'root') return [...prev, newNode];

        const update = (nodes: FileNode[]): FileNode[] =>
          nodes.map(node =>
            node.id === parentId
              ? { ...node, children: [...(node.children || []), newNode] }
              : node.children
                ? { ...node, children: update(node.children) }
                : node
          );
        return update(prev);
      } catch (e: unknown) {
        setTimeout(() => alert(e instanceof Error ? e.message : 'Error creating folder'), 0);
        return prev;
      }
    });
    return { id: newId };
  }, [validateName]);

  const deleteNode = useCallback((id: string) => {
    setFiles(prev => {
      const remove = (nodes: FileNode[]): FileNode[] =>
        nodes
          .filter(node => node.id !== id)
          .map(node =>
            node.children ? { ...node, children: remove(node.children) } : node
          );
      return remove(prev);
    });
  }, []);

  const renameNode = useCallback((id: string, newName: string) => {
    setFiles(prev => {
      try {
        const node = findNode(prev, id);
        if (!node) return prev;

        const parentId = node.parentId || 'root';
        const validName = validateName(newName, parentId, prev, id);

        const update = (nodes: FileNode[]): FileNode[] =>
          nodes.map(n =>
            n.id === id
              ? { ...n, name: validName }
              : n.children
                ? { ...n, children: update(n.children) }
                : n
          );
        return update(prev);
      } catch (e: unknown) {
        setTimeout(() => alert(e instanceof Error ? e.message : 'Error renaming file'), 0);
        return prev;
      }
    });
  }, [findNode, validateName]);

  const importProject = useCallback(async (newFiles: FileNode[]): Promise<void> => {
    if (Array.isArray(newFiles)) {
      setFiles(newFiles);
    }
  }, []);

  const resetWorkspace = useCallback((): void => {
    setFiles([]);
  }, []);

  const exposedFindNode = useCallback((id: string): FileNode | null => findNode(files, id), [files, findNode]);

  return {
    files,
    isLoaded,
    createFile,
    createFolder,
    deleteNode,
    renameNode,
    updateNodeContent,
    findNode: exposedFindNode,
    importProject,
    resetWorkspace
  };
}
