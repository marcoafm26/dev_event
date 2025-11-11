'use server';

import { Booking, IBooking } from '@/database';
import connectDB from '../mongodb';

export const createBooking = async ({
  eventId,
  slug,
  email
}: {
  eventId: string;
  slug: string;
  email: string;
}) => {
  try {
    await connectDB();
    await Booking.create<IBooking>({
      eventId,
      email
    });

    return { success: true, message: 'Booking created' };
  } catch (error) {
    console.log(error);

    return { success: false, message: 'Error creating booking', error };
  }
};
