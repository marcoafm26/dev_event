import 'dotenv/config';
import connectDB from '../lib/mongodb';
import { Event } from '../database';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import { readFileSync } from 'fs';
import path from 'path';

type SeedEvent = {
  title: string;
  description: string;
  overview: string;
  image: string;
  venue: string;
  location: string;
  date: string; // e.g., 2025-04-10 (will normalize in pre-save)
  time: string; // e.g., 08:30
  mode: 'online' | 'offline' | 'hybrid';
  audience: string;
  organizer: string;
  agenda: string[]; // store JSON string inside first element to match UI usage
  tags: string[]; // store JSON string inside first element to match UI usage
};

const seedEvents: SeedEvent[] = [
  {
    title: 'React Conf 2025',
    description:
      "Google's premier developer event, showcasing innovations in AI, infrastructure, and enterprise solutions.",
    overview:
      'Deep dives into React Server Components, performance, and modern tooling.',
    image: '/images/event1.png',
    venue: 'Moscone West',
    location: 'San Francisco, CA',
    date: '2025-04-10',
    time: '08:30',
    mode: 'hybrid',
    audience: 'Cloud engineers, DevOps, enterprise leaders, AI researchers',
    organizer: 'React Core Team',
    agenda: ['Keynote', 'Breakouts', 'Networking', 'Workshops'],
    // Overlapping tags for similarity queries
    tags: ['react', 'frontend', 'javascript', 'rsc']
  },
  {
    title: 'Frontend Masters Summit',
    description:
      'A curated summit for frontend engineers covering performance, DX, and accessibility.',
    overview:
      'Talks on Web Performance, React Server Components, and design systems.',
    image: '/images/event2.png',
    venue: 'Austin Convention Center',
    location: 'Austin, TX',
    date: '2025-05-12',
    time: '09:00',
    mode: 'offline',
    audience: 'Frontend engineers and tech leads',
    organizer: 'Frontend Masters',
    agenda: ['Opening', 'RSC deep dive', 'A11y lab', 'Panel'],
    // Shares tags with React Conf
    tags: ['react', 'frontend', 'javascript']
  },
  {
    title: 'JS Nation Live',
    description: 'The global JavaScript conference streaming worldwide.',
    overview: 'Latest trends in JS runtimes, frameworks, and tooling.',
    image: '/images/event3.png',
    venue: 'Online Platform',
    location: 'Remote',
    date: '2025-06-20',
    time: '10:00',
    mode: 'online',
    audience: 'JavaScript developers',
    organizer: 'GitNation',
    agenda: ['Welcome', 'Keynote', 'Lightning talks', 'Networking rooms'],
    // Shares some tags
    tags: ['javascript', 'frontend', 'web']
  },
  {
    title: 'Cloud Native Meetup',
    description: 'Meetup for Kubernetes, containers, and cloud-native tooling.',
    overview:
      'Sessions on K8s operators, observability, and platform engineering.',
    image: '/images/event5.png',
    venue: 'Community Hub',
    location: 'Portland, OR',
    date: '2025-03-28',
    time: '18:30',
    mode: 'offline',
    audience: 'Platform engineers and SREs',
    organizer: 'CNCF Portland',
    agenda: ['Introductions', 'Operator patterns', 'Panel', 'Social'],
    tags: ['kubernetes', 'cloud', 'devops']
  }
];

async function main() {
  try {
    await connectDB();

    let created = 0;
    for (const ev of seedEvents) {
      // Skip upload if event exists
      const exists = await Event.exists({ title: ev.title });
      if (exists) {
        console.log(`Skipped existing: ${ev.title}`);
        continue;
      }

      // Read local file from public folder and upload to Cloudinary
      const localPath = path.join(
        process.cwd(),
        'public',
        ev.image.replace(/^\//, '')
      );
      const fileBuffer = readFileSync(localPath);

      const uploadResult = await new Promise<UploadApiResponse>(
        (resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { resource_type: 'image', folder: 'Dev Event' },
            (error, result) => {
              if (error) return reject(error);
              resolve(result as UploadApiResponse);
            }
          );

          uploadStream.end(fileBuffer);
        }
      );

      const imageUrl = uploadResult?.secure_url ?? ev.image;

      await Event.create({ ...ev, image: imageUrl });
      created += 1;
      console.log(`Created: ${ev.title}`);
    }

    console.log(`\n✅ Seeding complete. Created ${created} events.`);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exitCode = 1;
  } finally {
    // Ensure process exits (mongoose connection is cached in dev)
    setTimeout(() => process.exit(0), 200);
  }
}

main();
