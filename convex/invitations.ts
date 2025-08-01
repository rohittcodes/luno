import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create invitation
export const createInvitation = mutation({
  args: {
    organizationId: v.string(),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("member"), v.literal("viewer")),
    invitedBy: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user is already a member
    const user = await ctx.db
      .query("users")
      .filter(q => q.eq("email", args.email))
      .first();

    if (user) {
      const isMember = await ctx.db
        .query("memberships")
        .filter(q => 
          q.and(
            q.eq("organizationId", args.organizationId),
            q.eq("userId", user.clerkId)
          )
        )
        .first();

      if (isMember) {
        throw new Error("User is already a member of this organization");
      }
    }

    // Check for existing pending invitation
    const existingInvitation = await ctx.db
      .query("invitations")
      .filter(q => 
        q.and(
          q.eq("organizationId", args.organizationId),
          q.eq("email", args.email),
          q.eq("status", "pending")
        )
      )
      .first();

    if (existingInvitation) {
      throw new Error("Invitation already exists for this email");
    }

    const invitationId = crypto.randomUUID();
    const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days

    return await ctx.db.insert("invitations", {
      id: invitationId,
      organizationId: args.organizationId,
      email: args.email,
      role: args.role,
      invitedBy: args.invitedBy,
      status: "pending",
      createdAt: Date.now(),
      expiresAt,
    });
  },
});

// Get organization invitations
export const getOrganizationInvitations = query({
  args: { organizationId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("invitations")
      .filter(q => q.eq("organizationId", args.organizationId))
      .collect();
  },
});

// Accept invitation
export const acceptInvitation = mutation({
  args: {
    invitationId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const invitation = await ctx.db
      .query("invitations")
      .filter(q => q.eq("id", args.invitationId))
      .first();

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    if (invitation.status !== "pending") {
      throw new Error("Invitation is no longer pending");
    }

    if (Date.now() > invitation.expiresAt) {
      throw new Error("Invitation has expired");
    }

    // Update invitation status
    await ctx.db.replace(invitation._id, {
      ...invitation,
      status: "accepted",
    });

    // Add user to organization
    return await ctx.db.insert("memberships", {
      organizationId: invitation.organizationId,
      userId: args.userId,
      role: invitation.role,
      invitedBy: invitation.invitedBy,
      createdAt: Date.now(),
    });
  },
});

// Revoke invitation
export const revokeInvitation = mutation({
  args: { invitationId: v.string() },
  handler: async (ctx, args) => {
    const invitation = await ctx.db
      .query("invitations")
      .filter(q => q.eq("id", args.invitationId))
      .first();

    if (invitation) {
      await ctx.db.replace(invitation._id, {
        ...invitation,
        status: "revoked",
      });
    }
  },
});

// Get invitation by ID
export const getInvitation = query({
  args: { invitationId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("invitations")
      .filter(q => q.eq("id", args.invitationId))
      .first();
  },
});

// Get invitation by email and organization
export const getInvitationByEmail = query({
  args: {
    organizationId: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("invitations")
      .filter(q => 
        q.and(
          q.eq("organizationId", args.organizationId),
          q.eq("email", args.email),
          q.eq("status", "pending")
        )
      )
      .first();
  },
}); 