import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const syncOrganization = mutation({
    args: {
        id: v.string(),
        name: v.string(),
        ownerId: v.string(),
        createdAt: v.number(),
        updatedAt: v.number(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("organizations")
            .filter(q => q.eq("id", args.id))
            .first();

        if (!existing) {
            await ctx.db.insert("organizations", {
                ...args,
                description: "",
                logoUrl: "",
            });
        }
    },
});

export const updateOrganization = mutation({
    args: {
        id: v.string(),
        name: v.string(),
        updatedAt: v.number(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("organizations")
            .filter(q => q.eq("id", args.id))
            .first();

        if (existing) {
            await ctx.db.replace(existing._id, {
                ...existing,
                name: args.name,
                updatedAt: args.updatedAt,
            });
        }
    },
});

export const deleteOrganization = mutation({
    args: {
        id: v.string(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("organizations")
            .filter(q => q.eq("id", args.id))
            .first();

        if (existing) {
            await ctx.db.delete(existing._id);
        }
    },
});
