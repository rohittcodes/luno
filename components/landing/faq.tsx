import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const faqs = [
  {
    question: 'How secure is my financial data?',
    answer: 'We use bank-level 256-bit encryption to protect your data. Your information is encrypted both in transit and at rest. We never store your banking credentials - we use secure OAuth connections through trusted financial data providers.'
  },
  {
    question: 'Can I connect multiple bank accounts?',
    answer: 'Yes! You can connect multiple bank accounts, credit cards, and financial institutions. The Free plan includes 1 connection, Pro includes 5 connections, and Family plan includes unlimited connections for all household members.'
  },
  {
    question: 'How does the family sharing work?',
    answer: 'With the Family plan, you can invite up to 5 family members to access shared budgets and goals. Each member maintains their own privacy for personal accounts while collaborating on household finances.'
  },
  {
    question: 'Can I export my data?',
    answer: 'Absolutely! You can export your transaction history, reports, and financial data at any time in CSV or PDF format. Your data belongs to you, and you have full control over it.'
  },
  {
    question: 'Is there a mobile app?',
    answer: 'Yes, Luno is fully responsive and works great on mobile browsers. Native iOS and Android apps are currently in development and will be available soon.'
  }
]

export function FAQ() {
  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-32 md:py-40">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xl sm:text-2xl text-muted-foreground font-medium">
            Everything you need to know about Luno
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border-2 rounded-[1.5rem] px-8 hover:border-primary/30 transition-colors duration-200"
            >
              <AccordionTrigger className="text-left text-lg sm:text-xl font-bold py-6 hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-base sm:text-lg text-muted-foreground leading-relaxed pb-6">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-16 text-center">
          <p className="text-lg text-muted-foreground mb-4">
            Still have questions?
          </p>
          <a
            href="mailto:support@luno.app"
            className="text-lg font-bold text-primary hover:underline"
          >
            Contact our support team
          </a>
        </div>
      </div>
    </section>
  )
}
