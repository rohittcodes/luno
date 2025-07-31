'use client'

import Image from 'next/image'
import React from 'react'
import { Button } from './button'
import Link from 'next/link'
import { UserButton, useUser } from '@clerk/nextjs'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
  NavigationMenuViewport,
} from "@/components/ui/navigation-menu"
import { CircleCheckIcon, CircleHelpIcon, CircleIcon } from "lucide-react"

const landingNavbarItems = [
  { 
    title: "Features", 
    href: "#features",
    description: "Explore the powerful features that make our platform stand out."
  },
  { 
    title: "Pricing", 
    href: "#pricing",
    description: "View our transparent pricing plans designed to fit your needs."
  },
  { 
    title: "About", 
    href: "#about",
    description: "Learn more about our company, mission, and team."
  }
]

const useCasesItems = [
  {
    title: "Conferences",
    href: "/use-cases/conferences",
    description: "Organize and manage professional conferences with ease.",
    icon: CircleCheckIcon
  },
  {
    title: "Trade Shows",
    href: "/use-cases/trade-shows",
    description: "Create engaging trade show experiences for exhibitors and attendees.",
    icon: CircleHelpIcon
  },
  {
    title: "Corporate Events",
    href: "/use-cases/corporate-events",
    description: "Streamline your company's internal and external events.",
    icon: CircleIcon
  },
  {
    title: "Workshops & Seminars",
    href: "/use-cases/workshops",
    description: "Facilitate interactive learning experiences and knowledge sharing.",
    icon: CircleCheckIcon
  }
]

const HeroNavbar = () => {
  const { user, isLoaded } = useUser()
  return (
    <div className='flex items-center justify-between px-4 py-4 group fixed z-20 w-full border-b border-dashed bg-white backdrop-blur md:relative dark:bg-zinc-950/50 lg:dark:bg-transparent'>
      <Image src="/logo-name.svg" alt="logo" height={36} width={180} />
      <NavigationMenu>
        <NavigationMenuList>
          {landingNavbarItems.map((item) => (
            <NavigationMenuItem key={item.title}>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <Link href={item.href}>{item.title}</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          ))}
          
          <NavigationMenuItem>
            <NavigationMenuTrigger>Use Cases</NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="p-4">
                <div className="mb-3">
                  <h3 className="text-lg font-medium">Use Cases</h3>
                  <p className="text-sm text-muted-foreground">Discover how our platform can be used in various scenarios.</p>
                </div>
                <ul className="grid w-[400px] gap-3 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                  {useCasesItems.map((item) => (
                    <ListItem
                      key={item.title}
                      title={item.title}
                      href={item.href}
                      icon={item.icon}
                    >
                      {item.description}
                    </ListItem>
                  ))}
                </ul>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
        <NavigationMenuViewport />
      </NavigationMenu>
      <div className='flex items-center space-x-4'>
        {
          isLoaded && user ? (
            <>
              <Link href="/dashboard">
                <Button variant="outline" className="font-medium">
                  Dashboard
                </Button>
              </Link>
              <UserButton />
            </>
          ) : (
            <>
              <Link href="/sign-in">
                <Button variant="outline" className="mr-2">
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button variant="default" className="font-medium">
                  Get Started
                </Button>
              </Link>
            </>
          )
        }
      </div>
    </div>
  )
}

function ListItem({
  title,
  children,
  href,
  icon: Icon,
  ...props
}: React.ComponentPropsWithoutRef<"li"> & { 
  href: string, 
  icon?: React.ComponentType<any> 
}) {
  return (
    <li {...props}>
      <NavigationMenuLink asChild>
        <Link href={href} className="flex gap-3 p-3 select-none rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
          {Icon && <Icon className="h-5 w-5 text-primary" />}
          <div>
            <div className="text-sm leading-none font-medium">{title}</div>
            <p className="text-muted-foreground line-clamp-2 text-sm leading-snug mt-1">
              {children}
            </p>
          </div>
        </Link>
      </NavigationMenuLink>
    </li>
  )
}

export default HeroNavbar
