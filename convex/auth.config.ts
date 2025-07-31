console.log(process.env.CLERK_ISSUER_DOMAIN)
console.log(process.env.CLERK_APPLICATION_ID)

export default{
    providers: [
        {
            domain: process.env.CLERK_ISSUER_DOMAIN,
            applicationID: "convex",
        }
    ]
}