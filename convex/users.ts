import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const syncUser = mutation({
    args: {
        clerkId: v.string(),
        username: v.string(),
        email: v.string(),
        name: v.string(),
        profileImage: v.string(),
        createdAt: v.number(),
        updatedAt: v.number(),
    },

    handler: async (ctx, args) => {
        const existingUser = await ctx.db.query("users").filter((q) => q.eq("clerkId", args.clerkId)).first();
        if(existingUser) {
            return;
        }

        const user = await ctx.db.insert("users", {
            clerkId: args.clerkId,
            username: args.username,
            email: args.email,
            name: args.name,
            profileImage: args.profileImage,
            createdAt: args.createdAt,
            updatedAt: args.updatedAt,
        })
        return user;
    }
})

export const updateUser = mutation({
    args: {
        clerkId: v.string(),
        name: v.optional(v.string()),
        profileImage: v.optional(v.string()),
        bio: v.optional(v.string()),
    },

    handler: async (ctx, args) => {
        const existingUser = await ctx.db.query("users").filter((q) => q.eq("clerkId", args.clerkId)).first();
        if(existingUser) {
            const user = await ctx.db.replace(existingUser._id, {
                ...existingUser,
                name: args.name ?? existingUser.name,
                profileImage: args.profileImage ?? existingUser.profileImage,
                bio: args.bio ?? existingUser.bio,
                updatedAt: Date.now(),
            })
            return user;
        }
    }
})

export const deleteUser = mutation({
    args: {
        clerkId: v.string(),
    },

    handler: async (ctx, args) => {
        const existingUser = await ctx.db.query("users").filter((q) => q.eq("clerkId", args.clerkId)).first();
        if(existingUser) {
            await ctx.db.delete(existingUser._id);
        }
    }
})