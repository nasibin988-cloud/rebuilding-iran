import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const getSupabase = () => {
  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }
  return createClient(supabaseUrl, supabaseServiceKey);
};

// GET - Load a specific save
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Save ID is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Cloud saves not configured' },
        { status: 503 }
      );
    }

    const { data, error } = await supabase
      .from('game_saves')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error loading save:', error);
      return NextResponse.json(
        { error: 'Save not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      save: data
    });
  } catch (error) {
    console.error('Save load error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
