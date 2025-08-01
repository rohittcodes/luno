import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get organization members
export const getOrganizationMembers = query({
  args: { organizationId: v.string() },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("memberships")
      .filter(q => q.eq("organizationId", args.organizationId))
      .collect();

    const userIds = memberships.map(m => m.userId);
    const users = await Promise.all(
      userIds.map(userId => 
        ctx.db.query("users").filter(q => q.eq("clerkId", userId)).first()
      )
    );

    return memberships.map((membership, index) => ({
      ...membership,
      user: users[index],
    }));
  },
});

// Add member to organization
export const addMember = mutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    role: v.union(v.literal("admin"), v.literal("member"), v.literal("viewer")),
    invitedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("memberships")
      .filter(q => 
        q.and(
          q.eq("organizationId", args.organizationId),
          q.eq("userId", args.userId)
        )
      )
      .first();

    if (existing) {
      throw new Error("User is already a member of this organization");
    }

    return await ctx.db.insert("memberships", {
      organizationId: args.organizationId,
      userId: args.userId,
      role: args.role,
      invitedBy: args.invitedBy,
      createdAt: Date.now(),
    });
  },
});

// Remove member from organization
export const removeMember = mutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("memberships")
      .filter(q => 
        q.and(
          q.eq("organizationId", args.organizationId),
          q.eq("userId", args.userId)
        )
      )
      .first();

    if (membership) {
      await ctx.db.delete(membership._id);
    }
  },
});

// Update member role
export const updateMemberRole = mutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    role: v.union(v.literal("admin"), v.literal("member"), v.literal("viewer")),
  },
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("memberships")
      .filter(q => 
        q.and(
          q.eq("organizationId", args.organizationId),
          q.eq("userId", args.userId)
        )
      )
      .first();

    if (membership) {
      await ctx.db.replace(membership._id, {
        ...membership,
        role: args.role,
      });
    }
  },
});

// Check if user is member of organization
export const isMember = query({
  args: {
    organizationId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("memberships")
      .filter(q => 
        q.and(
          q.eq("organizationId", args.organizationId),
          q.eq("userId", args.userId)
        )
      )
      .first();

    return !!membership;
  },
});

// Get user's role in organization
export const getUserRole = query({
  args: {
    organizationId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("memberships")
      .filter(q => 
        q.and(
          q.eq("organizationId", args.organizationId),
          q.eq("userId", args.userId)
        )
      )
      .first();

    return membership?.role || null;
  },
}); 