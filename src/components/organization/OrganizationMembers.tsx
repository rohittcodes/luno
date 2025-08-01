"use client";

import { useOrganization, useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { OrganizationProfile, OrganizationList } from "@clerk/nextjs";

export default function OrganizationMembers() {
  const { organization } = useOrganization();
  const { user } = useUser();

  const members = useQuery(api.memberships.getOrganizationMembers, {
    organizationId: organization?.id || "",
  });

  const removeMember = useMutation(api.memberships.removeMember);
  const updateMemberRole = useMutation(api.memberships.updateMemberRole);

  const handleRemoveMember = async (userId: string) => {
    if (!organization) return;

    try {
      await removeMember({
        organizationId: organization.id,
        userId,
      });
    } catch (error) {
      console.error("Error removing member", error);
    }
  };

  const handleUpdateRole = async (userId: string, role: "admin" | "member" | "viewer") => {
    if (!organization) return;

    try {
      await updateMemberRole({
        organizationId: organization.id,
        userId,
        role,
      });
    } catch (error) {
      console.error("Error updating role", error);
    }
  };

  if (!organization) return null;

  return (
    <div className="space-y-6">
      {/* Clerk's Organization Management */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Management</CardTitle>
        </CardHeader>
        <CardContent>
          <OrganizationProfile />
        </CardContent>
      </Card>

      {/* Current Members from our database */}
      <Card>
        <CardHeader>
          <CardTitle>Current Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members?.map((member) => (
              <div key={member._id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={member.user?.profileImage} />
                    <AvatarFallback>
                      {member.user?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{member.user?.name}</p>
                    <p className="text-sm text-gray-500">{member.user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={member.role}
                    onValueChange={(value: any) => handleUpdateRole(member.userId, value)}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveMember(member.userId)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 