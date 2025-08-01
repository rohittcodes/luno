import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Add domain to organization
export const addDomain = mutation({
  args: {
    organizationId: v.string(),
    domain: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if domain already exists
    const existing = await ctx.db
      .query("domains")
      .filter(q => q.eq("domain", args.domain))
      .first();

    if (existing) {
      throw new Error("Domain already exists");
    }

    return await ctx.db.insert("domains", {
      id: crypto.randomUUID(),
      organizationId: args.organizationId,
      domain: args.domain,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

// Get organization domains
export const getOrganizationDomains = query({
  args: { organizationId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("domains")
      .filter(q => q.eq("organizationId", args.organizationId))
      .collect();
  },
});

// Update domain status
export const updateDomainStatus = mutation({
  args: {
    domainId: v.string(),
    status: v.union(v.literal("pending"), v.literal("verified"), v.literal("failed")),
    verifiedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const domain = await ctx.db
      .query("domains")
      .filter(q => q.eq("id", args.domainId))
      .first();

    if (domain) {
      await ctx.db.replace(domain._id, {
        ...domain,
        status: args.status,
        verifiedAt: args.verifiedAt,
      });
    }
  },
});

// Remove domain
export const removeDomain = mutation({
  args: { domainId: v.string() },
  handler: async (ctx, args) => {
    const domain = await ctx.db
      .query("domains")
      .filter(q => q.eq("id", args.domainId))
      .first();

    if (domain) {
      await ctx.db.delete(domain._id);
    }
  },
});

// Get domain by ID
export const getDomain = query({
  args: { domainId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("domains")
      .filter(q => q.eq("id", args.domainId))
      .first();
  },
});

// Check if domain is verified
export const isDomainVerified = query({
  args: { domain: v.string() },
  handler: async (ctx, args) => {
    const domain = await ctx.db
      .query("domains")
      .filter(q => q.eq("domain", args.domain))
      .first();

    return domain?.status === "verified";
  },
}); 