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
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      validate: {
        validator: function (email: string): boolean {
          /// Basic email validation regex
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
      const Event = models.Event || (await import("./event.model.js")).default;

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

// Compound index for common query patterns (e.g., bookings for specific event by specific user)
// This index also covers queries on eventId alone via prefix matching
BookingSchema.index({ eventId: 1, email: 1 });

// Export the Booking model, reusing existing model in development to prevent OverwriteModelError
const Booking = models.Booking || model<IBooking>("Booking", BookingSchema);

export default Booking;
