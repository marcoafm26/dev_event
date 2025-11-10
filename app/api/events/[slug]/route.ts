import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Event, type IEvent } from '@/database';

// Route params type for strict typing
type RouteParams = { params: Promise<{ slug?: string }> };

// Slug format: lowercase letters, numbers, hyphen-separated
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * GET /api/events/[slug]
 * Fetch a single event by its slug.
 * - Validates route param
 * - Connects to MongoDB (cached)
 * - Returns event JSON or appropriate error
 */
export async function GET(_req: NextRequest, { params }: RouteParams) {
  // 1) Validate slug param presence and format
  const { slug } = await params;
  if (!slug || typeof slug !== 'string' || slug.trim().length === 0 || slug.length > 100) {
    return NextResponse.json(
      { message: 'Invalid or missing slug parameter. Slug must be 1-100 characters.' },
      { status: 400 }
    );
  }

  const sanitizedSlug = slug.trim().toLowerCase();
  if (!SLUG_REGEX.test(sanitizedSlug)) {
    return NextResponse.json(
      {
        message:
          "Invalid slug format. Use lowercase letters, numbers, and hyphens (e.g., 'react-conf-2024')."
      },
      { status: 400 }
    );
  }

  try {
    // 2) Ensure DB connection (cached across hot reloads)
    await connectDB();

    // 3) Query the Event by slug; use lean for plain JSON and omit __v
    const event = await Event.findOne({
      slug: sanitizedSlug
    }).lean<IEvent>();

    // 4) Not found handling
    if (!event) {
      return NextResponse.json(
        { message: `Event not found for slug \"${sanitizedSlug}\"` },
        { status: 404 }
      );
    }

    // 5) Success
    return NextResponse.json(
      { message: 'Event retrieved successfully', event },
      { status: 200 }
    );
  } catch (error) {
    // 6) Unexpected errors
    console.error('GET /api/events/[slug] error:', error);
    return NextResponse.json(
      {
        message: 'Unexpected error while retrieving event'
      },
      { status: 500 }
    );
  }
}
