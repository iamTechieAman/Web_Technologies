import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { FileNode } from '@/types';

export async function downloadProjectAsZip(files: FileNode[], projectName: string) {
  const zip = new JSZip();

  const addNodeToZip = (node: FileNode, parentPath: string = '') => {
    const currentPath = parentPath ? `${parentPath}/${node.name}` : node.name;

    if (node.type === 'file') {
      zip.file(currentPath, node.content || '');
    } else {
      // For folders, we don't necessarily need to create an empty entry in jszip 
      // but if it's empty, we might want to.
      if (node.children && node.children.length > 0) {
        node.children.forEach(child => addNodeToZip(child, currentPath));
      } else {
        // Create an empty folder
        zip.folder(currentPath);
      }
    }
  };

  files.forEach(node => addNodeToZip(node));

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, `${projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_workspace.zip`);
}
