'use client';

import { createBooking } from '@/lib/actions/booking.actions';
import posthog from 'posthog-js';
import React, { useState } from 'react';

function BookEvent({ eventId, slug }: { eventId: string; slug: string }) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const { success, message, error } = await createBooking({
      eventId,
      slug,
      email
    });

    if (success) {
      setSubmitted(true);
      posthog.capture('booking_created', { eventId, slug, email });
    } else {
      console.log(message, error);
      posthog.captureException(error);
    }

    setTimeout(() => {
      setSubmitted(true);
    }, 1000);
  };

  return (
    <div id="book-event">
      {submitted ? (
        <p className="text-sm">Thank you for signing up!</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
            />
          </div>
          <button className="button-submit" type="submit">
            Submit
          </button>
        </form>
      )}
    </div>
  );
}

export default BookEvent;
