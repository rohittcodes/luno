import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server"
import { WebhookEvent } from "@clerk/nextjs/server"
import { Webhook } from "svix";
import { api } from "./_generated/api";

const http = httpRouter();

http.route({
    path: "/clerk-webhook",
    method: "POST",
    handler: httpAction(async (ctx, req) => {
        const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
        if (!webhookSecret) {
            throw new Error("CLERK_WEBHOOK_SECRET not set");
        }

        const svix_id = req.headers.get("svix-id");
        const svix_timestamp = req.headers.get("svix-timestamp");
        const svix_signature = req.headers.get("svix-signature");

        if (!svix_id || !svix_timestamp || !svix_signature) {
            return new Response("svix headers not set", { status: 400 });
        }

        const payload = await req.json();
        const body = JSON.stringify(payload);

        const wh = new Webhook(webhookSecret);
        let event: WebhookEvent;
        try {
            event = wh.verify(body, {
                "svix-id": svix_id,
                "svix-timestamp": svix_timestamp,
                "svix-signature": svix_signature,
            }) as WebhookEvent;
        } catch (e) {
            return new Response("svix verification failed", { status: 400 });
        }

        if (event.type === "organization.created") {
            const org = event.data;
            try {
                await ctx.runMutation(api.organizations.syncOrganization, {
                    id: org.id,
                    name: org.name,
                    ownerId: org.created_by ?? '',
                    createdBy: org.created_by ?? '',
                    createdAt: org.created_at,
                    updatedAt: org.updated_at,
                });
            } catch (error) {
                console.error("Error syncing organization", error);
                return new Response("Error syncing organization", { status: 500 });
            }
        }

        if (event.type === "organization.updated") {
            const org = event.data;
            try {
                await ctx.runMutation(api.organizations.updateOrganization, {
                    id: org.id,
                    name: org.name,
                    updatedAt: org.updated_at,
                });
            } catch (error) {
                console.error("Error updating organization", error);
                return new Response("Error updating organization", { status: 500 });
            }
        }

        if (event.type === "organization.deleted") {
            const org = event.data;
            try {
                await ctx.runMutation(api.organizations.deleteOrganization, {
                    id: org.id ?? '',
                });
            } catch (error) {
                console.error("Error deleting organization", error);
                return new Response("Error deleting organization", { status: 500 });
            }
        }

        // Handle membership events
        if (event.type === "organizationMembership.created") {
            const membership = event.data;
            try {
                // Map Clerk roles to our schema roles
                const roleMap: Record<string, "admin" | "member" | "viewer"> = {
                    "org:admin": "admin",
                    "org:member": "member", 
                    "org:viewer": "viewer",
                    "admin": "admin",
                    "member": "member",
                    "viewer": "viewer"
                };
                
                const mappedRole = roleMap[membership.role] || "member";
                
                await ctx.runMutation(api.memberships.addMember, {
                    organizationId: membership.organization.id,
                    userId: membership.public_user_data.user_id,
                    role: mappedRole,
                    invitedBy: membership.created_at?.toString() || '',
                });
            } catch (error) {
                // If user is already a member, that's fine - just log it
                if (error instanceof Error && error.message?.includes("already a member")) {
                    console.log("User already a member, skipping duplicate creation");
                } else {
                    console.error("Error syncing membership", error);
                    return new Response("Error syncing membership", { status: 500 });
                }
            }
        }

        if (event.type === "organizationMembership.updated") {
            const membership = event.data;
            try {
                // Map Clerk roles to our schema roles
                const roleMap: Record<string, "admin" | "member" | "viewer"> = {
                    "org:admin": "admin",
                    "org:member": "member", 
                    "org:viewer": "viewer",
                    "admin": "admin",
                    "member": "member",
                    "viewer": "viewer"
                };
                
                const mappedRole = roleMap[membership.role] || "member";
                
                await ctx.runMutation(api.memberships.updateMemberRole, {
                    organizationId: membership.organization.id,
                    userId: membership.public_user_data.user_id,
                    role: mappedRole,
                });
            } catch (error) {
                console.error("Error updating membership", error);
                return new Response("Error updating membership", { status: 500 });
            }
        }

        if (event.type === "organizationMembership.deleted") {
            const membership = event.data;
            try {
                await ctx.runMutation(api.memberships.removeMember, {
                    organizationId: membership.organization.id,
                    userId: membership.public_user_data.user_id,
                });
            } catch (error) {
                console.error("Error removing membership", error);
                return new Response("Error removing membership", { status: 500 });
            }
        }

        // Handle invitation events
        if (event.type === "organizationInvitation.created") {
            const invitation = event.data;
            try {
                // Map Clerk roles to our schema roles
                const roleMap: Record<string, "admin" | "member" | "viewer"> = {
                    "org:admin": "admin",
                    "org:member": "member", 
                    "org:viewer": "viewer",
                    "admin": "admin",
                    "member": "member",
                    "viewer": "viewer"
                };
                
                const mappedRole = roleMap[invitation.role] || "member";
                
                await ctx.runMutation(api.invitations.createInvitation, {
                    organizationId: invitation.organization_id,
                    email: invitation.email_address,
                    role: mappedRole,
                    invitedBy: invitation.created_at?.toString() || '',
                });
            } catch (error) {
                console.error("Error creating invitation", error);
                return new Response("Error creating invitation", { status: 500 });
            }
        }

        if (event.type === "organizationInvitation.revoked") {
            const invitation = event.data;
            try {
                await ctx.runMutation(api.invitations.revokeInvitation, {
                    invitationId: invitation.id,
                });
            } catch (error) {
                console.error("Error revoking invitation", error);
                return new Response("Error revoking invitation", { status: 500 });
            }
        }

        if (event.type === "user.created") {
            try {
                const user = event.data;
                await ctx.runMutation(api.users.syncUser, {
                    clerkId: user.id,
                    username: user.username ?? '',
                    email: user.email_addresses[0].email_address,
                    name: user.first_name + " " + user.last_name,
                    profileImage: user.image_url,
                    createdAt: user.created_at,
                    updatedAt: user.updated_at,
                })
            } catch (error) {
                console.error("Error syncing user", error);
                return new Response("Error syncing user", { status: 500 });
            }
        }

        if (event.type === "user.updated") {
            try {
                const user = event.data;
                await ctx.runMutation(api.users.updateUser, {
                    clerkId: user.id,
                    name: user.first_name + " " + user.last_name,
                    profileImage: user.image_url,
                })
            } catch (error) {
                console.error("Error syncing user", error);
                return new Response("Error syncing user", { status: 500 });
            }
        }

        if (event.type === "user.deleted") {
            try {
                const user = event.data;
                await ctx.runMutation(api.users.deleteUser, {
                    clerkId: user.id ?? '',
                })
            } catch (error) {
                console.error("Error deleting user", error);
                return new Response("Error deleting user", { status: 500 });
            }
        }
        return new Response("OK", { status: 200 });
    })
})

export default http;