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

// Types
interface SaveGame {
  id: string;
  user_id: string | null;
  session_id: string;
  name: string;
  character_id: string;
  turn: number;
  save_data: string;
  created_at: string;
  updated_at: string;
}

// GET - List saves for a session
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'session_id is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    if (!supabase) {
      // Fallback to localStorage-only mode
      return NextResponse.json({
        saves: [],
        message: 'Cloud saves not configured - using local storage only'
      });
    }

    const { data, error } = await supabase
      .from('game_saves')
      .select('id, name, character_id, turn, created_at, updated_at')
      .eq('session_id', sessionId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching saves:', error);
      return NextResponse.json(
        { error: 'Failed to fetch saves' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      saves: data || []
    });
  } catch (error) {
    console.error('Saves API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new save
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, name, character_id, turn, save_data } = body;

    if (!session_id || !save_data) {
      return NextResponse.json(
        { error: 'session_id and save_data are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    if (!supabase) {
      // Fallback response
      return NextResponse.json({
        id: `local-${Date.now()}`,
        message: 'Cloud saves not configured - save stored locally only'
      });
    }

    const saveRecord = {
      session_id,
      name: name || `Save - Turn ${turn || 0}`,
      character_id: character_id || 'unknown',
      turn: turn || 0,
      save_data,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('game_saves')
      .insert([saveRecord])
      .select('id')
      .single();

    if (error) {
      console.error('Error creating save:', error);
      return NextResponse.json(
        { error: 'Failed to create save' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: data.id,
      message: 'Save created successfully'
    });
  } catch (error) {
    console.error('Save creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update existing save
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, save_data, turn, name } = body;

    if (!id || !save_data) {
      return NextResponse.json(
        { error: 'id and save_data are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({
        message: 'Cloud saves not configured - save updated locally only'
      });
    }

    const updateData: Record<string, any> = {
      save_data,
      updated_at: new Date().toISOString()
    };

    if (turn !== undefined) updateData.turn = turn;
    if (name) updateData.name = name;

    const { error } = await supabase
      .from('game_saves')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating save:', error);
      return NextResponse.json(
        { error: 'Failed to update save' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Save updated successfully'
    });
  } catch (error) {
    console.error('Save update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove save
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({
        message: 'Cloud saves not configured - delete handled locally only'
      });
    }

    const { error } = await supabase
      .from('game_saves')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting save:', error);
      return NextResponse.json(
        { error: 'Failed to delete save' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Save deleted successfully'
    });
  } catch (error) {
    console.error('Save deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
