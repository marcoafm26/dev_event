import BookEvent from '@/components/BookEvent';
import EventCard from '@/components/EventCard';
import { Event, type IEvent } from '@/database';
import { getSimilarEventsBySlug } from '@/lib/actions/event.actions';
import connectDB from '@/lib/mongodb';
import { cacheLife } from 'next/cache';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

type EventDetailsPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const EventDetailItem = ({
  icon,
  alt,
  label
}: {
  icon: string;
  alt: string;
  label: string;
}) => {
  return (
    <div className="flex flex-row gap-2">
      <Image src={icon} alt={alt} width={17} height={17} />
      <p className="flex-row-gap-2 items-center">{label}</p>
    </div>
  );
};

const EventAgenda = ({ agendaItems }: { agendaItems: string[] }) => {
  return (
    <div className="agenda">
      <h2>Agenda</h2>
      <ul className="agenda-items">
        {agendaItems.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
};

const EventTags = ({ tags }: { tags: string[] }) => {
  return (
    <div className="flex flex-row gap-1.5 flex-wrap">
      {tags.map((tag) => (
        <div key={tag} className="pill">
          {tag}
        </div>
      ))}
    </div>
  );
};

async function EventDetailsPage({ params }: EventDetailsPageProps) {
  'use cache';
  cacheLife('hours');

  const { slug } = await params;

  await connectDB();
  const event = await Event.findOne({ slug }).lean<IEvent>();

  if (!event) {
    return notFound();
  }

  const {
    description,
    image,
    overview,
    date,
    time,
    location,
    mode,
    agenda,
    audience,
    organizer,
    tags
  } = event;

  const bookings = 10;
  const similarEvents = await getSimilarEventsBySlug(slug);

  return (
    <section id="event">
      <div className="header">
        <h1>Event Description</h1>
        <p>{description}</p>
      </div>
      <div className="details">
        {/* Left Side - Event Container */}
        <div className="content">
          <Image
            src={image}
            className="banner"
            alt="Event banner"
            width={800}
            height={800}
          />

          <section className="flex-col-gap-2">
            <h2>Overview</h2>
            <p>{overview}</p>
          </section>

          <section className="flex-col-gap-2">
            <h2>Event Details</h2>
            <EventDetailItem
              icon="/icons/calendar.svg"
              alt="Date"
              label={date}
            />

            <EventDetailItem icon="/icons/clock.svg" alt="Time" label={time} />

            <EventDetailItem
              icon="/icons/pin.svg"
              alt="Location"
              label={location}
            />

            <EventDetailItem icon="/icons/mode.svg" alt="Mode" label={mode} />

            <EventDetailItem
              icon="/icons/audience.svg"
              alt="Audience"
              label={audience}
            />
          </section>

          <EventAgenda agendaItems={agenda} />

          <section className="flex-col-gap-2">
            <h2>About the Organizer</h2>
            <p>{organizer}</p>
          </section>

          <EventTags tags={tags} />
        </div>

        {/* Right Side = Booking */}
        <aside className="booking">
          <div className="signup-card">
            <h2>Book Your Spot</h2>
            {bookings > 0 ? (
              <p className="text-sm">
                Join {bookings} people who have already booked this event
              </p>
            ) : (
              <p className="text-sm">Be the first to book this event</p>
            )}

            <BookEvent eventId={event._id.toString()} slug={slug} />
          </div>
        </aside>
      </div>

      <div className="flex w-full flex-col gap-4 pt-20">
        <h2>Similar Events</h2>
        <div className="events">
          {similarEvents.map((event) => (
            <EventCard key={event._id.toString()} {...event} />
          ))}
        </div>
      </div>
    </section>
  );
}

// Simple Suspense wrapper to provide a non-blocking fallback while data loads
export default function PageWrapper(props: EventDetailsPageProps) {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      {/* EventDetailsPage is an async Server Component; Suspense prevents route blocking */}
      <EventDetailsPage {...props} />
    </Suspense>
  );
}
