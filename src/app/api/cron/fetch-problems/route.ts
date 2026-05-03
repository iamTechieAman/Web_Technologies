import { NextRequest, NextResponse } from 'next/server';
import { fetchAllLeetCodeProblems } from '../../../../../scripts/fetch-leetcode';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    console.log('Cron Job: Refreshing problem database...');
    
    // Fetch a fresh batch of 50 problems from LeetCode
    const { questions } = await fetchAllLeetCodeProblems(50, 0);
    
    // In a real production app, we would update a DB here.
    // For this project, we'll assume the local JSON is updated during build.
    
    return NextResponse.json({ 
      success: true, 
      message: `Fresh batch of ${questions.length} problems fetched.`,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
