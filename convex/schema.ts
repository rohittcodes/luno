import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Clerk-authenticated users
  users: defineTable({
    email: v.string(),
    name: v.string(),
    username: v.string(),
    profileImage: v.optional(v.string()),
    bio: v.optional(v.string()),
    clerkId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_clerk_id", ["clerkId"]),

  // Organization (multi-tenant structure)
  organizations: defineTable({
    id: v.string(),
    name: v.string(),
    ownerId: v.string(),
    description: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  // Organization memberships
  memberships: defineTable({
    userId: v.string(),
    organizationId: v.string(),
    role: v.union(
      v.literal("admin"),
      v.literal("member"),
      v.literal("viewer")
    ),
    invitedBy: v.optional(v.string()),
    createdAt: v.number(),
  })
  .index("by_organization_id", ["organizationId"])
  .index("by_user_id", ["userId"]),

  // Role assignments per event (flexible access)
  eventRoles: defineTable({
    eventId: v.string(),
    userId: v.string(),
    role: v.union(
      v.literal("organizer"),
      v.literal("moderator"),
      v.literal("speaker"),
      v.literal("staff")
    ),
    assignedBy: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_event_id", ["eventId"]),

  // Email logs
  emails: defineTable({
    to: v.string(),
    subject: v.string(),
    body: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("sent"), v.literal("failed")),
    type: v.string(), // e.g. "welcome", "event_registration", "invite"
    relatedEventId: v.optional(v.string()),
    sentAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_status", ["status"]),

  // Event core data
  events: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    organizerId: v.string(),
    startTime: v.number(),
    endTime: v.number(),
    location: v.optional(v.string()),
    virtual: v.boolean(),
    branding: v.optional(v.object({
      logoUrl: v.optional(v.string()),
      themeColor: v.optional(v.string()),
    })),
    agenda: v.array(v.object({
      title: v.string(),
      description: v.optional(v.string()),
      startTime: v.number(),
      endTime: v.number(),
      sessionId: v.optional(v.string()),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  // Sessions inside events
  sessions: defineTable({
    eventId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    speakers: v.array(v.string()),
    type: v.union(v.literal("main"), v.literal("breakout"), v.literal("webinar")),
    videoUrl: v.optional(v.string()),
    materialsUrls: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  // Meetings (e.g. 1:1 or group)
  meetings: defineTable({
    eventId: v.string(),
    hostId: v.string(),
    participantIds: v.array(v.string()),
    scheduledTime: v.number(),
    durationMinutes: v.number(),
    status: v.union(
      v.literal("scheduled"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    joinUrl: v.string(),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  // Ticket types for events
  tickets: defineTable({
    eventId: v.string(),
    type: v.union(v.literal("free"), v.literal("paid")),
    price: v.number(),
    currency: v.optional(v.string()),
    availability: v.number(),
    description: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  // Event attendance
  attendees: defineTable({
    eventId: v.string(),
    userId: v.string(),
    ticketId: v.optional(v.string()),
    checkInStatus: v.union(v.literal("not_checked_in"), v.literal("checked_in")),
    virtualAttendance: v.boolean(),
    feedbackSubmitted: v.boolean(),
    registeredAt: v.number(),
  }),

  // Expo booths
  expoBooths: defineTable({
    eventId: v.string(),
    sponsorName: v.string(),
    logoUrl: v.optional(v.string()),
    description: v.optional(v.string()),
    resourceUrls: v.optional(v.array(v.string())),
    contacts: v.object({
      name: v.string(),
      email: v.string(),
      phone: v.optional(v.string()),
      repIds: v.array(v.string()),
    }),
    chatEnabled: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  // Live polls
  polls: defineTable({
    eventId: v.string(),
    sessionId: v.optional(v.string()),
    question: v.string(),
    options: v.array(v.object({
      text: v.string(),
      votes: v.number(),
    })),
    isActive: v.boolean(),
    createdAt: v.number(),
  }),

  // Session or event Q&A
  questions: defineTable({
    eventId: v.string(),
    sessionId: v.optional(v.string()),
    userId: v.string(),
    text: v.string(),
    votes: v.number(),
    isAnswered: v.boolean(),
    createdAt: v.number(),
  }),

  // Engagement leaderboard
  leaderboard: defineTable({
    eventId: v.string(),
    userId: v.string(),
    points: v.number(),
    lastUpdated: v.number(),
  }),

  // RSVP tracking
  rsvps: defineTable({
    eventId: v.string(),
    userId: v.string(),
    status: v.string(), // e.g. "going", "interested", "not_going"
    createdAt: v.number(),
    updatedAt: v.number(),
  }),
});
