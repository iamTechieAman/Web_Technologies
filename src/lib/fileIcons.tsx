import React from 'react';
import { 
  FileCode, FileJson, FileType, FileText, File as FileIcon, 
  Terminal, Layers, Code2, Globe, Hash, Coffee, Binary,
  Archive
} from 'lucide-react';

export function getFileIcon(fileName: string, _language?: string) {
  const ext = fileName.split('.').pop()?.toLowerCase();
  
  if (ext === 'py') return <FileCode size={16} className="text-blue-400" />;
  if (ext === 'js' || ext === 'jsx') return <FileCode size={16} className="text-yellow-400" />;
  if (ext === 'ts' || ext === 'tsx') return <FileCode size={16} className="text-blue-500" />;
  if (ext === 'java') return <Coffee size={16} className="text-red-400" />;
  if (ext === 'cpp' || ext === 'cc') return <Layers size={16} className="text-blue-600" />;
  if (ext === 'c') return <Layers size={16} className="text-gray-400" />;
  if (ext === 'rs') return <Binary size={16} className="text-orange-500" />;
  if (ext === 'go') return <Globe size={16} className="text-cyan-400" />;
  if (ext === 'cs') return <Hash size={16} className="text-purple-500" />;
  if (ext === 'rb') return <FileCode size={16} className="text-red-600" />;
  if (ext === 'php') return <Globe size={16} className="text-indigo-400" />;
  if (ext === 'swift') return <FileCode size={16} className="text-orange-600" />;
  if (ext === 'kt') return <FileCode size={16} className="text-purple-400" />;
  if (ext === 'dart') return <FileCode size={16} className="text-blue-300" />;
  if (ext === 'lua') return <FileCode size={16} className="text-blue-400" />;
  if (ext === 'sh' || ext === 'bash') return <Terminal size={16} className="text-green-400" />;
  if (ext === 'json') return <FileJson size={16} className="text-yellow-600" />;
  if (ext === 'md') return <FileText size={16} className="text-blue-400" />;
  if (ext === 'html') return <Code2 size={16} className="text-orange-500" />;
  if (ext === 'css') return <FileType size={16} className="text-blue-400" />;
  if (ext === 'sql') return <Layers size={16} className="text-gray-400" />;
  if (ext === 'zip' || ext === 'tar' || ext === 'gz') return <Archive size={16} className="text-yellow-700" />;
  
  return <FileIcon size={16} className="text-gray-400" />;
}
