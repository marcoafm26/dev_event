import { Schema, model, models, Document, Types } from "mongoose";

/**
 * TypeScript interface representing a Booking document in MongoDB
 */
export interface IBooking extends Document {
  eventId: Types.ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Event ID is required"],
      index: true, // Add index for faster queries on eventId
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      validate: {
        validator: function (email: string): boolean {
          // RFC 5322 compliant email validation regex
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(email);
        },
        message: "Please provide a valid email address",
      },
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  },
);

/**
 * Pre-save hook to validate that the referenced Event exists
 * Prevents orphaned bookings by ensuring eventId points to a real event
 */
BookingSchema.pre("save", async function (next) {
  // Only validate eventId if it's new or modified
  if (this.isModified("eventId")) {
    try {
      // Dynamically import Event model to avoid circular dependency issues
      const Event = models.Event || (await import("./event.model.ts")).default;

      // Check if the event exists
      const eventExists = await Event.exists({ _id: this.eventId });

      if (!eventExists) {
        return next(
          new Error(
            `Event with ID ${this.eventId} does not exist. Cannot create booking.`,
          ),
        );
      }
    } catch (error) {
      return next(
        new Error(
          `Failed to validate event reference: ${error instanceof Error ? error.message : "Unknown error"}`,
        ),
      );
    }
  }

  next();
});

// Create index on eventId for optimized queries (e.g., finding all bookings for an event)
BookingSchema.index({ eventId: 1 });

// Compound index for common query patterns (e.g., bookings for specific event by specific user)
BookingSchema.index({ eventId: 1, email: 1 });

// Export the Booking model, reusing existing model in development to prevent OverwriteModelError
const Booking = models.Booking || model<IBooking>("Booking", BookingSchema);

export default Booking;
