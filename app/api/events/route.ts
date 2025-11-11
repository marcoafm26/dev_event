import { Event } from '@/database';
import connectDB from '@/lib/mongodb';
import { v2 as cloudinary } from 'cloudinary';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const formData = await req.formData();

    // Convert FormData to a plain object (this does not throw)
    const rawData = Object.fromEntries(formData.entries());

    // Extract file separately and validate it; exclude from payload validation
    const file = formData.get('image') as File | null;

    // Zod schema for incoming event payload (excluding image)
    const eventSchema = z.object({
      title: z.string().min(1, 'Title is required'),
      description: z.string().min(1, 'Description is required'),
      overview: z.string().min(1, 'Overview is required'),
      venue: z.string().min(1, 'Venue is required'),
      location: z.string().min(1, 'Location is required'),
      date: z.string().min(1, 'Date is required'),
      time: z.string().min(1, 'Time is required'),
      // Enum does not support invalid_type_error; use message or omit
      mode: z.enum(['online', 'offline', 'hybrid'], {
        message: 'Mode must be online, offline, or hybrid'
      }),
      audience: z.string().min(1, 'Audience is required'),
      organizer: z.string().min(1, 'Organizer is required'),
      // Accept either a JSON string or array of strings coming from the client
      agenda: z.union([z.string(), z.array(z.string())]),
      tags: z.union([z.string(), z.array(z.string())])
    });

    const { image, ...eventCandidate } = rawData as Record<string, unknown>;

    const parsed = eventSchema.safeParse(eventCandidate);
    if (!parsed.success) {
      return NextResponse.json(
        {
          message: 'Validation failed',
          errors: parsed.error.issues
        },
        { status: 400 }
      );
    }

    // Normalizers to ensure arrays for agenda/tags before persistence
    const normalizeToStringArray = (value: string | string[]) => {
      if (Array.isArray(value))
        return value.filter((v) => v && v.trim().length > 0);
      try {
        const maybeArr = JSON.parse(value);
        if (Array.isArray(maybeArr)) {
          return maybeArr
            .map((v) => String(v))
            .filter((v) => v && v.trim().length > 0);
        }
      } catch {}
      return value
        .split(',')
        .map((v) => v.trim())
        .filter((v) => v.length > 0);
    };

    const validatedPayload = parsed.data;

    // Apply normalization to match Event model expectations
    const normalizedEvent = {
      ...validatedPayload,
      agenda: normalizeToStringArray(
        validatedPayload.agenda as unknown as string | string[]
      ),
      tags: normalizeToStringArray(
        validatedPayload.tags as unknown as string | string[]
      )
    };

    if (!file) {
      return NextResponse.json(
        { message: 'Image file is required' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { message: 'Invalid file type. Only images are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (e.g., max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { message: 'File size exceeds 5MB limit' },
        { status: 400 }
      );
    }

    let tags = JSON.parse(formData.get('tags') as string);
    let agenda = JSON.parse(formData.get('agenda') as string);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: 'image', folder: 'Dev Event' },
        (error, result) => {
          if (error) {
            return reject(error);
          }

          resolve(result);
        }
      );

      uploadStream.end(buffer);
    });

    // Validate uploadResult structure
    if (
      !uploadResult ||
      typeof uploadResult !== 'object' ||
      !('secure_url' in uploadResult)
    ) {
      throw new Error('Invalid upload result from Cloudinary');
    }

    // Build the final event object using validated and normalized data
    const eventToCreate = {
      ...normalizedEvent,
      image: uploadResult.secure_url,
      agenda,
      tags
    };
    const createdEvent = await Event.create(eventToCreate);

    return NextResponse.json(
      {
        message: 'Event created successfully',
        event: createdEvent
      },
      { status: 201 }
    );
  } catch (e) {
    console.error(e);

    return NextResponse.json(
      {
        message: 'Event creation failed',
        error: e instanceof Error ? e.message : 'Unknown'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();

    const events = await Event.find().sort({ createdAt: -1 });

    return NextResponse.json(
      {
        message: 'Events retrieved successfully',
        events
      },
      { status: 200 }
    );
  } catch (e) {
    console.error(e);

    return NextResponse.json(
      {
        message: 'Event retrieval failed',
        error: e instanceof Error ? e.message : 'Unknown'
      },
      { status: 500 }
    );
  }
}
