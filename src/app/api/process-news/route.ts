import { NextRequest, NextResponse } from 'next/server';

// This endpoint processes raw news content and returns a structured article
// In production, this would call OpenAI/Claude API

export async function POST(request: NextRequest) {
  try {
    const { content, sourceChannel } = await request.json();

    if (!content) {
      return NextResponse.json({ error: 'No content provided' }, { status: 400 });
    }

    // For now, do basic processing without AI
    // In production, this would call OpenAI/Claude API
    const lines = content.trim().split('\n').filter((l: string) => l.trim());

    // Extract title from first line or first sentence
    let title = lines[0] || 'News Update';
    if (title.length > 100) {
      title = title.slice(0, 100) + '...';
    }

    // Clean up content
    const cleanedContent = lines.slice(1).join('\n\n') || content;

    // Detect category based on keywords
    const lowerContent = content.toLowerCase();
    let category = 'politics';

    if (lowerContent.includes('economy') || lowerContent.includes('inflation') ||
        lowerContent.includes('rial') || lowerContent.includes('sanctions') ||
        lowerContent.includes('trade') || lowerContent.includes('oil')) {
      category = 'economy';
    } else if (lowerContent.includes('protest') || lowerContent.includes('women') ||
               lowerContent.includes('rights') || lowerContent.includes('arrest') ||
               lowerContent.includes('prison')) {
      category = 'society';
    } else if (lowerContent.includes('diaspora') || lowerContent.includes('abroad') ||
               lowerContent.includes('los angeles') || lowerContent.includes('berlin') ||
               lowerContent.includes('london')) {
      category = 'diaspora';
    }

    // Generate curriculum links based on content
    const curriculumLinks: { section: string; title: string }[] = [];

    if (lowerContent.includes('revolution') || lowerContent.includes('1979')) {
      curriculumLinks.push({ section: '004', title: 'The Islamic Revolution' });
    }
    if (lowerContent.includes('shah') || lowerContent.includes('pahlavi')) {
      curriculumLinks.push({ section: '003', title: 'The Pahlavi Era' });
    }
    if (lowerContent.includes('constitution') || lowerContent.includes('governance')) {
      curriculumLinks.push({ section: '006', title: 'Systems of Governance' });
    }
    if (lowerContent.includes('oil') || lowerContent.includes('sanctions')) {
      curriculumLinks.push({ section: '008', title: 'Economic Systems' });
    }

    const result = {
      title,
      content: cleanedContent,
      category,
      curriculum_links: curriculumLinks,
      source_biases: sourceChannel
        ? `Originally sourced from ${sourceChannel}. Reader discretion advised regarding potential editorial bias.`
        : null,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing news:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
