import { NextRequest, NextResponse } from 'next/server';
import AdmZip from 'adm-zip';

export async function POST(req: NextRequest) {
  try {
    const { repoUrl } = await req.json();

    if (!repoUrl) {
      return NextResponse.json({ error: 'Repository URL is required' }, { status: 400 });
    }

    // Convert github.com/user/repo to api.github.com/repos/user/repo/zipball
    const githubRegex = /github\.com\/([^\/]+)\/([^\/]+)/;
    const match = repoUrl.match(githubRegex);

    if (!match) {
      return NextResponse.json({ error: 'Only public GitHub repositories are supported for now.' }, { status: 400 });
    }

    const [_, owner, repo] = match;
    // Clean repo name from .git suffix if present
    const cleanRepo = repo.replace('.git', '');
    
    const zipUrl = `https://api.github.com/repos/${owner}/${cleanRepo}/zipball`;

    const response = await fetch(zipUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch repository: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const zip = new AdmZip(Buffer.from(buffer));
    const zipEntries = zip.getEntries();

    const fileTree: any[] = [];
    zipEntries.forEach((entry) => {
      if (entry.isDirectory) return;

      // GitHub zipball entries start with a random directory name (owner-repo-hash/)
      const parts = entry.entryName.split('/');
      parts.shift(); // Remove the top-level directory
      
      if (parts.length === 0) return;

      const content = entry.getData().toString('utf8');
      
      // Build tree structure
      let currentLevel = fileTree;
      parts.forEach((part, i) => {
        const isFile = i === parts.length - 1;
        let node = currentLevel.find((n) => n.name === part);

        if (!node) {
          node = {
            id: Math.random().toString(36).substring(7),
            name: part,
            type: isFile ? 'file' : 'folder',
            path: parts.slice(0, i + 1).join('/'),
            children: isFile ? undefined : [],
            content: isFile ? content : undefined,
          };
          currentLevel.push(node);
        }
        currentLevel = node.children || [];
      });
    });

    return NextResponse.json({ fileTree });
  } catch (err: any) {
    console.error('[Git Clone Error]:', err);
    return NextResponse.json({ error: err.message || 'Failed to clone repository' }, { status: 500 });
  }
}
