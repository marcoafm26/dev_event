'use server';

import { Event, IEvent } from '@/database';
import connectDB from '@/lib/mongodb';

export const getSimilarEventsBySlug = async (slug: string) => {
  try {
    await connectDB();

    const event = await Event.findOne({ slug });

    if (!event) {
      return [];
    }

    const similarEvents = await Event.find({
      _id: { $ne: event._id },
      tags: { $in: event.tags }
    }).lean<IEvent[]>();

    return similarEvents;
  } catch (error) {
    return [];
  }
};
