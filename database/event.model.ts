import { Schema, model, models, Document } from 'mongoose';

/**
 * TypeScript interface representing an Event document in MongoDB
 */
export interface IEvent extends Document {
  _id: string;
  title: string;
  slug: string;
  description: string;
  overview: string;
  image: string;
  venue: string;
  location: string;
  date: string;
  time: string;
  mode: string;
  audience: string;
  agenda: string[];
  organizer: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true
    },
    overview: {
      type: String,
      required: [true, 'Overview is required'],
      trim: true
    },
    image: {
      type: String,
      required: [true, 'Image is required'],
      trim: true
    },
    venue: {
      type: String,
      required: [true, 'Venue is required'],
      trim: true
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true
    },
    date: {
      type: String,
      required: [true, 'Date is required'],
      trim: true
    },
    time: {
      type: String,
      required: [true, 'Time is required'],
      trim: true
    },
    mode: {
      type: String,
      required: [true, 'Mode is required'],
      enum: {
        values: ['online', 'offline', 'hybrid'],
        message: 'Mode must be online, offline, or hybrid'
      },
      trim: true
    },
    audience: {
      type: String,
      required: [true, 'Audience is required'],
      trim: true
    },
    agenda: {
      type: [String],
      required: [true, 'Agenda is required'],
      validate: {
        validator: (arr: string[]) => arr.length > 0,
        message: 'Agenda must contain at least one item'
      }
    },
    organizer: {
      type: String,
      required: [true, 'Organizer is required'],
      trim: true
    },
    tags: {
      type: [String],
      required: [true, 'Tags are required'],
      validate: {
        validator: (arr: string[]) => arr.length > 0,
        message: 'Tags must contain at least one item'
      }
    }
  },
  {
    timestamps: true // Automatically manages createdAt and updatedAt
  }
);

/**
 * Pre-save hook to generate slug from title and normalize date/time
 * - Only regenerates slug if title has changed
 * - Validates and normalizes date to ISO format
 * - Ensures time is in consistent HH:MM format
 */
EventSchema.pre('save', function (next) {
  // Generate slug only if title is new or modified
  if (this.isNew && this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  // Normalize date to ISO format if modified (YYYY-MM-DD)
  if (this.isModified('date')) {
    const dateObj = new Date(this.date);
    if (isNaN(dateObj.getTime())) {
      return next(
        new Error('Invalid date format. Please provide a valid date.')
      );
    }
    // Store in ISO format (YYYY-MM-DD)
    this.date = dateObj.toISOString().split('T')[0];
  }

  // Normalize time format if modified (HH:MM)
  if (this.isModified('time')) {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
    if (!timeRegex.test(this.time)) {
      return next(
        new Error('Invalid time format. Please use HH:MM format (e.g., 14:30).')
      );
    }
    // Ensure zero-padding for consistency (e.g., 9:30 -> 09:30)
    const [hours, minutes] = this.time.split(':');
    this.time = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  }

  next();
});

// Create unique index on slug for better query performance
EventSchema.index({ slug: 1 }, { unique: true });

// Export the Event model, reusing existing model in development to prevent OverwriteModelError
const Event = models.Event || model<IEvent>('Event', EventSchema);

export default Event;
