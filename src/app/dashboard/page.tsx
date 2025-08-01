import { CreateOrganization, OrganizationList } from '@clerk/nextjs'
import React from 'react'
import OrganizationMembers from '@/components/organization/OrganizationMembers'

const DashboardPage = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-4">Organization Dashboard</h1>
        <CreateOrganization />
        <OrganizationList />
      </div>
      
      <OrganizationMembers />
    </div>
  )
}

export default DashboardPage